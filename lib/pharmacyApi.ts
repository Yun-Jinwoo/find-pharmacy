import { Pharmacy, PharmacyStatus, DaySchedule } from "./types";

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

// API dutyTimeNs/dutyTimeNc 필드 → "HH:MM" 문자열, 없으면 ""
function fmtApiTime(t: unknown): string {
  const s = String(t ?? "").trim().padStart(4, "0");
  if (!/^\d{4}$/.test(s)) return "";
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

const DAY_DEFS = [
  { key: 1, label: "월요일", jsDay: 1 },
  { key: 2, label: "화요일", jsDay: 2 },
  { key: 3, label: "수요일", jsDay: 3 },
  { key: 4, label: "목요일", jsDay: 4 },
  { key: 5, label: "금요일", jsDay: 5 },
  { key: 6, label: "토요일", jsDay: 6 },
  { key: 7, label: "일요일", jsDay: 0 },
  { key: 8, label: "공휴일", jsDay: -1 },
];

function buildWeeklyHours(item: Record<string, unknown>): DaySchedule[] {
  return DAY_DEFS.map(({ key, label, jsDay }) => {
    const start = fmtApiTime(item[`dutyTime${key}s`]);
    const end   = fmtApiTime(item[`dutyTime${key}c`]);
    const hours = start && end ? `${start} – ${end}` : "휴무";
    return { label, hours, jsDay };
  });
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
      weeklyHours: buildWeeklyHours(item),
    };
  });
}
