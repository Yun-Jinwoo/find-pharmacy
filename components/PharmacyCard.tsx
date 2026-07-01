"use client";

import { useEffect, useRef } from "react";
import { Pharmacy } from "@/lib/types";
import { formatDistance } from "@/lib/mockData";
import StatusBadge from "./StatusBadge";
import { Phase } from "@/app/page";
import { callPharmacy, navigateTo } from "@/lib/actions";

interface Props {
  pharmacy: Pharmacy;
  index: number;
  isActive: boolean;
  phase: Phase;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showActions?: boolean;
  showToast?: (msg: string) => void;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? "#ef4444" : "none"}
      stroke={filled ? "#ef4444" : "#94a3b8"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function PharmacyCard({
  pharmacy,
  index,
  isActive,
  phase,
  isFavorite = false,
  onToggleFavorite,
  showActions = false,
  showToast,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const kmRef = useRef<HTMLSpanElement>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    if (phase !== "listed" || countedRef.current) return;
    countedRef.current = true;
    const el = kmRef.current;
    if (!el) return;
    const target = pharmacy.distanceM;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { el.textContent = formatDistance(target); return; }
    const dur = 700;
    const start = performance.now();
    function step(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      if (el) el.textContent = formatDistance(Math.round((target * e) / 10) * 10);
      if (p < 1) requestAnimationFrame(step);
      else if (el) el.textContent = formatDistance(target);
    }
    requestAnimationFrame(step);
  }, [phase, pharmacy.distanceM]);

  const listed = phase === "listed";
  const delay = `${index * 0.08}s`;
  const baseStyle: React.CSSProperties = {
    opacity: listed ? 1 : 0,
    transform: listed ? "none" : "translateY(12px)",
    transition: `opacity 0.45s ease ${delay}, transform 0.45s cubic-bezier(0.18,0.9,0.32,1.4) ${delay}, border-color 0.2s, box-shadow 0.2s`,
    borderColor: isActive ? "var(--primary)" : "var(--line)",
    boxShadow: isActive ? "0 14px 30px -18px rgba(11,143,172,0.6)" : undefined,
  };

  // ── Mobile card (showActions = true) ──
  if (showActions) {
    return (
      <div
        className="relative flex gap-[13px] items-start border rounded-[16px] mb-[11px] cursor-pointer"
        style={{ padding: "14px", ...baseStyle }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* favorite button — top-right overlay */}
        {onToggleFavorite && (
          <button
            className="absolute border-0 bg-transparent cursor-pointer p-[6px]"
            style={{ top: 8, right: 8 }}
            onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          >
            <HeartIcon filled={isFavorite} />
          </button>
        )}

        {/* icon */}
        <div
          className="flex-none grid place-items-center rounded-[13px]"
          style={{
            width: 46,
            height: 46,
            background: pharmacy.status === "closed" ? "#eef2f4" : "rgba(11,143,172,0.1)",
            color: pharmacy.status === "closed" ? "#94a3b8" : "var(--primary)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M9 7V5a3 3 0 0 1 6 0v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            <path d="M12 11v6M9 14h6" />
          </svg>
        </div>

        <div className="flex-1 min-w-0" style={{ paddingRight: 28 }}>
          <div className="flex items-center gap-[8px] flex-wrap">
            <span className="font-bold tracking-[-0.3px] truncate" style={{ fontSize: 16 }}>
              {pharmacy.name}
            </span>
            <StatusBadge status={pharmacy.status} label={pharmacy.statusLabel} />
          </div>
          <div className="flex items-center justify-between mt-[5px]">
            <span style={{ fontSize: 13, color: "#3a5560" }}>{pharmacy.hoursToday}</span>
            <span className="font-extrabold flex-none ml-[8px]" style={{ fontSize: 16, color: "var(--primary-deep)", fontVariantNumeric: "tabular-nums" }}>
              <span ref={kmRef}>0m</span>
              <small style={{ fontSize: 11, color: "#9fb3bc", fontWeight: 500, marginLeft: 5 }}>
                {pharmacy.walkTime}
              </small>
            </span>
          </div>
          {/* call / nav buttons */}
          <div className="flex gap-[8px] mt-[11px]">
            <button
              className="flex-1 border-0 rounded-[11px] font-bold flex items-center justify-center gap-[5px] cursor-pointer"
              style={{ fontSize: 13, padding: "9px 0", background: "#eef4f6", color: "var(--primary-deep)" }}
              onClick={e => {
                e.stopPropagation();
                const ok = callPharmacy(pharmacy.phone);
                if (!ok) showToast?.("전화번호 정보가 없어요");
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
              전화
            </button>
            <button
              className="flex-1 border-0 rounded-[11px] font-bold text-white flex items-center justify-center gap-[5px] cursor-pointer"
              style={{ fontSize: 13, padding: "9px 0", background: "var(--primary)" }}
              onClick={e => { e.stopPropagation(); navigateTo(pharmacy.name, pharmacy.lat, pharmacy.lng); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l19-9-9 19-2-8-8-2Z" />
              </svg>
              길찾기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop card ──
  return (
    <div
      className="border rounded-[15px] mb-[10px] cursor-pointer"
      style={{ padding: "14px 15px", ...baseStyle }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-[9px]">
        <span className="font-bold tracking-[-0.3px]" style={{ fontSize: 16 }}>
          {pharmacy.name}
        </span>
        <StatusBadge status={pharmacy.status} label={pharmacy.statusLabel} />
        {onToggleFavorite && (
          <button
            className="ml-auto border-0 bg-transparent cursor-pointer flex-none p-[4px]"
            onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          >
            <HeartIcon filled={isFavorite} />
          </button>
        )}
      </div>
      <div className="flex items-start justify-between mt-[6px] gap-[8px]">
        <div className="min-w-0">
          <div style={{ fontSize: 13, color: "#3a5560" }}>{pharmacy.hoursToday}</div>
          {pharmacy.subText && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{pharmacy.subText}</div>
          )}
        </div>
        <span className="font-extrabold flex-none" style={{ fontSize: 15, color: "var(--primary-deep)", fontVariantNumeric: "tabular-nums" }}>
          <span ref={kmRef}>0m</span>
          <small style={{ fontSize: 11, color: "#9fb3bc", fontWeight: 600, marginLeft: 6 }}>
            {pharmacy.walkTime}
          </small>
        </span>
      </div>
    </div>
  );
}
