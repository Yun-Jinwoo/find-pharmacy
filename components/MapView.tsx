"use client";

import { useRef, useEffect } from "react";
import { Pharmacy } from "@/lib/types";
import { Phase } from "@/app/page";

declare global {
  interface Window { kakao: any; }
}

interface Props {
  pharmacies: Pharmacy[];
  phase: Phase;
  activeId: string | null;
  isMobile?: boolean;
  userLat?: number;
  userLng?: number;
  initialCenter?: { lat: number; lng: number };
  onPinClick: (p: Pharmacy) => void;
  onPinEnter: (id: string) => void;
  onPinLeave: (id: string) => void;
  onRecenter?: () => void;
  onMapMove?: (lat: number, lng: number, radiusKm: number) => void;
}

// Fallback to Gangnam area when no real coords provided
const FALLBACK_LAT = 37.4979;
const FALLBACK_LNG = 127.0276;

// Applied only to Kakao's tile layer elements (captured before our overlays are added).
// grayscale removes Kakao's colorful palette → invert flips light/dark →
// hue-rotate + saturate pushes toward the original design's teal palette.
// grayscale 제거: invert+hue-rotate(194°) 쌍은 PIN_COUNTER의 invert+hue-rotate(166°)와
// 수학적으로 정확히 상쇄됨 → 핀이 원본 색상 그대로 표시됨.
const TILE_FILTER =
  "invert(1) hue-rotate(194deg) brightness(1.18) saturate(0.85) contrast(0.95)";

// Original design: --map: #0C2A33 (rgb 12,42,51)
const NAVY_TINT = "rgba(12,42,51,0.38)";

// Exact inverse of TILE_FILTER (hue-rotate 360-194=166, brightness/saturate/contrast reciprocals).
const PIN_COUNTER =
  "invert(1) hue-rotate(166deg) saturate(1.18) brightness(0.85) contrast(1.05)";

const STATUS_BG: Record<string, string> = {
  open: "linear-gradient(135deg,#1fb257,#138a43)",
  closing: "linear-gradient(135deg,#f6a722,#e08a06)",
  closed: "linear-gradient(135deg,#9fb0bb,#7d909b)",
};

function makePinEl(p: Pharmacy): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = `position:relative;cursor:pointer;filter:${PIN_COUNTER};`;

  // tooltip
  const tip = document.createElement("div");
  tip.style.cssText =
    "position:absolute;bottom:calc(100% + 8px);left:50%;" +
    "transform:translateX(-50%) translateY(6px);" +
    "background:#0e2a33;color:white;font-weight:700;font-size:12px;" +
    "padding:6px 10px;border-radius:9px;white-space:nowrap;" +
    "opacity:0;transition:opacity 0.18s,transform 0.18s;" +
    "pointer-events:none;z-index:2;font-family:inherit;";
  tip.textContent = p.name;

  const arrow = document.createElement("span");
  arrow.style.cssText =
    "position:absolute;left:50%;top:100%;transform:translateX(-50%);" +
    "border-width:5px;border-style:solid;" +
    "border-color:#0e2a33 transparent transparent transparent;";
  tip.appendChild(arrow);

  // pin head
  const head = document.createElement("div");
  head.style.cssText =
    "position:relative;width:38px;height:38px;border-radius:50% 50% 50% 3px;" +
    `background:${STATUS_BG[p.status]};` +
    "box-shadow:0 8px 18px -4px rgba(8,53,66,0.6);" +
    "display:grid;place-items:center;overflow:hidden;" +
    "transform:rotate(45deg);" +
    "transition:transform 0.18s,outline 0.15s;";

  // glossy highlight (light source in the upper-left of the rotated head)
  const glossEllipse = document.createElement("span");
  glossEllipse.style.cssText =
    "position:absolute;top:6px;left:7px;width:13px;height:6px;border-radius:50%;" +
    "background:rgba(255,255,255,0.4);transform:rotate(-25deg);pointer-events:none;";
  const glossDot = document.createElement("span");
  glossDot.style.cssText =
    "position:absolute;top:14px;left:9px;width:3px;height:3px;border-radius:50%;" +
    "background:rgba(255,255,255,0.45);pointer-events:none;";
  head.appendChild(glossEllipse);
  head.appendChild(glossDot);

  const capsulePath = "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z";
  const clipId = `capsule-clip-${p.id}`;
  const iconWrap = document.createElement("div");
  iconWrap.style.cssText = "transform:rotate(-45deg);display:grid;place-items:center;";
  iconWrap.innerHTML =
    '<svg width="19" height="19" viewBox="0 0 24 24">' +
    `<defs><clipPath id="${clipId}"><path d="${capsulePath}"/></clipPath></defs>` +
    `<g clip-path="url(#${clipId})">` +
    '<polygon points="0,0 0,24 24,24" fill="white"/>' +
    '<polygon points="0,0 24,0 24,24" fill="#9B8AE0"/>' +
    "</g>" +
    `<path d="${capsulePath}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.3"/>` +
    "</svg>";
  head.appendChild(iconWrap);

  wrap.appendChild(tip);
  wrap.appendChild(head);
  return wrap;
}

