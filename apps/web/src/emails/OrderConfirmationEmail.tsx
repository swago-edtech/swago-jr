import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  productId?: string | number;
}

export interface OrderConfirmationEmailProps {
  name: string;
  orderNumber: string;
  orderDate: string;
  email: string;
  items: OrderItem[];
  subtotal: string;
  discount: string;
  swagoMoneyRedeemed?: string;
  shipping: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// Ensure the styles are perfectly responsive
// For emails, standard practice is setting max-width on containers and 100% width, using margins effectively.
export default function OrderConfirmationEmail({
  name,
  orderNumber,
  orderDate,
  items,
  subtotal,
  discount,
  swagoMoneyRedeemed,
  shipping,
  totalAmount,
  paymentMethod,
  paymentStatus,
  address,
  city,
  state,
  pincode,
}: OrderConfirmationEmailProps) {
  const logoUrl =
    'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq';

  const isCOD = paymentMethod?.toLowerCase().includes('cod') || paymentMethod?.toLowerCase().includes('cash');
  const paymentMethodLabel = isCOD ? 'Cash on Delivery' : 'Online (Prepaid)';
  const totalAmountLabel = isCOD ? 'Amount to Pay on Delivery' : 'Amount Paid';

  const isPaid = paymentStatus?.toLowerCase() === 'successful' || paymentStatus?.toLowerCase() === 'paid';
  const statusColor = isPaid ? '#10b981' : '#f59e0b';
  const statusIcon = isPaid ? '✓ ' : 'ℹ ';

  const totalDiscount = Number(discount || 0) + Number(swagoMoneyRedeemed || 0);

  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Preview>Your Swago Jr. Order #{orderNumber} has been confirmed!</Preview>
      <Body style={mainStyle}>
        <Container style={containerWrapper}>

          {/* Header section */}
          <Section style={headerBrandSection}>
            <Img
              src={logoUrl}
              width="140"
              alt="Swago Jr. Logo"
              style={logoStyle}
            />
          </Section>

          {/* Main Card */}
          <Container style={innerCardContainer}>
            {/* Banner/Hero area */}
            <Section style={heroSection}>
              <Heading style={heroHeading}>Order Confirmed 🎈</Heading>
              <Text style={heroText}>
                Hi {name}, we're getting everything ready for you! We will notify you once your order has been shipped out.
              </Text>
            </Section>

            {/* Quick Summary Grid */}
            <Section style={gridSection}>
              <Row style={gridRowStyle}>
                <Column style={gridColumnLeft}>
                  <Text style={metaLabel}>Order No.</Text>
                  <Text style={metaValue}>#{orderNumber}</Text>
                </Column>
                <Column style={gridColumnRight}>
                  <Text style={metaLabel}>Date</Text>
                  <Text style={metaValue}>{orderDate}</Text>
                </Column>
              </Row>
              <Row style={gridRowStyle}>
                <Column style={gridColumnLeft}>
                  <Text style={metaLabel}>Payment Method</Text>
                  <Text style={metaValue}>{paymentMethodLabel}</Text>
                </Column>
                <Column style={gridColumnRight}>
                  <Text style={metaLabel}>Status</Text>
                  <Text style={{ ...metaValue, color: statusColor }}>
                    {statusIcon} {paymentStatus}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={dividerStyle} />

            {/* Items Purchased */}
            <Section style={itemsSection}>
              <Heading as="h2" style={sectionTitle}>What's in the Box?</Heading>
              {items && items.length > 0 ? items.map((item, index) => (
                <Row key={index} style={itemLayoutRow}>
                  <Column style={itemThumbCol}>
                    <Img
                      src={item.image || 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq'}
                      width="54"
                      height="54"
                      alt={item.name}
                      style={itemThumbImage}
                    />
                  </Column>
                  <Column style={itemDescCol}>
                    <Text style={itemTitle}>{item.name}</Text>
                    <Text style={itemSub}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={itemCalcCol}>
                    <Text style={itemTotalCalc}>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</Text>
                  </Column>
                </Row>
              )) : (
                <Text style={infoText}>Your order items could not be displayed.</Text>
              )}
            </Section>

            {/* Billing Breakup */}
            <Section style={billingSection}>
              <Row style={billingRow}>
                <Column>
                  <Text style={billingKey}>Subtotal</Text>
                </Column>
                <Column style={alignRight}>
                  <Text style={billingValue}>₹{Number(subtotal).toFixed(2)}</Text>
                </Column>
              </Row>

              {Number(discount) > 0 && (
                <Row style={billingRow}>
                  <Column>
                    <Text style={billingKey}>Discount</Text>
                  </Column>
                  <Column style={alignRight}>
                    <Text style={billingDiscount}>- ₹{Number(discount).toFixed(2)}</Text>
                  </Column>
                </Row>
              )}

              {Number(swagoMoneyRedeemed) > 0 && (
                <Row style={billingRow}>
                  <Column>
                    <Text style={billingKey}>Swago Money Applied</Text>
                  </Column>
                  <Column style={alignRight}>
                    <Text style={billingDiscount}>- ₹{Number(swagoMoneyRedeemed).toFixed(2)}</Text>
                  </Column>
                </Row>
              )}

              <Row style={billingRow}>
                <Column>
                  <Text style={billingKey}>Shipping</Text>
                </Column>
                <Column style={alignRight}>
                  <Text style={billingValue}>{Number(shipping) === 0 ? 'Free' : `₹${Number(shipping).toFixed(2)}`}</Text>
                </Column>
              </Row>

              <Hr style={billDivider} />

              <Row style={finalTotalRow}>
                <Column>
                  <Text style={finalTotalKey}>{totalAmountLabel}</Text>
                </Column>
                <Column style={alignRight}>
                  <Text style={finalTotalValue}>₹{Number(totalAmount).toFixed(2)}</Text>
                </Column>
              </Row>

              {totalDiscount > 0 && (
                <Section style={savingsBadgeContainer}>
                  <Text style={savingsBadgeText}>
                    🎉 Awesome! You saved ₹{totalDiscount.toFixed(2)} on this order.
                  </Text>
                </Section>
              )}
            </Section>

            <Hr style={dividerStyle} />

            {/* Delivery Address */}
            <Section style={addressSection}>
              <Heading as="h2" style={sectionTitle}>Delivery Details</Heading>
              <Text style={addressBlock}>
                <span style={addressName}>{name}</span><br />
                {address}<br />
                {city}, {state} - {pincode}
              </Text>
            </Section>

          </Container>

          {/* Simple Clean Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Got questions? We're here to help at <a href="mailto:support@swagojr.com" style={footerLink}>support@swagojr.com</a>
            </Text>
            <Text style={brandFooter}>
              © {new Date().getFullYear()} Swago Junior. Learning playfully.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ----------------------------------------------------
// AESTHETICS & RESPONSIVE STYLES
// ----------------------------------------------------

const mainStyle = {
  backgroundColor: '#f3f4f6', // Tailwind gray-100
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0',
  padding: '0',
};

const containerWrapper = {
  margin: '0 auto',
  padding: '40px 10px',
  maxWidth: '800px',
  width: '100%',
};

const headerBrandSection = {
  padding: '0 0 24px 0',
  textAlign: 'center' as const,
};

const logoStyle = {
  display: 'inline-block',
  margin: '0 auto',
};

// Container Card
const innerCardContainer = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
};

// Hero Area
const heroSection = {
  backgroundColor: '#4f46e5', // Tailwind indigo-600
  padding: '40px 24px',
  textAlign: 'center' as const,
};

const heroHeading = {
  color: '#ffffff',
  margin: '0 0 12px 0',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '-0.5px',
};

const heroText = {
  color: '#e0e7ff', // indigo-100
  margin: '0',
  fontSize: '16px',
  lineHeight: '24px',
};

// Grid Section for Quick Info
const gridSection = {
  padding: '32px 24px 16px 24px',
};

const gridRowStyle = {
  marginBottom: '20px',
};

const gridColumnLeft = {
  width: '50%',
  paddingRight: '12px',
};

const gridColumnRight = {
  width: '50%',
  paddingLeft: '12px',
};

const metaLabel = {
  margin: '0 0 4px 0',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: '#6b7280', // gray-500
  fontWeight: '700',
};

const metaValue = {
  margin: '0',
  fontSize: '15px',
  color: '#111827', // gray-900
  fontWeight: '600',
};

// Layout dividers
const dividerStyle = {
  borderTop: '1px dashed #e5e7eb', // dashed gray-200
  margin: '0 24px',
};

// Items Area
const itemsSection = {
  padding: '24px 24px 8px 24px',
};

const sectionTitle = {
  margin: '0 0 20px 0',
  fontSize: '18px',
  color: '#111827', // gray-900
  fontWeight: '700',
};

const itemLayoutRow = {
  marginBottom: '16px',
};

const itemThumbCol = {
  width: '64px',
  verticalAlign: 'top' as const,
};

const itemThumbImage = {
  borderRadius: '12px',
  border: '1px solid #f3f4f6',
  objectFit: 'contain' as const,
  display: 'block',
};

const itemDescCol = {
  paddingLeft: '16px',
  verticalAlign: 'top' as const,
};

const itemTitle = {
  margin: '0 0 4px 0',
  fontSize: '15px',
  fontWeight: '600',
  color: '#1f2937', // gray-800
};

const itemSub = {
  margin: '0',
  fontSize: '14px',
  color: '#6b7280', // gray-500
};

const itemCalcCol = {
  width: '90px',
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
};

const itemTotalCalc = {
  margin: '0',
  fontSize: '15px',
  fontWeight: '600',
  color: '#1f2937',
};

const infoText = {
  color: '#6b7280',
  fontSize: '14px',
};

// Billing Breakdown
const billingSection = {
  padding: '16px 24px 32px 24px',
  backgroundColor: '#f9fafb', // gray-50
  borderRadius: '12px',
  margin: '0 24px 24px 24px',
};

const billingRow = {
  marginBottom: '10px',
};

const alignRight = {
  textAlign: 'right' as const,
};

const billingKey = {
  margin: '0',
  fontSize: '14px',
  color: '#4b5563', // gray-600
};

const billingValue = {
  margin: '0',
  fontSize: '14px',
  fontWeight: '500',
  color: '#1f2937', // gray-800
};

const billingDiscount = {
  margin: '0',
  fontSize: '14px',
  fontWeight: '600',
  color: '#10b981', // emerald-500
};

const billDivider = {
  borderTop: '1px solid #e5e7eb', // solid gray-200
  margin: '12px 0',
};

const finalTotalRow = {
  marginTop: '4px',
};

const finalTotalKey = {
  margin: '0',
  fontSize: '16px',
  fontWeight: '700',
  color: '#111827',
};

const finalTotalValue = {
  margin: '0',
  fontSize: '18px',
  fontWeight: '800',
  color: '#4f46e5', // indigo-600
};

const savingsBadgeContainer = {
  marginTop: '16px',
  padding: '10px',
  backgroundColor: '#ecfdf5', // emerald-50
  borderRadius: '8px',
  border: '1px solid #a7f3d0', // emerald-200
  textAlign: 'center' as const,
};

const savingsBadgeText = {
  margin: '0',
  fontSize: '13px',
  fontWeight: '600',
  color: '#059669', // emerald-600
};

// Address block
const addressSection = {
  padding: '24px 24px 32px 24px',
};

const addressBlock = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '26px',
  color: '#4b5563', // gray-600
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  padding: '16px',
  borderRadius: '8px',
};

const addressName = {
  fontWeight: '700',
  color: '#111827',
};

// Out-of-card Footer
const footerSection = {
  marginTop: '24px',
  textAlign: 'center' as const,
  padding: '0 24px',
};

const footerText = {
  margin: '0 0 12px 0',
  fontSize: '14px',
  color: '#6b7280',
};

const footerLink = {
  color: '#4f46e5',
  textDecoration: 'none',
  fontWeight: '600',
};

const brandFooter = {
  margin: '0',
  fontSize: '12px',
  color: '#9ca3af', // gray-400
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};