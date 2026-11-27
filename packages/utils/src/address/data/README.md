# Address reference data

Generated tables the server-side address validator (`@swago/utils/address-server`) uses to
check that a postal code / city is consistent with the chosen ISO 3166-2 state. **Do not hand-edit**;
rebuild with the script below.

| File | Contents | Built from |
|---|---|---|
| `in-pincodes.json` | ISO state code → compact PIN ranges (19,238 PINs, 36 states/UTs; a PIN may appear under 2 states) | GeoNames postal `IN.zip` |
| `us-zip3.json` | ZIP3 prefix → state code(s) (911 prefixes, 50 states + DC) + military-only ZIP3 list (090–098, 340, 962–965) | GeoNames postal `US.zip` |
| `ca-fsa.json` | FSA (first 3 chars) → province/territory (1,651 FSAs) | GeoNames postal `CA.zip` |
| `ae-cities.json` | normalised populated-place name → emirate code (427 names) | GeoNames gazetteer `AE.zip` + `admin1CodesASCII.txt` |
| `version.json` | `geonames-2026-11-26`, copied to `Order.addressDataVersion` on every order | — |

## Sources and licence

- **Provider:** GeoNames (https://www.geonames.org/). **Licence:** Creative Commons Attribution 4.0
  (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/. Attribution: "Contains data from GeoNames.org".
- **Retrieved:** 26 Nov 2026, around 11:42 UTC (17:12 IST).
- Files and SHA-256 hashes of the downloads used:

| URL | SHA-256 |
|---|---|
| https://download.geonames.org/export/zip/IN.zip | `f737544e8da97639c466168ba27c33e9cf9da53253c80f6976875eff65917776` |
| https://download.geonames.org/export/zip/US.zip | `f98032480f3138cca1fa363fe0665e7be4a9c43d79acfe88902696971d8495b0` |
| https://download.geonames.org/export/zip/CA.zip | `aecb33dbf969f0ed0a4f207cbad4edb34a7bddb1be9f8678b261d2ee295810dd` |
| https://download.geonames.org/export/dump/AE.zip | `c70d54132cb5c3fb50d7bcf4dead96d6c9a250e9be5420bb0a090dad5545f923` |
| https://download.geonames.org/export/dump/admin1CodesASCII.txt | `2e4867f5397acb056ea26377601b57af37cb4c81399770225018e9e439e91ad3` |

### Why not data.gov.in (India Post "All India Pincode Directory")?

It was the preferred primary source for India, but on 26 Nov 2026 the build machine could not download it:
the API needs an API key ("Authorization field missing") and the portal's download link returned an
Akamai error page (HTTP 503). GeoNames `IN` (itself derived from India Post data) was used as the
fallback. To switch later, add a data.gov.in parser to the build script and keep the same JSON shape.

## Corrections applied by the build script (documented, deterministic)

- **IN – Ladakh:** GeoNames still files Leh/Kargil under Jammu & Kashmir. Rows in J&K whose admin2 is
  `Leh`, `Leh Ladakh`, `Ladakh` or `Kargil` are mapped to `IN-LA`.
- **IN – state names:** GeoNames state names → ISO codes via an explicit table (incl. merged
  Dadra & Nagar Haveli and Daman & Diu → `IN-DH`).
- **US:** only the 50 states + DC are kept. Territories (PR, VI, GU, AS, MP…) are not shippable and are
  excluded. A ZIP3 is marked military-only when all its rows are APO/FPO (AA/AE/AP or blank) and no civilian
  state shares it. The validator additionally hard-codes military 090–098, 340, 962–966 and territory
  006–009, 969, 96799.
- **AE:** only populated places (feature class `P`: PPL, PPLA, PPLA2, PPLA3, PPLC, PPLS, PPLF, PPLL; PPLX
  sections excluded). Overrides: `Dibba Al-Hisn` → `AE-SH` (GeoNames has it under the wrong emirate),
  `Al Ain` → `AE-AZ`, and each emirate's own name → that emirate. The UAE has no postal codes; the city is
  the consistency check and unknown cities are only flagged.
- **CA:** FSA → province from the GeoNames province abbreviation (unknown abbreviations fail the build).

## Rebuild

```bash
# download the five files above into a folder (e.g. /tmp/addr-src), unzip the four zips there, then:
ADDRESS_DATA_DATE=YYYY-MM-DD npx tsx packages/utils/scripts/build-address-data.ts /tmp/addr-src
npx tsx --test packages/utils/tests/address.test.ts
```

Update this README (date, hashes, counts) whenever the tables are regenerated.
