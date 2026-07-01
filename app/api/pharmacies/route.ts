import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const BASE =
  "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyLcinfoInqire";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const numOfRows = searchParams.get("numOfRows") ?? "20";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  const key = process.env.PHARMACY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url =
    `${BASE}?ServiceKey=${encodeURIComponent(key)}` +
    `&WGS84_LAT=${lat}&WGS84_LON=${lng}` +
    `&numOfRows=${numOfRows}&pageNo=1`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
  }

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });
  const parsed = parser.parse(xml);

  const raw = parsed?.response?.body?.items?.item;
  if (!raw) return NextResponse.json([]);

  const items = Array.isArray(raw) ? raw : [raw];
  return NextResponse.json(items);
}
