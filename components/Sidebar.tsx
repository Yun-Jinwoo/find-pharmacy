"use client";

import { Pharmacy } from "@/lib/types";
import { Phase } from "@/app/page";
import PharmacyCard from "./PharmacyCard";
import DetailPanel from "./DetailPanel";
import SearchOverlay from "./SearchOverlay";
import NightFilterChips from "./NightFilterChips";

interface Props {
  pharmacies: Pharmacy[];
  allPharmacies: Pharmacy[];
  phase: Phase;
  activeId: string | null;
  selectedPharmacy: Pharmacy | null;
  favorites: string[];
  activeTab: "all" | "favorites";
  regionName: string;
  searchOpen: boolean;
  nightOnly: boolean;
  h24Only: boolean;
  onToggleNight: () => void;
  onToggleH24: () => void;
  onTabChange: (tab: "all" | "favorites") => void;
  onResetFilters: () => void;
  onToggleFavorite: (id: string) => void;
  onCardClick: (p: Pharmacy) => void;
  onCardEnter: (id: string) => void;
  onCardLeave: (id: string) => void;
  onDetailClose: () => void;
  onSearchClick: () => void;
  onSearchClose: () => void;
  onSearchSelect: (p: Pharmacy) => void;
  onFilterClick: () => void;
  showToast: (msg: string) => void;
}

export default function Sidebar({
  pharmacies,
  allPharmacies,
  phase,
  activeId,
  selectedPharmacy,
  favorites,
  activeTab,
  regionName,
  searchOpen,
  nightOnly,
  h24Only,
  onToggleNight,
  onToggleH24,
  onTabChange,
  onResetFilters,
  onToggleFavorite,
  onCardClick,
  onCardEnter,
  onCardLeave,
  onDetailClose,
  onSearchClick,
  onSearchClose,
  onSearchSelect,
  onFilterClick,
  showToast,
}: Props) {
  const openCount = pharmacies.filter(p => p.status !== "closed").length;

  return (
    <aside
      className="relative bg-white flex flex-col overflow-hidden z-[2]"
      style={{ boxShadow: "14px 0 40px -28px rgba(8,53,66,0.4)" }}
    >
      {/* brand */}
      <div className="flex items-center gap-[11px] px-[24px] pt-[22px] pb-[16px]">
        <div
          className="w-[38px] h-[38px] rounded-[11px] grid place-items-center text-white flex-none"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
            boxShadow: "0 8px 18px -8px rgba(11,143,172,0.8)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
            <path d="M12 7v6M9 10h6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>약국 어디가</div>
          <div className="flex items-center gap-[5px] mt-[2px]" style={{ fontSize: 12, color: "var(--muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="12" cy="12" r="3" />
            </svg>
            현재 위치 ·{" "}
            <b style={{ color: "var(--primary-deep)", fontWeight: 700 }}>
              {regionName || "위치 확인 중"}
            </b>
          </div>
        </div>
      </div>

      {searchOpen ? (
        <SearchOverlay
          desktop
          pharmacies={allPharmacies}
          onClose={onSearchClose}
          onSelect={onSearchSelect}
        />
      ) : (
        <>
          {/* search */}
          <div className="px-[24px]">
            <button
              onClick={onSearchClick}
              className="w-full flex items-center gap-[10px] rounded-[13px] border text-left cursor-pointer"
              style={{ height: 48, background: "#f3f7f9", borderColor: "var(--line)", padding: "0 14px" }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
              </svg>
              <span style={{ fontSize: 14.5, color: "#9fb3bc" }}>지역 · 약국 이름 검색</span>
              <div
                className="ml-auto flex-none grid place-items-center rounded-[9px] border"
                style={{ width: 32, height: 32, borderColor: "var(--line)", background: "#fff" }}
                onClick={e => { e.stopPropagation(); onFilterClick(); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M7 12h10M11 18h2" />
                </svg>
              </div>
            </button>
          </div>

          {/* chips */}
          <NightFilterChips
            className="mt-[12px] mx-[24px]"
            nightOnly={nightOnly}
            h24Only={h24Only}
            onToggleNight={onToggleNight}
            onToggleH24={onToggleH24}
          />

          {/* tabs */}
          <div className="flex gap-0 mt-[14px] mx-[24px] border rounded-[12px] overflow-hidden" style={{ borderColor: "var(--line)" }}>
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

          {/* list header */}
          <div className="px-[24px] pt-[16px] pb-[8px] flex items-baseline justify-between">
            <h1 className="m-0" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>
              {activeTab === "favorites" ? (
                <>즐겨찾기 <em className="not-italic" style={{ color: "var(--primary)" }}>{pharmacies.length}곳</em></>
              ) : (
                <>운영 중 약국 <em className="not-italic" style={{ color: "var(--primary)" }}>{openCount}곳</em></>
              )}
            </h1>
            <span className="flex items-center gap-[6px]" style={{ fontSize: 12, color: "var(--muted)" }}>
              <span
                className="rounded-full flex-none"
                style={{ width: 7, height: 7, background: "var(--open)", animation: "beat 1.8s infinite" }}
              />
              가까운 순
            </span>
          </div>

          {/* pharmacy list */}
          <div
            className="flex-1 overflow-y-auto px-[16px] pb-[22px]"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#dce6ea transparent" } as React.CSSProperties}
          >
            {pharmacies.length === 0 && activeTab === "favorites" ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--muted)", paddingTop: 40 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d3dfe4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: 600 }}>즐겨찾기한 약국이 없어요</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>카드의 ♡ 버튼으로 추가하세요</div>
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--muted)", paddingTop: 40 }}>
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
                  onToggleFavorite={onToggleFavorite}
                  onClick={onCardClick}
                  onMouseEnter={onCardEnter}
                  onMouseLeave={onCardLeave}
                  showToast={showToast}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* detail panel slides over */}
      <DetailPanel pharmacy={selectedPharmacy} onClose={onDetailClose} showToast={showToast} />
    </aside>
  );
}
