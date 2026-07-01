declare global {
  interface Window { kakao: any; }
}

function waitForServices(): Promise<void> {
  return new Promise(resolve => {
    function check() {
      if (window.kakao?.maps?.services) { resolve(); return; }
      setTimeout(check, 150);
    }
    check();
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  await waitForServices();
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
