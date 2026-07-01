"use client";

import { useState, useEffect } from "react";
import { Pharmacy } from "@/lib/types";

interface Props {
  pharmacies: Pharmacy[];
  onClose: () => void;
  onSelect: (p: Pharmacy) => void;
}

const RECENT_KEY = "pharmacy-recent";

const STATUS_BADGE: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  open:    { bg: "rgba(22,163,74,0.12)",  color: "#137a3a", dot: "#16A34A", label: "운영 중" },
  closing: { bg: "rgba(234,144,6,0.13)",  color: "#b36900", dot: "#EA9006", label: "곧 마감" },
  closed:  { bg: "rgba(148,163,184,0.15)", color: "#64748b", dot: "#94A3B8", label: "영업 종료" },
};

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); }
  catch { return []; }
}

function saveRecent(terms: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(terms)); }
  catch { /* ignore */ }
}

export default function SearchOverlay({ pharmacies, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { setRecent(loadRecent()); }, []);

  const results = query.trim()
    ? pharmacies.filter(p =>
        p.name.includes(query.trim()) || p.address.includes(query.trim())
      )
    : [];

  function addRecent(term: string) {
    const next = [term, ...recent.filter(r => r !== term)].slice(0, 5);
    setRecent(next);
    saveRecent(next);
  }

  function handleSelect(p: Pharmacy) {
    if (query.trim()) addRecent(query.trim());
    onSelect(p);
  }

  function handleRecentClick(term: string) {
    setQuery(term);
  }

  function clearRecent() {
    setRecent([]);
    saveRecent([]);
  }

  return (
    <div
      className="absolute inset-0 z-[60] bg-white flex flex-col"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      {/* header */}
      <div className="flex items-center gap-[10px] px-[14px] pt-[54px] pb-[12px]">
        <div
          className="flex-1 flex items-center gap-[10px] rounded-[13px] border"
          style={{ height: 44, borderColor: "var(--primary)", padding: "0 12px", background: "#f3f7f9" }}
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
      {results.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.6px", padding: "4px 18px 3px" }}>
            검색 결과 {results.length}곳
          </div>
          {results.map(p => {
            const badge = STATUS_BADGE[p.status];
            return (
              <div
                key={p.id}
                className="flex items-center gap-[10px] cursor-pointer"
                style={{ padding: "11px 14px", borderRadius: 13, margin: "2px 12px" }}
                onClick={() => handleSelect(p)}
              >
                <div className="grid place-items-center rounded-[12px] flex-none" style={{ width: 40, height: 40, background: "rgba(11,143,172,0.1)", color: "var(--primary)" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M9 7V5a3 3 0 0 1 6 0v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                    <path d="M12 11v6M9 14h6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[7px] flex-wrap">
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                    <span className="inline-flex items-center gap-[4px] rounded-full font-bold flex-none" style={{ fontSize: 11, padding: "2px 8px", background: badge.bg, color: badge.color }}>
                      <span className="rounded-full flex-none" style={{ width: 5, height: 5, background: badge.dot }} />
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }} className="truncate">{p.address}</div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--primary-deep)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                  {p.distanceM >= 1000 ? (p.distanceM / 1000).toFixed(1) + "km" : Math.round(p.distanceM / 10) * 10 + "m"}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* empty state */}
      {query.trim() && results.length === 0 && (
        <div className="flex-1 grid place-items-center" style={{ color: "var(--muted)", fontSize: 14 }}>
          <div className="text-center">
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>"{query}" 검색 결과 없음</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>다른 이름이나 주소로 검색해보세요</div>
          </div>
        </div>
      )}

      {/* recent */}
      {!query && recent.length > 0 && (
        <>
          <div className="flex items-center justify-between" style={{ padding: "14px 18px 5px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.6px" }}>최근 검색</span>
            <button onClick={clearRecent} className="border-0 bg-transparent cursor-pointer" style={{ fontSize: 11, color: "#9fb3bc" }}>전체 삭제</button>
          </div>
          <div className="flex flex-wrap gap-[7px]" style={{ padding: "4px 18px" }}>
            {recent.map(r => (
              <button
                key={r}
                onClick={() => handleRecentClick(r)}
                className="border-0 cursor-pointer rounded-full font-semibold"
                style={{ fontSize: 12.5, color: "#3a5560", background: "#f0f5f7", padding: "7px 12px" }}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
