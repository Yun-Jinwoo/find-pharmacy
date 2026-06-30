"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
}

const RESULTS = [
  { name: "온누리약국", sub: "강남구 테헤란로 · 종합병원 앞", dist: "320m", status: "open" as const, label: "운영 중" },
  { name: "24시 이안약국", sub: "강남구 강남대로 · 연중무휴", dist: "540m", status: "open" as const, label: "심야 운영" },
];

const RECENT = ["역삼동", "24시 약국", "공휴일 약국"];

const badgeStyle: Record<string, React.CSSProperties> = {
  open: { background: "rgba(22,163,74,0.12)", color: "#137a3a" },
};
const dotColor: Record<string, string> = { open: "#16A34A" };

export default function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState("");

  return (
    <div
      className="absolute inset-0 z-[60] bg-white flex flex-col"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      {/* header row */}
      <div className="flex items-center gap-[10px] px-[14px] pt-[54px] pb-[12px]">
        <div
          className="flex-1 flex items-center gap-[10px] rounded-[13px] border"
          style={{
            height: 44,
            borderColor: "var(--primary)",
            padding: "0 12px",
            background: "#f3f7f9",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="지역 · 약국 이름 검색"
            className="flex-1 border-0 outline-0 bg-transparent font-semibold"
            style={{ fontSize: 14, color: "var(--ink)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="border-0 bg-transparent cursor-pointer p-0" style={{ color: "#9fb3bc" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="border-0 bg-transparent cursor-pointer font-bold"
          style={{ fontSize: 13.5, color: "var(--muted)", padding: "8px 4px", flexShrink: 0 }}
        >
          취소
        </button>
      </div>

      {/* results */}
      {RESULTS.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.6px", padding: "4px 18px 3px" }}>
            검색 결과
          </div>
          {RESULTS.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-[10px] cursor-pointer"
              style={{ padding: "11px 14px", borderRadius: 13, margin: "2px 12px" }}
              onClick={onClose}
            >
              <div
                className="grid place-items-center rounded-[12px] flex-none"
                style={{ width: 40, height: 40, background: "rgba(11,143,172,0.1)", color: "var(--primary)" }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M9 7V5a3 3 0 0 1 6 0v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                  <path d="M12 11v6M9 14h6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[7px] flex-wrap">
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{r.name}</span>
                  <span
                    className="inline-flex items-center gap-[4px] rounded-full font-bold flex-none"
                    style={{ fontSize: 11, padding: "2px 8px", ...badgeStyle[r.status] }}
                  >
                    <span className="rounded-full flex-none" style={{ width: 5, height: 5, background: dotColor[r.status] }} />
                    {r.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{r.sub}</div>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--primary-deep)", fontVariantNumeric: "tabular-nums" }}>
                {r.dist}
              </span>
            </div>
          ))}
        </>
      )}

      {/* recent */}
      <div style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.6px", padding: "14px 18px 5px" }}>
        최근 검색
      </div>
      <div className="flex flex-wrap gap-[7px]" style={{ padding: "4px 18px" }}>
        {RECENT.map(r => (
          <button
            key={r}
            onClick={() => setQuery(r)}
            className="border-0 cursor-pointer rounded-full font-semibold"
            style={{ fontSize: 12.5, color: "#3a5560", background: "#f0f5f7", padding: "7px 12px" }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
