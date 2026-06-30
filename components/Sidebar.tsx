"use client";

import { useState } from "react";
import { Pharmacy } from "@/lib/types";
import { Phase } from "@/app/page";
import PharmacyCard from "./PharmacyCard";
import DetailPanel from "./DetailPanel";

interface Props {
  pharmacies: Pharmacy[];
  phase: Phase;
  activeId: string | null;
  selectedPharmacy: Pharmacy | null;
  onCardClick: (p: Pharmacy) => void;
  onCardEnter: (id: string) => void;
  onCardLeave: (id: string) => void;
  onDetailClose: () => void;
  onSearchClick: () => void;
  onFilterClick: () => void;
  showToast: (msg: string) => void;
}

const CHIP_LABELS = ["운영 중", "심야 운영", "공휴일", "연중무휴"];

export default function Sidebar({
  pharmacies,
  phase,
  activeId,
  selectedPharmacy,
  onCardClick,
  onCardEnter,
  onCardLeave,
  onDetailClose,
  onSearchClick,
  onFilterClick,
  showToast,
}: Props) {
  const [activeChip, setActiveChip] = useState(0);
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
            <b style={{ color: "var(--primary-deep)", fontWeight: 700 }}>강남구 역삼동</b>
          </div>
        </div>
      </div>

      {/* search */}
      <div className="px-[24px]">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center gap-[10px] rounded-[13px] border text-left cursor-pointer"
          style={{
            height: 48,
            background: "#f3f7f9",
            borderColor: "var(--line)",
            padding: "0 14px",
          }}
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

      {/* filter chips */}
      <div className="flex gap-[8px] mt-[13px] mb-[4px] mx-[24px] flex-wrap">
        {CHIP_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setActiveChip(activeChip === i ? -1 : i)}
            className="border-0 rounded-full cursor-pointer font-semibold"
            style={{
              fontSize: 13,
              padding: "8px 13px",
              background: activeChip === i ? "var(--primary)" : "#f0f5f7",
              color: activeChip === i ? "#fff" : "#3a5560",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* list header */}
      <div className="px-[24px] pt-[16px] pb-[8px] flex items-baseline justify-between">
        <h1 className="m-0" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>
          운영 중 약국{" "}
          <em className="not-italic" style={{ color: "var(--primary)" }}>{openCount}곳</em>
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
        {pharmacies.map((p, i) => (
          <PharmacyCard
            key={p.id}
            pharmacy={p}
            index={i}
            phase={phase}
            isActive={activeId === p.id}
            onClick={() => onCardClick(p)}
            onMouseEnter={() => onCardEnter(p.id)}
            onMouseLeave={() => onCardLeave(p.id)}
            showToast={showToast}
          />
        ))}
      </div>

      {/* detail panel slides over */}
      <DetailPanel pharmacy={selectedPharmacy} onClose={onDetailClose} showToast={showToast} />
    </aside>
  );
}
