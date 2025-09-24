import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

// Using 'export default function' is a cleaner pattern
export default function OrderConfirmationEmail({
  customerName,
  orderId,
  orderDate,
  totalAmount,
  items,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Swago Junior Order Confirmation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your order!</Heading>
          <Text style={text}>
            Hi {customerName}, we're getting your order ready. We will notify you once it has been shipped.
          </Text>
          <Hr style={hr} />
          <Heading as="h2" style={h2}>Order Details</Heading>
          <Text style={text}>
            <strong>Order ID:</strong> {orderId}
            <br />
            <strong>Order Date:</strong> {orderDate}
          </Text>
          <Hr style={hr} />
          <Heading as="h2" style={h2}>Items Purchased</Heading>
          {items.map((item, index) => (
            <Text key={index} style={itemText}>
              - {item.name} (x{item.quantity}) - ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          ))}
          <Hr style={hr} />
          <Text style={totalText}>
            <strong>Total: ₹{totalAmount}</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// --- Basic Inline Styles for the Email ---
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0fयो',
  borderRadius: '4px',
};
const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  padding: '0 20px',
};
const h2 = {
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold',
    padding: '0 20px',
};
const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 20px',
};
const itemText = {
    ...text,
    lineHeight: '18px',
}
const totalText = {
    ...text,
    fontWeight: 'bold',
    textAlign: 'right' as const,
}
const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};