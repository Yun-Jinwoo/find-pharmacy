"use client";

import { Phase } from "@/app/map/page";
import NightFilterChips from "./NightFilterChips";

interface Props {
  phase: Phase;
  nightOnly: boolean;
  h24Only: boolean;
  onToggleNight: () => void;
  onToggleH24: () => void;
  onSearchClick: () => void;
  onFilterClick: () => void;
}

export default function MobileTopBar({ phase, nightOnly, h24Only, onToggleNight, onToggleH24, onSearchClick, onFilterClick }: Props) {
  const shown = phase !== "scan";

  return (
    <div
      className="absolute top-[52px] left-[14px] right-[14px] z-[30]"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(-12px)",
        transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
        pointerEvents: shown ? "auto" : "none",
      }}
    >
      {/* search box */}
      <button
        onClick={onSearchClick}
        className="w-full flex items-center gap-[10px] rounded-[14px] border-0 cursor-pointer text-left"
        style={{
          height: 50,
          background: "#fff",
          padding: "0 14px",
          boxShadow: "0 10px 24px -10px rgba(8,53,66,0.4)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
        </svg>
        <span style={{ fontSize: 15, color: "#9fb3bc" }}>지역 · 약국 이름 검색</span>
        <div
          className="flex-none grid place-items-center ml-auto rounded-[10px] border cursor-pointer"
          style={{ width: 34, height: 34, borderColor: "var(--line)", background: "#f8fbfc" }}
          onClick={e => { e.stopPropagation(); onFilterClick(); }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
        </div>
      </button>

      {/* chips */}
      <NightFilterChips
        className="mt-[10px] overflow-x-auto pb-[2px]"
        nightOnly={nightOnly}
        h24Only={h24Only}
        onToggleNight={onToggleNight}
        onToggleH24={onToggleH24}
      />
    </div>
  );
}
