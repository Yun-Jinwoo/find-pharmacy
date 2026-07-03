import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const BASE =
  "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyBassInfoInqire";

export async function GET(req: NextRequest) {
  const hpid = new URL(req.url).searchParams.get("hpid");
  if (!hpid) return NextResponse.json({ error: "hpid required" }, { status: 400 });

  const key = process.env.PHARMACY_API_KEY;
  if (!key) return NextResponse.json({ error: "no key" }, { status: 500 });

  const url =
    `${BASE}?ServiceKey=${encodeURIComponent(key)}` +
    `&HPID=${encodeURIComponent(hpid)}&numOfRows=1&pageNo=1`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return NextResponse.json(null, { status: 502 });

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });
  const parsed = parser.parse(xml);
  const raw = parsed?.response?.body?.items?.item;
  if (!raw) return NextResponse.json(null);

  return NextResponse.json(Array.isArray(raw) ? raw[0] : raw);
}
