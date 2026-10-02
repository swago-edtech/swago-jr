import { NextRequest, NextResponse } from "next/server";
import mongoose, { isValidObjectId } from "mongoose";
import {
  connectDB,
  Product,
  ProductConfig,
  InventoryItem,
  InventoryTransaction,
  syncAffectedProducts,
} from "@swago/database";
import { requireAdmin } from "@/lib/auth";

type ComponentLine = {
  inventoryItemId: { toString(): string; _id?: { toString(): string }; name?: string; currentStock?: number; unit?: string; isActive?: boolean } | string;
  inventoryItemName?: string;
  quantity: number;
};

type MergedComponent = {
  inventoryItemId: string;
  name: string;
  unit: string;
  perUnit: number;
  currentStock: number;
  missing: boolean;
  inactive: boolean;
};

function itemIdOf(component: ComponentLine): string {
  const raw = component.inventoryItemId;
  if (raw && typeof raw === "object") {
    return (raw._id || raw).toString();
  }
  return String(raw || "");
}

function mergeComponents(components: ComponentLine[]): MergedComponent[] {
  const merged = new Map<string, MergedComponent>();

  for (const component of components) {
    const item = component.inventoryItemId;
    const populated = item && typeof item === "object" ? item : null;
    const inventoryItemId = itemIdOf(component);
    const perUnit = Number(component.quantity) || 0;
    const existing = merged.get(inventoryItemId);

    if (existing) {
      existing.perUnit += perUnit;
      continue;
    }

    merged.set(inventoryItemId, {
      inventoryItemId,
      name: populated?.name || component.inventoryItemName || "Item",
      unit: populated?.unit || "pcs",
      perUnit,
      currentStock: typeof populated?.currentStock === "number" ? populated.currentStock : 0,
      missing: !populated,
      inactive: populated?.isActive === false,
    });
  }

  return [...merged.values()];
}

function unitsFromComponents(components: MergedComponent[]) {
  let units = Infinity;
  let limitingComponent: string | null = null;
  let incomplete = false;

  for (const component of components) {
    if (component.missing || component.perUnit <= 0) {
      incomplete = true;
      limitingComponent = component.name;
      units = 0;
      break;
    }
    const possible = Math.floor(component.currentStock / component.perUnit);
    if (possible < units) {
      units = possible;
      limitingComponent = component.name;
    }
  }

  if (units === Infinity) units = 0;
  return { unitsAvailable: units, limitingComponent, incomplete };
}

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const configs = await ProductConfig.find({
      isActive: true,
      "components.0": { $exists: true },
    })
      .populate({
        path: "components.inventoryItemId",
        model: InventoryItem,
        select: "name currentStock unit isActive",
      })
      .lean();

    const activeProducts = await Product.find({
      _id: { $in: configs.map((config) => config.productId) },
      isActive: true,
    })
      .select("name")
      .lean();
    const activeById = new Map(
      activeProducts.map((product) => [String(product._id), product.name as string])
    );

    const products = configs
      .flatMap((config) => {
        const productId = config.productId.toString();
        const productName = activeById.get(productId);
        if (!productName) return [];

        const components = mergeComponents(config.components as ComponentLine[]);
        return [{
          productId,
          productName,
          ...unitsFromComponents(components),
          components,
        }];
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));

    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const productId = String(body.productId || "");
    const quantity = Number(body.quantity);
    const reason = String(body.reason || "").trim();

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ error: "Choose a product" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a whole number of at least 1" }, { status: 400 });
    }

    const product = await Product.findOne({ _id: productId, isActive: true }).select("name");
    if (!product) {
      return NextResponse.json({ error: "Choose an active product" }, { status: 400 });
    }

    const config = await ProductConfig.findOne({ productId, isActive: true });
    if (!config?.components?.length) {
      return NextResponse.json(
        { error: "This product has no inventory configuration" },
        { status: 400 }
      );
    }

    const totals = new Map<string, { quantity: number; name: string }>();
    for (const component of config.components) {
      const itemId = component.inventoryItemId.toString();
      const deduction = Number(component.quantity) * quantity;
      const existing = totals.get(itemId);
      totals.set(itemId, {
        quantity: (existing?.quantity ?? 0) + deduction,
        name: component.inventoryItemName || existing?.name || "Item",
      });
    }

    const ids = [...totals.keys()];
    const existingItems = await InventoryItem.find({ _id: { $in: ids } }).select("_id name");
    if (existingItems.length !== ids.length) {
      return NextResponse.json(
        { error: "One of this product's inventory items no longer exists" },
        { status: 400 }
      );
    }

    const note = reason || `Manual deduction: ${product.name} × ${quantity}`;
    const performedBy = session.name || "Admin";

    const applyDeductions = async (dbSession?: mongoose.ClientSession) => {
      const applied: Array<{
        inventoryItemId: string;
        name: string;
        quantity: number;
        previousStock: number;
        newStock: number;
      }> = [];

      for (const [itemId, line] of totals) {
        const updated = await InventoryItem.findOneAndUpdate(
          { _id: itemId },
          { $inc: { currentStock: -line.quantity } },
          { new: true, session: dbSession }
        );
        if (!updated) {
          throw new Error(`Could not deduct ${line.name}`);
        }

        const previousStock = updated.currentStock + line.quantity;
        await InventoryTransaction.create(
          [
            {
              inventoryItemId: updated._id,
              inventoryItemName: updated.name,
              type: "deduction",
              quantity: line.quantity,
              previousStock,
              newStock: updated.currentStock,
              productName: product.name,
              reason: note,
              performedBy,
            },
          ],
          dbSession ? { session: dbSession } : undefined
        );

        applied.push({
          inventoryItemId: updated._id.toString(),
          name: updated.name,
          quantity: line.quantity,
          previousStock,
          newStock: updated.currentStock,
        });
      }

      return applied;
    };

    let deductions;
    const dbSession = await mongoose.startSession();
    try {
      try {
        await dbSession.withTransaction(async () => {
          deductions = await applyDeductions(dbSession);
        });
      } catch (txnError) {
        const txnMessage = txnError instanceof Error ? txnError.message : "";
        const standalone = txnMessage.includes("Transaction numbers are only allowed");
        if (!standalone) throw txnError;
        deductions = await applyDeductions();
      }
    } finally {
      await dbSession.endSession();
    }

    if (!deductions) {
      return NextResponse.json({ error: "Failed to deduct stock" }, { status: 500 });
    }

    try {
      await syncAffectedProducts(ids);
    } catch (syncError) {
      console.error("Manual deduction saved, product stock sync failed:", syncError);
    }

    return NextResponse.json({
      success: true,
      productName: product.name,
      quantity,
      deductions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to deduct stock";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
