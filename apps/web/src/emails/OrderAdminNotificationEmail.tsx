import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type AdminOrderItem = {
  name: string;
  quantity: number;
  price: string;
};

export type AdminOrderEmailProps = {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: string;
  paymentMethod: string;
  totalAmount: string;
  subtotal: string;
  discount: string;
  swagoMoneyRedeemed: string;
  shippingFee: string;
  couponCode?: string;
  items: AdminOrderItem[];
  adminUrl: string;
};

export const OrderAdminNotificationEmail = ({
  orderNumber = "SW-TEST-001",
  orderDate = "22/07/2026",
  customerName = "John Doe",
  customerEmail = "john@example.com",
  customerPhone = "+919876543210",
  shippingMethod = "Standard Shipping",
  paymentMethod = "Cash on Delivery",
  totalAmount = "1008.00",
  subtotal = "1000.00",
  discount = "42.00",
  couponCode = "SAVE10",
  swagoMoneyRedeemed = "0.00",
  shippingFee = "50.00",
  items = [
    {
      name: "Seek Rush, Focus Building Board Game for Kids",
      quantity: 1,
      price: "951.43",
    },
  ],
  adminUrl = "https://admin.swagojr.com",
}: AdminOrderEmailProps) => {
  const previewText = `New Order on Swago! - Order ID: ${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logoText}>SWAGO ADMIN</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={paragraph}>
              Congratulations, you have a new order! 
            </Text>
            <Text style={paragraph}>
              <strong>Customer:</strong> {customerName} ({customerEmail}, {customerPhone})
            </Text>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={adminUrl}>
                View Order in Admin Panel
              </Button>
            </Section>

            <Text style={sectionTitle}>Order Summary</Text>
            <Hr style={hr} />

            <Text style={detailText}>
              <strong>Order ID:</strong> {orderNumber}
              <br />
              <strong>Order date:</strong> {orderDate}
            </Text>

            <Text style={detailText}>
              <strong>Payment Method:</strong> {paymentMethod}
              <br />
              <strong>Subtotal:</strong> INR {subtotal}
              <br />
              <strong>Discount{couponCode ? ` (${couponCode})` : ''}:</strong> -INR {discount}
              <br />
              <strong>Swago Money Redeemed:</strong> -INR {swagoMoneyRedeemed}
              <br />
              <strong>Shipping Fee:</strong> INR {shippingFee}
              <br />
              <strong>Total Amount:</strong> INR {totalAmount}
            </Text>

            <Text style={sectionTitle}>Items Ordered</Text>
            <Hr style={hr} />

            {items.map((item, index) => (
              <Section key={index} style={itemSection}>
                <Text style={detailText}>
                  <strong>Item:</strong> {item.name}
                  <br />
                  <strong>Quantity:</strong> {item.quantity}
                  <br />
                  <strong>Price:</strong> INR {item.price}
                </Text>
              </Section>
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderAdminNotificationEmail;

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily: "Inter, Arial, sans-serif",
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  width: "600px",
  maxWidth: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
};

const headerSection = {
  backgroundColor: "#111827",
  padding: "20px",
  textAlign: "center" as const,
};

const logoText = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: 0,
  letterSpacing: "2px",
};

const contentSection = {
  padding: "30px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 15px 0",
};

const buttonContainer = {
  display: "flex",
  justifyContent: "center",
  margin: "30px 0",
  textAlign: "center" as const,
};

const primaryButton = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "12px 24px",
  fontSize: "15px",
  textDecoration: "none",
  fontWeight: "bold",
  borderRadius: "6px",
  display: "inline-block",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#111827",
  marginTop: "30px",
  marginBottom: "15px",
};

const detailText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0",
};

const itemSection = {
  marginTop: "15px",
  paddingTop: "15px",
  borderTop: "1px dashed #e5e7eb",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "0 0 15px 0",
};
