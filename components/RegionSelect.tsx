"use client";

import { useEffect, useRef, useState } from "react";
import { searchRegion, RegionResult } from "@/lib/geocoder";

interface Props {
  onConfirm: (coords: { lat: number; lng: number }) => void;
  onRetry: () => void;
}

// 전국 어디서든 검색 가능함을 보여주는 빠른 선택 예시 (서울 외 지역 포함)
const QUICK_PICKS: RegionResult[] = [
  { name: "강남구", address: "서울 강남구", lat: 37.5172, lng: 127.0473 },
  { name: "홍대", address: "서울 마포구 서교동", lat: 37.5574, lng: 126.9243 },
  { name: "이태원", address: "서울 용산구 이태원동", lat: 37.5340, lng: 126.9947 },
  { name: "해운대구", address: "부산 해운대구", lat: 35.1631, lng: 129.1635 },
  { name: "울산 남구", address: "울산 남구", lat: 35.5433, lng: 129.3300 },
];

const DEBOUNCE_MS = 300;

export default function RegionSelect({ onConfirm, onRetry }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<RegionResult | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestIdRef = useRef(0);

  // 입력 300ms debounce 후 카카오 키워드 검색 — 타이핑마다 API를 호출하지 않도록.
  // requestId로 늦게 도착한 이전 요청 결과가 최신 입력을 덮어쓰는 걸 방지.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      searchRegion(trimmed).then(list => {
        if (requestId !== requestIdRef.current) return; // stale response
        setResults(list);
        setLoading(false);
        setOpen(true);
        setActiveIndex(-1);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function selectResult(r: RegionResult) {
    setSelected(r);
    setQuery(r.name);
    setOpen(false);
  }

  function handleInputChange(value: string) {
    setQuery(value);
    if (selected) setSelected(null); // 확정 후 다시 편집하면 재선택 전까지 미확정
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = activeIndex >= 0 ? results[activeIndex] : results.length === 1 ? results[0] : null;
      if (pick) selectResult(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showInvalid = query.trim().length > 0 && !selected && !loading;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="w-full"
        style={{
          maxWidth: 420,
          background: "#fff",
          borderRadius: 22,
          padding: "36px 36px 32px",
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.52)",
        }}
      >
        {/* icon */}
        <div
          className="w-[52px] h-[52px] rounded-[15px] grid place-items-center"
          style={{ background: "#eef4f6", color: "var(--primary)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 11.5-5.4" />
            <path d="M3 3l18 18" />
            <circle cx="12" cy="10" r="2.5" opacity="0.5" />
          </svg>
        </div>

        <h1
          className="leading-[1.4]"
          style={{ margin: "18px 0 0", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}
        >
          위치 없이도 지역을 직접 골라<br />약국을 찾을 수 있어요
        </h1>
        <p
          className="leading-[1.6]"
          style={{ margin: "9px 0 22px", fontSize: 13.5, color: "var(--muted)" }}
        >
          자주 가는 지역을 검색하면 그 주변의 운영 중 약국을 안내해 드려요.
        </p>

        {/* region search combobox */}
        <label style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.5px" }}>
          지역 선택
        </label>
        <div className="relative mt-[7px]">
          <div
            className="flex items-center gap-[10px]"
            style={{
              height: 48,
              border: `1.5px solid ${showInvalid ? "#EA9006" : "var(--primary)"}`,
              borderRadius: 13,
              padding: "0 14px",
              transition: "border-color 0.15s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setOpen(true); }}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              placeholder="지역명을 입력하세요 (예: 울산 남구, 홍대)"
              className="flex-1 border-0 outline-0 bg-transparent font-semibold"
              style={{ fontSize: 14, color: "var(--ink)" }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fb3bc" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {open && (
            <div
              className="absolute left-0 right-0 overflow-y-auto"
              style={{
                top: "calc(100% + 6px)",
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: 13,
                boxShadow: "0 16px 32px -12px rgba(8,53,66,0.22)",
                maxHeight: 216,
                zIndex: 20,
                padding: 6,
              }}
            >
              {results.length === 0 ? (
                <div style={{ padding: "16px 10px", textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
                  일치하는 지역이 없어요
                </div>
              ) : (
                results.map((r, i) => (
                  <div
                    key={`${r.name}-${r.lat}-${r.lng}`}
                    // onMouseDown(not onClick) fires before the input's onBlur closes the list
                    onMouseDown={e => { e.preventDefault(); selectResult(r); }}
                    className="cursor-pointer"
                    style={{
                      padding: "9px 11px",
                      borderRadius: 9,
                      background: i === activeIndex ? "rgba(9,122,150,0.09)" : "transparent",
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{r.address}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ fontSize: 11.5, marginTop: 6, minHeight: 14, fontWeight: 700 }}>
          {loading && <span style={{ color: "var(--muted)" }}>검색 중…</span>}
          {!loading && selected && <span style={{ color: "#157a3a" }}>✓ 이 지역으로 약국을 찾을 수 있어요</span>}
          {!loading && showInvalid && <span style={{ color: "#b36900" }}>목록에서 지역을 선택해 주세요</span>}
        </div>

        {/* quick picks */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.5px", marginTop: 16, marginBottom: 8 }}>
          빠른 선택
        </div>
        <div className="flex flex-wrap gap-[7px]">
          {QUICK_PICKS.map(r => (
            <button
              key={r.name}
              onClick={() => selectResult(r)}
              className="border-0 cursor-pointer rounded-full font-semibold"
              style={{
                fontSize: 12.5,
                color: selected?.name === r.name ? "#fff" : "#3a5560",
                background: selected?.name === r.name ? "var(--primary)" : "#f0f5f7",
                padding: "7px 12px",
              }}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="flex gap-[9px] mt-[22px]">
          <button
            onClick={onRetry}
            className="flex-none flex items-center gap-[6px] border cursor-pointer rounded-[11px] font-bold"
            style={{
              fontSize: 13,
              color: "var(--primary)",
              borderColor: "var(--line)",
              background: "#fff",
              padding: "13px 16px",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            위치 다시 허용
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm({ lat: selected.lat, lng: selected.lng })}
            className="flex-1 h-[48px] border-0 rounded-[11px] font-extrabold text-white cursor-pointer"
            style={{
              fontSize: 14,
              background: "linear-gradient(135deg, #097A96, #086B82)",
              boxShadow: selected ? "0 12px 26px -12px rgba(11,143,172,0.8)" : "none",
              opacity: selected ? 1 : 0.4,
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            이 지역으로 약국 찾기
          </button>
        </div>
      </div>
    </div>
  );
}
