import { NextResponse } from "next/server";
import { connectDB, InternationalConfig } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

// Only countries the storefront can validate addresses for (and charge in) may be
// configured. IN is the domestic default row (INR, rate 1). Anything else is rejected.
const ALLOWED_INTL = new Set(["IN", "US", "CA", "AE"]);
const EXPECTED_CURRENCY: Record<string, string> = { IN: "INR", US: "USD", CA: "CAD", AE: "AED" };

function validateCountries(input: unknown[]): { ok: true; countries: Record<string, unknown>[] } | { ok: false; error: string } {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const raw of input) {
    const c = (raw || {}) as Record<string, unknown>;
    const code = String(c.code || "").trim().toUpperCase();
    if (!ALLOWED_INTL.has(code)) return { ok: false, error: `Unsupported country "${code || "?"}". Allowed: IN, US, CA, AE.` };
    if (seen.has(code)) return { ok: false, error: `Duplicate country ${code}` };
    seen.add(code);
    const currency = String(c.currency || "").trim().toUpperCase();
    if (currency !== EXPECTED_CURRENCY[code]) return { ok: false, error: `${code} must use ${EXPECTED_CURRENCY[code]} (got "${currency}")` };
    const rate = Number(c.exchangeRate);
    if (code === "IN" && rate !== 1) return { ok: false, error: "IN must have exchange rate 1 (the ledger is INR)" };
    if (!Number.isFinite(rate) || rate <= 0 || rate > 10) return { ok: false, error: `${code}: exchange rate must be a positive number (1 INR = x ${currency})` };
    const fee = Number(c.shippingFee ?? 0);
    if (!Number.isFinite(fee) || fee < 0) return { ok: false, error: `${code}: shipping fee must be ≥ 0` };
    const tiers = Array.isArray(c.shippingTiers) ? c.shippingTiers : [];
    for (const t of tiers) {
      const tier = (t || {}) as Record<string, unknown>;
      const min = Number(tier.minWeight), max = Number(tier.maxWeight), tf = Number(tier.fee);
      if (![min, max, tf].every(Number.isFinite) || min < 0 || max < min || tf < 0) {
        return { ok: false, error: `${code}: invalid shipping tier` };
      }
    }
    out.push({ ...c, code, currency, exchangeRate: rate, shippingFee: fee });
  }
  return { ok: true, countries: out };
}

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    let config = await InternationalConfig.findOne({ isSingleton: true });
    
    if (!config) {
      config = await InternationalConfig.create({ isSingleton: true });
    }
    
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error("Error fetching international config:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    await connectDB();
    const { supportedCountries } = await req.json();

    if (!supportedCountries || !Array.isArray(supportedCountries)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }
    const checked = validateCountries(supportedCountries);
    if (!checked.ok) {
      return NextResponse.json({ success: false, error: checked.error }, { status: 400 });
    }

    let config = await InternationalConfig.findOne({ isSingleton: true });
    
    if (!config) {
      config = await InternationalConfig.create({ isSingleton: true, supportedCountries: checked.countries });
    } else {
      config.supportedCountries = checked.countries;
      await config.save();
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error("Error updating international config:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
