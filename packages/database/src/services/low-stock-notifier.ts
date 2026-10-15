import InventoryItem from "../models/InventoryItem";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_EMAIL_API = "https://control.msg91.com/api/v5/email/send";

interface LowStockInfo {
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
}

/**
 * Queries all active inventory items that have fallen at or below their
 * low-stock threshold and sends a consolidated admin email listing them.
 *
 * Returns { sent, items } where `sent` is true if an email was actually
 * dispatched (i.e. at least one item was low), and `items` is the list
 * of low-stock items found.
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

  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1e293b">${escapeHtml(i.name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;text-align:center">${escapeHtml(i.sku || "\u2014")}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#dc2626;text-align:center">${i.currentStock}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;text-align:center">${i.lowStockThreshold}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;text-align:center">${escapeHtml(i.unit)}</td>
        </tr>`
    )
    .join("\n");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc">
<table align="center" width="600" cellpadding="0" cellspacing="0" style="margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="padding:0">
  <div style="background:#dc2626;padding:28px 36px;text-align:center">
    <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.01em">⚠️ Low Stock Alert</h1>
    <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:500">Inventory items have fallen below their low-stock threshold</p>
  </div>
  <div style="padding:24px 28px">
    <p style="font-size:15px;color:#334155;margin:0 0 8px">The following <strong style="color:#dc2626">${items.length}</strong> inventory item${items.length === 1 ? "" : "s"} need${items.length === 1 ? "s" : ""} attention:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:12px">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:left;text-transform:uppercase;letter-spacing:0.05em">Item</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">SKU</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">Stock</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">Threshold</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">Unit</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <p style="font-size:13px;color:#64748b;margin:16px 0 0;padding:12px 0 0;border-top:1px solid #e5e7eb">Please review and arrange replenishment at the earliest convenience.</p>
  </div>
  <div style="background:#f8fafc;padding:16px 28px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:12px;color:#94a3b8">Swago Inventory System &middot; Automated Alert</p>
  </div>
</td></tr></table>
</body>
</html>`;

  const payload = {
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
    template_id: "swagojr_order_confirmation2",
  };

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
      (body as any).message || `MSG91 returned ${response.status}`
    );
  }

  console.log(
    `📧 Low-stock alert sent to ${toEmail} — ${items.length} item(s) below threshold`
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}