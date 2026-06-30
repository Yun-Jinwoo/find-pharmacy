export interface Coords { lat: number; lng: number; }

export const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.9780 };

export function requestLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { timeout: 10000, maximumAge: 60000 },
    );
  });
}

const REGION_COORDS: Record<string, Coords> = {
  "강남구":          { lat: 37.5172, lng: 127.0473 },
  "강남구 역삼동":   { lat: 37.4999, lng: 127.0372 },
  "역삼동":          { lat: 37.4999, lng: 127.0372 },
  "서초구":          { lat: 37.4837, lng: 127.0324 },
  "송파구":          { lat: 37.5145, lng: 127.1059 },
  "마포구":          { lat: 37.5663, lng: 126.9014 },
  "홍대":            { lat: 37.5574, lng: 126.9243 },
  "신촌":            { lat: 37.5596, lng: 126.9424 },
  "종로구":          { lat: 37.5702, lng: 126.9910 },
  "중구":            { lat: 37.5640, lng: 126.9975 },
  "용산구":          { lat: 37.5324, lng: 126.9905 },
  "이태원":          { lat: 37.5340, lng: 126.9947 },
  "성동구":          { lat: 37.5633, lng: 127.0369 },
  "건대":            { lat: 37.5403, lng: 127.0695 },
  "광진구":          { lat: 37.5385, lng: 127.0823 },
  "동대문구":        { lat: 37.5744, lng: 127.0396 },
  "노원구":          { lat: 37.6540, lng: 127.0568 },
  "은평구":          { lat: 37.6177, lng: 126.9227 },
  "서대문구":        { lat: 37.5791, lng: 126.9368 },
  "강서구":          { lat: 37.5509, lng: 126.8495 },
  "영등포구":        { lat: 37.5263, lng: 126.8963 },
  "동작구":          { lat: 37.5124, lng: 126.9393 },
  "관악구":          { lat: 37.4784, lng: 126.9516 },
  "강동구":          { lat: 37.5301, lng: 127.1238 },
};

/** 지역 이름으로 좌표 반환. 매핑 없으면 서울 중심 반환 */
export function regionToCoords(name: string): Coords {
  const trimmed = name.trim();
  if (REGION_COORDS[trimmed]) return REGION_COORDS[trimmed];
  const partial = Object.entries(REGION_COORDS).find(
    ([key]) => trimmed.includes(key) || key.includes(trimmed),
  );
  return partial ? partial[1] : SEOUL_CENTER;
}
