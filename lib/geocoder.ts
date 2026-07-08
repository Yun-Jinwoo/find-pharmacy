import { loadKakaoSdk } from "./kakaoLoader";

declare global {
  interface Window { kakao: any; }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  await loadKakaoSdk();
  return new Promise(resolve => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    // Kakao coord2RegionCode: x = longitude, y = latitude
    geocoder.coord2RegionCode(lng, lat, (result: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK || !result.length) {
        resolve("");
        return;
      }
      const h = result.find(r => r.region_type === "H") || result[0];
      const gu = h.region_2depth_name as string;
      const dong = h.region_3depth_name as string;
      resolve([gu, dong].filter(Boolean).join(" "));
    });
  });
}

export interface RegionResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * 지역/장소 이름으로 검색 — 카카오 키워드 검색(Places)을 써서 "홍대"·"이태원" 같은
 * 비공식 지명과 "울산 남구" 같은 행정구역 모두 전국 어디든 매칭한다.
 * (구 버전은 서울 24개 구/동만 하드코딩한 표에서 찾아, 매칭 안 되면 조용히
 * 서울시청으로 폴백했음 — 그 대신 여기선 결과 없으면 빈 배열을 반환한다.)
 */
export async function searchRegion(query: string): Promise<RegionResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  await loadKakaoSdk();
  return new Promise(resolve => {
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(trimmed, (data: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK) { resolve([]); return; }
      resolve(
        data.slice(0, 8).map((d): RegionResult => ({
          name: d.place_name,
          address: d.road_address_name || d.address_name,
          lat: parseFloat(d.y),
          lng: parseFloat(d.x),
        })),
      );
    });
  });
}