function setPinRevealed(el: HTMLElement, revealed: boolean, delay: string) {
  el.style.transition =
    `opacity 0.5s ease ${delay},transform 0.55s cubic-bezier(0.18,0.9,0.32,1.4) ${delay}`;
  el.style.opacity = revealed ? "1" : "0";
  el.style.transform = revealed ? "scale(1)" : "scale(0.2)";
  el.style.transformOrigin = "bottom center";
}

function setPinActive(el: HTMLElement, isActive: boolean) {
  const tip = el.children[0] as HTMLElement;
  const head = el.children[1] as HTMLElement;
  if (isActive) {
    head.style.transform = "rotate(45deg) scale(1.16)";
    head.style.outline = "3px solid rgba(34,211,238,0.9)";
    head.style.outlineOffset = "3px";
    tip.style.opacity = "1";
    tip.style.transform = "translateX(-50%) translateY(0)";
  } else {
    head.style.transform = "rotate(45deg)";
    head.style.outline = "none";
    head.style.outlineOffset = "0";
    tip.style.opacity = "0";
    tip.style.transform = "translateX(-50%) translateY(6px)";
  }
}

export default function MapView({
  pharmacies,
  phase,
  activeId,
  isMobile = false,
  userLat,
  userLng,
  initialCenter,
  onPinClick,
  onPinEnter,
  onPinLeave,
  onRecenter,
  onMapMove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, any>>(new Map());
  const pinElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const revealed = phase !== "scan";
  const openCount = pharmacies.filter(p => p.status !== "closed").length;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    function startMap() {
      if (!mounted || !containerRef.current) return;
      const lat = initialCenter?.lat ?? userLat ?? FALLBACK_LAT;
      const lng = initialCenter?.lng ?? userLng ?? FALLBACK_LNG;

      window.kakao.maps.load(() => {
        if (!mounted || !containerRef.current) return;

        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 4,
        });
        mapRef.current = map;

        // Notify parent when map is dragged to a new position
        window.kakao.maps.event.addListener(map, "dragend", () => {
          const c = map.getCenter();
          const cLat = c.getLat();
          const cLng = c.getLng();
          // Estimate viewport radius (center → NE corner) for numOfRows calculation
          const ne = map.getBounds().getNorthEast();
          const df = (ne.getLat() - cLat) * Math.PI / 180;
          const dl = (ne.getLng() - cLng) * Math.PI / 180;
          const f1 = cLat * Math.PI / 180;
          const f2 = ne.getLat() * Math.PI / 180;
          const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
          const radiusKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          onMapMove?.(cLat, cLng, radiusKm);
        });

        // ── Capture Kakao's tile-layer elements BEFORE adding our overlays ──
        // CustomOverlays added via setMap() are direct children of containerRef,
        // separate from Kakao's internal tile wrapper. Capturing now lets us
        // apply the dark theme filter to only the tile elements.
        const kakaoEls = Array.from(containerRef.current.children) as HTMLElement[];

        // User location overlay (added first → z:5 in Kakao's overlay layer)
        const myDot = document.createElement("div");
        myDot.style.cssText = `position:relative;width:20px;height:20px;filter:${PIN_COUNTER};`;

        const ring = document.createElement("span");
        ring.style.cssText =
          "position:absolute;left:50%;top:50%;" +
          "width:20px;height:20px;border-radius:50%;" +
          "background:rgba(34,211,238,0.32);" +
          "animation:sonar 2.6s ease-out infinite;";

        const dot = document.createElement("span");
        dot.style.cssText =
          "display:block;position:absolute;left:50%;top:50%;" +
          "transform:translate(-50%,-50%);" +
          "width:20px;height:20px;border-radius:50%;" +
          "background:#22D3EE;border:3px solid white;" +
          "box-shadow:0 0 0 5px rgba(34,211,238,0.22);z-index:2;";

        myDot.appendChild(ring);
        myDot.appendChild(dot);

        new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(userLat ?? FALLBACK_LAT, userLng ?? FALLBACK_LNG),
          content: myDot,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 5,
        }).setMap(map);

        // Pharmacy pin overlays
        pharmacies.forEach((p) => {
          const el = makePinEl(p);
          setPinRevealed(el, false, "0s");

          el.addEventListener("click", () => onPinClick(p));
          el.addEventListener("mouseenter", () => onPinEnter(p.id));
          el.addEventListener("mouseleave", () => onPinLeave(p.id));

          const overlay = new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(p.lat, p.lng),
            content: el,
            xAnchor: 0.5,
            yAnchor: 1.0,
            zIndex: 6,
          });
          overlay.setMap(map);
          overlaysRef.current.set(p.id, overlay);
          pinElsRef.current.set(p.id, el);
        });

        // ── Apply dark theme to tile layer only, inject navy tint ──
        // Runs after a tick so the map has rendered its initial layout.
        setTimeout(() => {
          if (!mounted || !containerRef.current) return;
          map.relayout();

          // Dark filter on Kakao's tile elements (not our pin overlays)
          kakaoEls.forEach(el => { el.style.filter = TILE_FILTER; });

          // Navy tint div sits between tile layer and our overlays (z:3 < pins z:6)
          const tint = document.createElement("div");
          tint.style.cssText =
            `position:absolute;inset:0;z-index:3;pointer-events:none;background:${NAVY_TINT};`;
          containerRef.current.appendChild(tint);
        }, 0);
      }); // kakao.maps.load
    } // startMap

    if (window.kakao?.maps) {
      startMap();
    } else {
      let script = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "kakao-maps-sdk";
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`;
        document.head.appendChild(script);
      }
      script.addEventListener("load", startMap);
    }

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show/hide pins when phase changes
  useEffect(() => {
    const show = phase !== "scan";
    pinElsRef.current.forEach((el, id) => {
      const idx = pharmacies.findIndex(p => p.id === id);
      setPinRevealed(el, show, `${idx * 0.12}s`);
    });
  }, [phase, pharmacies]);

  // Update active pin
  useEffect(() => {
    pinElsRef.current.forEach((el, id) => {
      setPinActive(el, id === activeId);
      overlaysRef.current.get(id)?.setZIndex(id === activeId ? 9 : 6);
    });
  }, [activeId]);

  function handleRecenter() {
    onRecenter?.();
    const lat = userLat ?? FALLBACK_LAT;
    const lng = userLng ?? FALLBACK_LNG;
    mapRef.current?.setCenter(new window.kakao.maps.LatLng(lat, lng));
  }

  const recenterBottom = isMobile ? "54%" : 26;

  return (
    // isolation:isolate creates a stacking context so child z-indexes are self-contained
    <div
      className={isMobile ? "absolute inset-0 z-0" : "relative"}
      style={{ isolation: "isolate" }}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {/* info pill */}
      <div
        className="absolute top-[20px] left-[20px] z-[8] bg-[rgba(255,255,255,0.95)] backdrop-blur-[8px] rounded-[13px] px-[15px] py-[11px] flex items-center gap-[9px]"
        style={{
          boxShadow: "0 12px 30px -14px rgba(8,53,66,0.5)",
          opacity: revealed ? 1 : 0,
          transform: revealed ? "none" : "translateY(-10px)",
          transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
        }}
      >
        <b style={{ fontSize: 14, fontWeight: 800 }}>밤 9:41</b>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>기준 · 운영 중 {openCount}곳</span>
      </div>

      {/* recenter button */}
      <button
        aria-label="내 위치로"
        onClick={handleRecenter}
        className="absolute right-[22px] z-[8] w-[48px] h-[48px] rounded-[14px] border-0 bg-white cursor-pointer grid place-items-center text-[var(--primary)] hover:scale-105 active:scale-90 transition-transform"
        style={{
          bottom: recenterBottom,
          boxShadow: "0 10px 24px -10px rgba(8,53,66,0.5)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
        </svg>
      </button>

      {/* scan radar overlay */}
      <div
        className="absolute inset-0 z-[20] grid place-items-center"
        style={{
          background: "radial-gradient(circle at 56% 46%, rgba(11,143,172,0.16), #0C2A33 72%)",
          opacity: revealed ? 0 : 1,
          visibility: revealed ? "hidden" : "visible",
          transition: `opacity 0.55s ease, visibility 0s ${revealed ? "0.55s" : "0s"}`,
          pointerEvents: revealed ? "none" : "auto",
        }}
      >
        <div className="relative">
          <div className="w-[300px] h-[300px] rounded-full border border-[rgba(34,211,238,0.22)] relative">
            <div className="absolute rounded-full border border-[rgba(34,211,238,0.18)] inset-[50px]" />
            <div className="absolute rounded-full border border-[rgba(34,211,238,0.18)] inset-[104px]" />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg,transparent 250deg,rgba(34,211,238,0.4) 350deg,transparent 360deg)",
                animation: "spin 1.1s linear infinite",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 w-[16px] h-[16px] rounded-full bg-[var(--accent)] -translate-x-1/2 -translate-y-1/2"
              style={{ boxShadow: "0 0 22px 5px rgba(34,211,238,0.7)" }}
            />
          </div>
          <div className="absolute -bottom-[54px] left-0 right-0 text-center text-[#cdeef5] text-[15px] font-semibold">
            주변 약국을 찾는 중
            <small className="block text-[#7fb6c4] text-[12.5px] font-medium mt-[5px]">
              현재 위치 기준 · 운영 중인 곳 우선
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
