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

export type LotteryWinnerProps = {
  name: string;
  amount: number;
  ticketCode: string;
  shopUrl?: string;
};

/** Currently disabled in production (lottery-draws route). Kept for preview / future re-enable. */
export default function LotteryWinner({
  name,
  amount,
  ticketCode,
  shopUrl = "https://swagojr.com",
}: LotteryWinnerProps) {
  const year = new Date().getFullYear();
  return (
    <Html>
      <Head />
      <Preview>You won the Swago Jr. Lottery!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Congratulations, {name || "Swago Fam"}! 🏆</Heading>
          <Text style={paragraph}>
            Amazing news! You have been selected as a winner in this week&apos;s Swago Jr. Lottery
            Draw!
          </Text>
          <Section style={box}>
            <Text style={boxText}>
              <strong>Prize Credited:</strong> ${amount} Swago Money
            </Text>
            <Text style={{ ...boxText, margin: "5px 0 0" }}>
              <strong>Winning Ticket:</strong> {ticketCode}
            </Text>
          </Section>
          <Text style={paragraph}>
            Your reward has already been deposited directly into your account and is ready to use on
            your next purchase!
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
