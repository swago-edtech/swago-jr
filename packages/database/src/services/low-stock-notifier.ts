import InventoryItem from "../models/InventoryItem";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_EMAIL_API = "https://control.msg91.com/api/v5/email/send";
const MSG91_LEGACY_TEMPLATE = "swagojr_order_confirmation2";

interface LowStockInfo {
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
}

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildStockRowsHtml(items: LowStockInfo[]): string {
  return items
    .map((item) => {
      const out = Number(item.currentStock) <= 0;
      const stockBadge = out
        ? `<span style="display:inline-block;background:#dc2626;color:#ffffff;font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;">0 · Out of stock</span>`
        : `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;border:1px solid #fecaca;">${item.currentStock}</span>`;
      return `<tr>
  <td style="padding:12px;font-size:13px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">${escapeHtml(item.name)}</td>
  <td style="padding:12px;font-size:12px;font-family:ui-monospace,monospace;color:#4b5563;border-top:1px solid #f3f4f6;">${escapeHtml(item.sku || "—")}</td>
  <td align="center" style="padding:12px;border-top:1px solid #f3f4f6;">${stockBadge}</td>
  <td align="center" style="padding:12px;font-size:13px;color:#4b5563;border-top:1px solid #f3f4f6;">${item.lowStockThreshold}</td>
  <td align="right" style="padding:12px;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;">${escapeHtml(item.unit)}</td>
</tr>`;
    })
    .join("\n");
}

/**
 * Queries all active inventory items that have fallen at or below their
 * low-stock threshold and sends a consolidated admin email listing them.
 */
export async function checkAndNotifyLowStock(
  adminEmail?: string
): Promise<{ sent: boolean; items: LowStockInfo[] }> {
  const email = adminEmail || process.env.ADMIN_EMAIL || "shipping.swago@gmail.com";

  const docs = await InventoryItem.find({
    isActive: true,
    lowStockThreshold: { $gt: 0 },
  })
    .sort({ currentStock: 1 })
    .lean();

  const allItems: Array<{
    name: string;
    sku?: string;
    currentStock: number;
    lowStockThreshold: number;
    unit?: string;
  }> = docs.map((d: any) => ({
    name: d.name,
    sku: d.sku,
    currentStock: d.currentStock ?? 0,
    lowStockThreshold: d.lowStockThreshold ?? 0,
    unit: d.unit,
  }));

  const lowItems = allItems.filter(
    (i) => i.currentStock <= i.lowStockThreshold
  );

  if (!lowItems.length) {
    return { sent: false, items: [] };
  }

  const items: LowStockInfo[] = lowItems.map((i) => ({
    name: i.name,
    sku: i.sku || "",
    currentStock: i.currentStock,
    lowStockThreshold: i.lowStockThreshold,
    unit: i.unit || "pcs",
  }));

  try {
    await sendLowStockEmail(email, items);
    return { sent: true, items };
  } catch (error) {
    console.error("❌ Failed to send low-stock notification email:", error);
    return { sent: false, items };
  }
}

async function sendLowStockEmail(
  toEmail: string,
  items: LowStockInfo[]
): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    console.warn("⚠️ MSG91_AUTH_KEY not configured — low-stock email not sent");
    return;
  }

  const dedicatedId = process.env.MSG91_TPL_LOW_STOCK?.trim();
  const stockRows = buildStockRowsHtml(items);

  let payload: Record<string, unknown>;

  if (dedicatedId) {
    payload = {
      recipients: [
        {
          to: [{ email: toEmail, name: "Swago Admin" }],
          variables: {
            item_count: String(items.length),
            stock_rows_html: stockRows,
          },
        },
      ],
      from: {
        email: "no-reply@support.swagojr.com",
        name: "Swago",
      },
      domain: "support.swagojr.com",
      template_id: dedicatedId,
    };
  } else {
    // Legacy html_body path — same visual family as templates/msg91/low-stock.html
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f2f4f7">
<table align="center" width="620" cellpadding="0" cellspacing="0" style="margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #fecaca">
<tr><td style="background:#d92d20;padding:24px 20px;text-align:center;color:#fff">
  <div style="font-size:22px;font-weight:700;margin-bottom:6px">⚠️ Low Stock Alert</div>
  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.95)">Inventory items have fallen below their low-stock threshold</p>
</td></tr>
<tr><td style="background:#fef2f2;padding:10px 16px;text-align:center;font-size:13px;color:#7f1d1d;border-top:1px solid #fecaca;border-bottom:1px solid #fecaca">
  <strong style="display:inline-block;background:#d92d20;color:#fff;padding:2px 8px;border-radius:4px;margin-right:6px">${items.length}</strong>
  items need replenishment attention
</td></tr>
<tr><td style="padding:16px 18px">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <tr style="background:#f9fafb">
      <th align="left" style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Item</th>
      <th align="left" style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">SKU</th>
      <th align="center" style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Stock</th>
      <th align="center" style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Threshold</th>
      <th align="right" style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Unit</th>
    </tr>
${stockRows}
  </table>
  <p style="font-size:13px;color:#374151;margin:14px 0 0">Please review and arrange replenishment at the earliest convenience.</p>
  <p style="margin:12px 0 0"><a href="https://admin.swagojr.com/inventory" style="display:inline-block;background:#8859ee;color:#fff;font-size:12px;font-weight:600;text-decoration:none;padding:10px 14px;border-radius:8px">Review Inventory in Portal →</a></p>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e5e7eb">
  <p style="margin:0;font-size:12px;color:#94a3b8">Swago Operations System · Automated Internal Alert</p>
</td></tr>
</table>
</body>
</html>`;

    payload = {
      recipients: [
        {
          to: [{ email: toEmail, name: "Swago Admin" }],
          variables: {
            html_body: htmlContent,
            items: htmlContent,
          },
        },
      ],
      from: {
        email: "no-reply@support.swagojr.com",
        name: "Swago",
      },
      domain: "support.swagojr.com",
      template_id: MSG91_LEGACY_TEMPLATE,
    };
  }

  const response = await fetch(MSG91_EMAIL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: MSG91_AUTH_KEY!,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `MSG91 low-stock email failed: ${response.status} ${JSON.stringify(body)}`
    );
  }

  console.log(
    `✅ Low-stock alert sent to ${toEmail} (${items.length} item${items.length === 1 ? "" : "s"})`
  );
}
