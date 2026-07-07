"use client";

import { useRef, useState, useEffect } from "react";
import { Pharmacy } from "@/lib/types";
import { Phase } from "@/app/page";
import PharmacyCard from "./PharmacyCard";

interface Props {
  pharmacies: Pharmacy[];
  phase: Phase;
  activeId: string | null;
  favorites: string[];
  activeTab: "all" | "favorites";
  onTabChange: (tab: "all" | "favorites") => void;
  onResetFilters: () => void;
  onToggleFavorite: (id: string) => void;
  onCardClick: (p: Pharmacy) => void;
  onCardEnter: (id: string) => void;
  onCardLeave: (id: string) => void;
  showToast: (msg: string) => void;
  /** fires when the sheet settles into fully-expanded vs peek state */
  onExpandChange?: (expanded: boolean) => void;
}

const PEEK_FRAC = 0.5;

// Exposes the sheet's current visible height as a CSS var so floating map
// buttons (recenter, research) can dock just above it without prop-drilling
// live drag position through React state on every pointer move.
function setSheetVar(px: number) {
  document.documentElement.style.setProperty("--sheet-h", `${Math.max(0, px)}px`);
}

function setHeaderVar(px: number) {
  document.documentElement.style.setProperty("--sheet-header-h", `${Math.max(0, px)}px`);
}

export default function BottomSheet({
  pharmacies,
  phase,
  activeId,
  favorites,
  activeTab,
  onTabChange,
  onResetFilters,
  onToggleFavorite,
  onCardClick,
  onCardEnter,
  onCardLeave,
  showToast,
  onExpandChange,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState("110%");
  const [animating, setAnimating] = useState(true);
  const dragging = useRef(false);
  const startY = useRef(0);
  const baseY = useRef(0);
  const isUp = useRef(false);
  const openCount = pharmacies.filter(p => p.status !== "closed").length;

  function getH() { return sheetRef.current?.offsetHeight ?? 400; }

  useEffect(() => {
    if (phase !== "listed") return;
    setAnimating(true);
    setHeaderVar(headerRef.current?.offsetHeight ?? 0);
    const peekY = getH() * PEEK_FRAC;
    setTranslateY(`${peekY}px`);
    setSheetVar(getH() - peekY);
  }, [phase]);

  function onDown(e: React.PointerEvent) {
    if (translateY === "110%") return;
    dragging.current = true;
    startY.current = e.clientY;
    baseY.current = parseFloat(translateY) || 0;
    setAnimating(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const h = getH();
    let y = baseY.current + (e.clientY - startY.current);
    y = Math.max(0, Math.min(h * PEEK_FRAC, y));
    setTranslateY(`${y}px`);
    setSheetVar(h - y);
  }

  function onUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const moved = e.clientY - startY.current;
    if (moved < -30) isUp.current = true;
    else if (moved > 30) isUp.current = false;
    setAnimating(true);
    const h = getH();
    const finalY = isUp.current ? 0 : h * PEEK_FRAC;
    setTranslateY(`${finalY}px`);
    setSheetVar(h - finalY);
    onExpandChange?.(isUp.current);
  }

  return (
    <div
      ref={sheetRef}
      className="absolute left-0 right-0 bottom-0 z-[35] bg-white flex flex-col"
      style={{
        height: "86%",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -16px 40px -20px rgba(8,53,66,0.45)",
        transform: `translateY(${translateY})`,
        transition: animating ? "transform 0.42s cubic-bezier(0.22,0.61,0.36,1)" : "none",
        willChange: "transform",
      }}
    >
      {/* fixed header block: grip + tabs + title (height measured for list sizing) */}
      <div ref={headerRef} className="flex-none">
        {/* drag grip */}
        <div
          className="flex justify-center cursor-grab"
          style={{ padding: "11px 0 6px", touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <span className="rounded-full" style={{ width: 42, height: 5, background: "#d3dfe4", display: "block" }} />
        </div>

        {/* tabs */}
        <div className="flex gap-0 mx-[16px] mb-[12px] border rounded-[12px] overflow-hidden" style={{ borderColor: "var(--line)" }}>
          {(["all", "favorites"] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className="flex-1 border-0 cursor-pointer font-bold flex items-center justify-center gap-[6px]"
                style={{
                  fontSize: 13,
                  padding: "10px 0",
                  background: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "#fff" : "var(--muted)",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {tab === "favorites" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={isActive ? "#fff" : "none"} stroke={isActive ? "#fff" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                )}
                {tab === "all" ? "전체" : "즐겨찾기"}
              </button>
            );
          })}
        </div>

        {/* header */}
        <div className="px-[20px] pb-[12px]">
          <h1 className="m-0 tracking-[-0.4px]" style={{ fontSize: 19, fontWeight: 800 }}>
            {activeTab === "favorites" ? (
              <>즐겨찾기 <em className="not-italic" style={{ color: "var(--primary)" }}>{pharmacies.length}곳</em></>
            ) : (
              <>주변 운영 중 약국 <em className="not-italic" style={{ color: "var(--primary)" }}>{openCount}곳</em></>
            )}
          </h1>
          <p className="flex items-center gap-[6px] m-0 mt-[4px]" style={{ fontSize: 12.5, color: "var(--muted)" }}>
            <span
              className="rounded-full flex-none"
              style={{ width: 7, height: 7, background: "var(--open)", animation: "beat 1.8s infinite" }}
            />
            가까운 순
          </p>
        </div>
      </div>

      {/* scrollable card list — height pinned to the currently visible sheet
          area (not the full 86% panel) so content past the peek line is a
          real overflow and can be scrolled into view instead of being
          clipped off-screen with nothing to scroll to reveal it */}
      <div
        className="flex-none overflow-y-auto px-[14px] pb-[30px]"
        style={{
          height: "calc(var(--sheet-h, 0px) - var(--sheet-header-h, 0px))",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        } as React.CSSProperties}
      >
        {pharmacies.length === 0 && activeTab === "favorites" ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--muted)", paddingTop: 32 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d3dfe4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>즐겨찾기한 약국이 없어요</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>카드의 ♡ 버튼으로 추가하세요</div>
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--muted)", paddingTop: 32 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d3dfe4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
              <circle cx="11" cy="11" r="7" />
              <path d="M4 4l14 14" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>조건에 맞는 약국이 없어요</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>필터를 초기화하면 더 많은 약국을 볼 수 있어요</div>
            <button
              onClick={onResetFilters}
              className="border-0 rounded-full font-bold cursor-pointer"
              style={{ fontSize: 12.5, color: "#fff", background: "var(--primary)", padding: "8px 16px", marginTop: 14 }}
            >
              필터 초기화
            </button>
          </div>
        ) : (
          pharmacies.map((p, i) => (
            <PharmacyCard
              key={p.id}
              pharmacy={p}
              index={i}
              phase={phase}
              isActive={activeId === p.id}
              isFavorite={favorites.includes(p.id)}
              onToggleFavorite={() => onToggleFavorite(p.id)}
              showActions
              showToast={showToast}
              onClick={() => onCardClick(p)}
              onMouseEnter={() => onCardEnter(p.id)}
              onMouseLeave={() => onCardLeave(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
