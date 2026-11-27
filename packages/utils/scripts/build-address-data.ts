/**
 * Builds the postal/state lookup tables used by the server-side address validator.
 *
 * Usage (from repo root):
 *   npx tsx packages/utils/scripts/build-address-data.ts <data-src-dir>
 *
 * <data-src-dir> must contain the unzipped GeoNames files (see
 * packages/utils/src/address/data/README.md for exact URLs):
 *   IN/IN.txt   US/US.txt   CA/CA.txt   (download.geonames.org/export/zip/)
 *   gnAE/AE.txt                       (download.geonames.org/export/dump/AE.zip)
 *
 * The script never invents data: every row in the output comes from a source
 * row, plus the small, documented overrides listed in OVERRIDES below.
 */
import fs from "node:fs";
import path from "node:path";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Usage: tsx build-address-data.ts <data-src-dir>");
  process.exit(1);
}
const outDir = path.join(__dirname, "..", "src", "address", "data");

function readTsv(rel: string): string[][] {
  const file = path.join(srcDir, rel);
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l) => l.split("\t"));
}

// ---------------------------------------------------------------- India
// GeoNames IN admin1 names -> ISO 3166-2:IN codes (current list, 2020+).
const IN_STATE_MAP: Record<string, string> = {
  "Andaman & Nicobar Islands": "IN-AN",
  "Andhra Pradesh": "IN-AP",
  "Arunachal Pradesh": "IN-AR",
  Assam: "IN-AS",
  Bihar: "IN-BR",
  Chandigarh: "IN-CH",
  Chhattisgarh: "IN-CG",
  "Dadra and Nagar Haveli and Daman and Diu": "IN-DH",
  "Dadra & Nagar Haveli": "IN-DH",
  "Daman & Diu": "IN-DH",
  Delhi: "IN-DL",
  Goa: "IN-GA",
  Gujarat: "IN-GJ",
  Haryana: "IN-HR",
  "Himachal Pradesh": "IN-HP",
  "Jammu & Kashmir": "IN-JK",
  Jharkhand: "IN-JH",
  Karnataka: "IN-KA",
  Kerala: "IN-KL",
  Ladakh: "IN-LA",
  Lakshadweep: "IN-LD",
  "Madhya Pradesh": "IN-MP",
  Maharashtra: "IN-MH",
  Manipur: "IN-MN",
  Meghalaya: "IN-ML",
  Mizoram: "IN-MZ",
  Nagaland: "IN-NL",
  Odisha: "IN-OD",
  Orissa: "IN-OD",
  Pondicherry: "IN-PY",
  Puducherry: "IN-PY",
  Punjab: "IN-PB",
  Rajasthan: "IN-RJ",
  Sikkim: "IN-SK",
  "Tamil Nadu": "IN-TN",
  Telangana: "IN-TS",
  Telengana: "IN-TS",
  Tripura: "IN-TR",
  "Uttar Pradesh": "IN-UP",
  Uttarakhand: "IN-UK",
  "West Bengal": "IN-WB",
};
// OVERRIDE (documented in README): GeoNames still files Leh and Kargil under
// Jammu & Kashmir; since 31 Oct 2019 they form the Union Territory of Ladakh.
const LADAKH_DISTRICTS = new Set(["leh", "leh ladakh", "ladakh", "kargil"]);

function buildIndia() {
  const rows = readTsv("IN/IN.txt");
  const pinStates = new Map<number, Set<string>>();
  const unknownNames = new Set<string>();
  for (const r of rows) {
    const pin = r[1]?.trim();
    const stateName = r[3]?.trim();
    const district = (r[5] || "").trim().toLowerCase();
    if (!/^[1-9]\d{5}$/.test(pin)) continue;
    let code = IN_STATE_MAP[stateName];
    if (!code) {
      unknownNames.add(stateName);
      continue;
    }
    if (code === "IN-JK" && LADAKH_DISTRICTS.has(district)) code = "IN-LA";
    const n = Number(pin);
    if (!pinStates.has(n)) pinStates.set(n, new Set());
    pinStates.get(n)!.add(code);
  }
  if (unknownNames.size) {
    throw new Error(`Unmapped IN state names: ${[...unknownNames].join(", ")}`);
  }
  // Encode as state -> compact ranges "a-b,c"
  const byState: Record<string, number[]> = {};
  for (const [pin, states] of pinStates) {
    for (const s of states) (byState[s] ||= []).push(pin);
  }
  const out: Record<string, string> = {};
  for (const s of Object.keys(byState).sort()) {
    const pins = byState[s].sort((a, b) => a - b);
    const parts: string[] = [];
    let start = pins[0];
    let prev = pins[0];
    for (let i = 1; i <= pins.length; i++) {
      const p = pins[i];
      if (p === prev + 1) {
        prev = p;
        continue;
      }
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = p;
      prev = p;
    }
    out[s] = parts.join(",");
  }
  return { table: out, pins: pinStates.size, rows: rows.length };
}

