import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type SwagoMoneyDepositProps = {
  name: string;
  amount: number;
  reason: string;
  shopUrl?: string;
};

/** Currently disabled in production (manual-deposit route). Kept for preview / future re-enable. */
export default function SwagoMoneyDeposit({
  name,
  amount,
  reason,
  shopUrl = "https://swagojr.com",
}: SwagoMoneyDepositProps) {
  const year = new Date().getFullYear();
  return (
    <Html>
      <Head />
      <Preview>You just received Swago Money!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Congratulations, {name || "Swago Fam"}! 🎉</Heading>
          <Text style={paragraph}>
            Great news! Your Swago Jr. account has just been credited with{" "}
            <strong>${amount} Swago Money</strong>.
          </Text>
          <Section style={box}>
            <Text style={boxText}>
              <strong>Reason:</strong> {reason}
            </Text>
          </Section>
          <Text style={paragraph}>
            You can use this money directly towards your next purchase of our premium products!
          </Text>
          <Section style={ctaWrap}>
            <Button style={cta} href={shopUrl}>
              Shop Now
            </Button>
          </Section>
          <Text style={footer}>
            If you have any questions, please reply to this email.
            <br />© {year} Swago Jr. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily: "sans-serif",
  padding: "20px 0",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  padding: "30px",
  borderRadius: "8px",
  border: "1px solid #eaeaea",
};

const heading = {
  color: "#1e3a8a",
  textAlign: "center" as const,
  fontSize: "22px",
};

const paragraph = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "1.5",
};

const box = {
  backgroundColor: "#f3f4f6",
  padding: "15px",
  borderRadius: "6px",
  margin: "20px 0",
};

const boxText = {
  margin: 0,
  color: "#4b5563",
  fontSize: "14px",
};

const ctaWrap = {
  textAlign: "center" as const,
  marginTop: "30px",
};

const cta = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "12px 24px",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: "bold" as const,
  display: "inline-block",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "30px",
};
