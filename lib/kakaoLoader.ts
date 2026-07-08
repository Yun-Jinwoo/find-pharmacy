declare global {
  interface Window { kakao: any; }
}

let loadPromise: Promise<void> | null = null;

/**
 * 카카오맵 SDK를 한 번만 주입·로드하는 공유 로더.
 * MapView(지도 마운트)와 지역 검색(RegionSelect, 지도 마운트 전에도 뜰 수 있음)이
 * 동시에 호출해도 스크립트가 중복 주입되지 않고 같은 Promise를 공유한다.
 */
export function loadKakaoSdk(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (window.kakao?.maps?.services) { resolve(); return; }

    function onScriptLoaded() {
      window.kakao.maps.load(() => resolve());
    }

    let script = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;
    if (script) {
      // 이미 다른 곳에서 주입됨 — load 이벤트가 이미 지났을 수 있으니 kakao 존재 여부로 분기
      if (window.kakao?.maps) onScriptLoaded();
      else script.addEventListener("load", onScriptLoaded);
      return;
    }

    script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.addEventListener("load", onScriptLoaded);
    document.head.appendChild(script);
  });

  return loadPromise;
}