// ---------------------------------------------------------------- USA
const US_STATES_AND_DC = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ")
);
function buildUS() {
  const rows = readTsv("US/US.txt");
  const zip3: Record<string, Set<string>> = {};
  const military = new Set<string>();
  for (const r of rows) {
    const zip = r[1]?.trim();
    const st = (r[4] || "").trim();
    if (!/^\d{5}$/.test(zip)) continue;
    const z3 = zip.slice(0, 3);
    if (!st || st === "AA" || st === "AE" || st === "AP") {
      military.add(z3);
      continue;
    }
    // Territories / freely associated states (PR, VI, GU, MP, AS, MH, FM, PW)
    // are out of scope: only the 50 states + DC are shippable.
    if (!US_STATES_AND_DC.has(st)) continue;
    (zip3[z3] ||= new Set()).add(`US-${st}`);
  }
  const out: Record<string, string[]> = {};
  for (const z of Object.keys(zip3).sort()) out[z] = [...zip3[z]].sort();
  // A ZIP3 is "military only" when no civilian state row shares it (e.g. 968 is Honolulu + FPO).
  const militaryOnly = [...military].filter((z) => !out[z]).sort();
  return { table: out, military: militaryOnly, rows: rows.length };
}

// ---------------------------------------------------------------- Canada
const CA_PROV: Record<string, string> = {
  AB: "CA-AB", BC: "CA-BC", MB: "CA-MB", NB: "CA-NB", NL: "CA-NL", NS: "CA-NS",
  NT: "CA-NT", NU: "CA-NU", ON: "CA-ON", PE: "CA-PE", QC: "CA-QC", SK: "CA-SK", YT: "CA-YT",
};
function buildCA() {
  const rows = readTsv("CA/CA.txt");
  const fsa: Record<string, Set<string>> = {};
  const unknown = new Set<string>();
  for (const r of rows) {
    const code = r[1]?.trim().toUpperCase();
    const pr = (r[4] || "").trim();
    if (!/^[A-Z]\d[A-Z]$/.test(code)) continue;
    const iso = CA_PROV[pr];
    if (!iso) {
      unknown.add(pr);
      continue;
    }
    (fsa[code] ||= new Set()).add(iso);
  }
  if (unknown.size) throw new Error(`Unmapped CA province codes: ${[...unknown].join(", ")}`);
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(fsa).sort()) out[k] = [...fsa[k]].sort();
  return { table: out, rows: rows.length };
}

// ---------------------------------------------------------------- UAE
const AE_ADMIN1: Record<string, string> = {
  "01": "AE-AZ", "02": "AE-AJ", "03": "AE-DU", "04": "AE-FU", "05": "AE-RK", "06": "AE-SH", "07": "AE-UQ",
};
// Only real settlements; neighbourhood (PPLX), historical and abandoned
// features are excluded so generic district names cannot cause rejections.
const AE_FEATURE_CODES = new Set(["PPL", "PPLA", "PPLA2", "PPLA3", "PPLC", "PPLS", "PPLF", "PPLL"]);
// OVERRIDES (documented in README): GeoNames admin1 is wrong for these towns.
const AE_OVERRIDES: Record<string, string[]> = {
  "dibba al hisn": ["AE-SH"],
  // Emirate names typed as the city.
  "abu dhabi": ["AE-AZ"],
  ajman: ["AE-AJ"],
  dubai: ["AE-DU"],
  fujairah: ["AE-FU"],
  "ras al khaimah": ["AE-RK"],
  sharjah: ["AE-SH"],
  "umm al quwain": ["AE-UQ"],
  "al ain": ["AE-AZ"],
};

export function normalizeAeCity(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bcity\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAE() {
  const rows = readTsv("gnAE/AE.txt");
  const cities: Record<string, Set<string>> = {};
  let used = 0;
  for (const r of rows) {
    if (r[6] !== "P" || !AE_FEATURE_CODES.has(r[7])) continue;
    const emirate = AE_ADMIN1[r[10]];
    if (!emirate) continue;
    used++;
    for (const name of [r[1], r[2]]) {
      const key = normalizeAeCity(name || "");
      if (key.length < 3) continue;
      (cities[key] ||= new Set()).add(emirate);
    }
  }
  for (const [k, v] of Object.entries(AE_OVERRIDES)) cities[k] = new Set(v);
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(cities).sort()) out[k] = [...cities[k]].sort();
  return { table: out, used, rows: rows.length };
}

const IN = buildIndia();
const US = buildUS();
const CA = buildCA();
const AE = buildAE();

const version = `geonames-${process.env.ADDRESS_DATA_DATE || new Date().toISOString().slice(0, 10)}`;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "in-pincodes.json"), JSON.stringify(IN.table) + "\n");
fs.writeFileSync(path.join(outDir, "us-zip3.json"), JSON.stringify({ zip3: US.table, military: US.military }) + "\n");
fs.writeFileSync(path.join(outDir, "ca-fsa.json"), JSON.stringify(CA.table) + "\n");
fs.writeFileSync(path.join(outDir, "ae-cities.json"), JSON.stringify(AE.table) + "\n");
fs.writeFileSync(path.join(outDir, "version.json"), JSON.stringify({ version }, null, 2) + "\n");

console.log(`version ${version}`);
console.log(`IN: ${IN.rows} rows -> ${IN.pins} unique pincodes, ${Object.keys(IN.table).length} states/UTs`);
console.log(`US: ${US.rows} rows -> ${Object.keys(US.table).length} ZIP3, military ZIP3 ${US.military.join(",")}`);
console.log(`CA: ${CA.rows} rows -> ${Object.keys(CA.table).length} FSAs`);
console.log(`AE: ${AE.used} places -> ${Object.keys(AE.table).length} city names`);
