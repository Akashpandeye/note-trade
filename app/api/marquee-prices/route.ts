import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Static sample prices so the marquee always shows numbers,
// without depending on an external quotes API.
const STATIC_PRICES: Record<string, string> = {
  "NIFTY 50": "24,500",
  SENSEX: "81,200",
  "BANK NIFTY": "51,350",
  "NIFTY MIDCAP": "54,120",
  GOLD: "72,350",
  SILVER: "89,420",
  "CRUDE OIL": "6,850",
  "NATURAL GAS": "235.40",
  COPPER: "872.10",
  ZINC: "252.30",
  NICKEL: "1,675.00",
  ALUMINIUM: "214.80",
};

export async function GET() {
  return NextResponse.json(STATIC_PRICES);
}
