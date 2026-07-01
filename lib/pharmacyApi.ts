import { Pharmacy, PharmacyStatus } from "./types";

function timeToMin(t: unknown): number {
  const s = String(t ?? "").padStart(4, "0");
  if (!/^\d{4}$/.test(s)) return -1;
  return parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(2, 4));
}

function calcStatus(startTime: unknown, endTime: unknown): PharmacyStatus {
  const start = timeToMin(startTime);
  const end = timeToMin(endTime);
  if (start < 0 || end < 0 || start === 0 && end === 0) return "closed";

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < start || nowMin >= end) return "closed";
  if (end - nowMin <= 30) return "closing";
  return "open";
}

function formatCloseTime(endTime: unknown): string {
  const min = timeToMin(endTime);
  if (min < 0) return "운영시간 미제공";
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? "오전" : h < 18 ? "오후" : "밤";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${period} ${dh}시까지` : `${period} ${dh}:${String(m).padStart(2, "0")}까지`;
}

function calcCloseSubText(status: PharmacyStatus, endTime: unknown): string {
  if (status === "closed") return "";
  const end = timeToMin(endTime);
  if (end < 0) return "";
  const now = new Date();
  const remaining = end - (now.getHours() * 60 + now.getMinutes());
  if (status === "closing") return `마감까지 약 ${remaining}분 남았어요`;
  return formatCloseTime(endTime) + " 운영";
}

export async function fetchNearbyPharmacies(lat: number, lng: number): Promise<Pharmacy[]> {
  const res = await fetch(`/api/pharmacies?lat=${lat}&lng=${lng}&numOfRows=20`);
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const items: Record<string, unknown>[] = await res.json();

  return items.map((item, idx): Pharmacy => {
    const distM = Math.round((parseFloat(String(item.distance ?? 0)) || 0) * 1000);
    const walkMin = Math.max(1, Math.round(distM / 67));
    const status = calcStatus(item.startTime, item.endTime);
    const hoursToday = formatCloseTime(item.endTime);

    return {
      id: String(item.hpid ?? `p${idx}`),
      name: String(item.dutyName ?? "약국"),
      status,
      statusLabel: status === "open" ? "운영 중" : status === "closing" ? "곧 마감" : "영업 종료",
      hoursToday,
      distanceM: distM,
      walkTime: `도보 ${walkMin}분`,
      subText: String(item.dutyAddr ?? ""),
      closeText: hoursToday,
      closeSubText: calcCloseSubText(status, item.endTime),
      countdownType: status === "closing" ? "cl" : status === "closed" ? "cd" : "",
      address: String(item.dutyAddr ?? ""),
      phone: String(item.dutyTel1 ?? ""),
      pinX: 50,
      pinY: 50,
      pinLabel: "약",
      lat: parseFloat(String(item.latitude)) || lat,
      lng: parseFloat(String(item.longitude)) || lng,
    };
  });
}
