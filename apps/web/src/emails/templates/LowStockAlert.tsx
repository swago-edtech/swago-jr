import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type LowStockItem = {
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
};

export type LowStockAlertProps = {
  items: LowStockItem[];
};

/** Mirrors the HTML built in packages/database low-stock-notifier. */
export default function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Low stock alert — ${items.length} inventory item${items.length === 1 ? "" : "s"} need attention`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>⚠️ Low Stock Alert</Heading>
            <Text style={headerSub}>
              Inventory items have fallen below their low-stock threshold
            </Text>
          </Section>

          <Section style={content}>
            <Text style={intro}>
              The following <strong style={{ color: "#dc2626" }}>{items.length}</strong> inventory
              item{items.length === 1 ? "" : "s"} need{items.length === 1 ? "s" : ""} attention:
            </Text>

            <table width="100%" cellPadding={0} cellSpacing={0} style={table}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {["Item", "SKU", "Stock", "Threshold", "Unit"].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600, color: "#1e293b", textAlign: "left" }}>
                      {item.name}
                    </td>
                    <td style={td}>{item.sku || "—"}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#dc2626" }}>{item.currentStock}</td>
                    <td style={td}>{item.lowStockThreshold}</td>
                    <td style={td}>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Text style={footerNote}>
              Please review and arrange replenishment at the earliest convenience.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Swago Inventory System · Automated Alert</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  margin: 0,
  padding: 0,
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  background: "#f8fafc",
};

const container = {
  margin: "40px auto",
  background: "#fff",
  borderRadius: "16px",
  overflow: "hidden" as const,
  width: "600px",
  maxWidth: "100%",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
};

const header = {
  background: "#dc2626",
  padding: "28px 36px",
  textAlign: "center" as const,
};

const headerTitle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 800,
  color: "#fff",
};

const headerSub = {
  margin: "8px 0 0",
  fontSize: "14px",
  color: "rgba(255,255,255,0.85)",
  fontWeight: 500,
};

const content = { padding: "24px 28px" };

const intro = {
  fontSize: "15px",
  color: "#334155",
  margin: "0 0 8px",
};

const table = {
  borderCollapse: "collapse" as const,
  width: "100%",
  marginTop: "12px",
};

const th = {
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#475569",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const td = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "13px",
  color: "#64748b",
  textAlign: "center" as const,
};

const footerNote = {
  fontSize: "13px",
  color: "#64748b",
  margin: "16px 0 0",
  padding: "12px 0 0",
  borderTop: "1px solid #e5e7eb",
};

const footer = {
  background: "#f8fafc",
  padding: "16px 28px",
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  margin: 0,
  fontSize: "12px",
  color: "#94a3b8",
};
