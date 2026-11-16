/**
 * Credential detection from environment. Secrets stay in process env — never returned to the browser.
 */

import type { SellerPlatform } from "./types";

export type SellerEnvStatus = {
  amazon: boolean;
  flipkart: boolean;
};

export function readAmazonCredentials(): { clientId: string; clientSecret: string; refreshToken: string } | null {
  const clientId = String(process.env.AMAZON_SP_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.AMAZON_SP_CLIENT_SECRET || "").trim();
  const refreshToken = String(process.env.AMAZON_SP_REFRESH_TOKEN || "").trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function readFlipkartCredentials(): { appId: string; appSecret: string } | null {
  const appId = String(process.env.FLIPKART_APP_ID || "").trim();
  const appSecret = String(process.env.FLIPKART_APP_SECRET || "").trim();
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

export function sellerEnvStatus(): SellerEnvStatus {
  return {
    amazon: !!readAmazonCredentials(),
    flipkart: !!readFlipkartCredentials(),
  };
}

export function isPlatformConfigured(platform: SellerPlatform): boolean {
  return platform === "amazon" ? !!readAmazonCredentials() : !!readFlipkartCredentials();
}

/** Missing-variable names only — never values. */
export function missingEnvNames(platform: SellerPlatform): string[] {
  if (platform === "amazon") {
    const missing: string[] = [];
    if (!String(process.env.AMAZON_SP_CLIENT_ID || "").trim()) missing.push("AMAZON_SP_CLIENT_ID");
    if (!String(process.env.AMAZON_SP_CLIENT_SECRET || "").trim()) missing.push("AMAZON_SP_CLIENT_SECRET");
    if (!String(process.env.AMAZON_SP_REFRESH_TOKEN || "").trim()) missing.push("AMAZON_SP_REFRESH_TOKEN");
    return missing;
  }
  const missing: string[] = [];
  if (!String(process.env.FLIPKART_APP_ID || "").trim()) missing.push("FLIPKART_APP_ID");
  if (!String(process.env.FLIPKART_APP_SECRET || "").trim()) missing.push("FLIPKART_APP_SECRET");
  return missing;
}
