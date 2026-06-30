export type PharmacyStatus = "open" | "closing" | "closed";

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
}
