export type PharmacyStatus = "open" | "closing" | "closed";

export interface DaySchedule {
  label: string;
  hours: string;  // "09:00 – 18:00" or "휴무"
  jsDay: number;  // JS getDay() 값: 0=일, 1=월…6=토, -1=공휴일
}

export interface Pharmacy {
  id: string;
  name: string;
  status: PharmacyStatus;
  statusLabel: string;
  hoursToday: string;
  distanceM: number;
  walkTime: string;
  subText: string;
  closeText: string;
  closeSubText: string;
  countdownType: "" | "cl" | "cd";
  address: string;
  phone: string;
  /** map pin position, percentage of map container */
  pinX: number;
  pinY: number;
  pinLabel: string;
  /** real coordinates for Kakao Map */
  lat: number;
  lng: number;
  weeklyHours: DaySchedule[];
}
