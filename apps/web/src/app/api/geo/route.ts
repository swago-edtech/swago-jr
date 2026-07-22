import { NextResponse } from "next/server";
import { connectDB, InternationalConfig } from "@swago/database";

let cachedConfig: any = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getConfig() {
  const now = Date.now();
  if (cachedConfig && now < cacheExpiry) return cachedConfig;

  await connectDB();
  let config = await InternationalConfig.findOne({ isSingleton: true }).lean();
  if (!config) {
    const newConfig = await InternationalConfig.create({ isSingleton: true });
    config = newConfig.toObject();
  }

  cachedConfig = config;
  cacheExpiry = now + CACHE_TTL;
  return config;
}

export async function GET() {
  try {
    const config = await getConfig();

    const countries = (config.supportedCountries || []).filter(
      (c: any) => c.isActive
    );

    return NextResponse.json({
      success: true,
      countries,
    });
  } catch (error) {
    console.error("Geo config error:", error);
    return NextResponse.json({
      success: true,
      countries: [{
        code: "IN",
        name: "India",
        currency: "INR",
        currencySymbol: "₹",
        phonePrefix: "+91",
        shippingFee: 0,
        isDefault: true,
        isActive: true,
        exchangeRate: 1,
      }],
    });
  }
}
