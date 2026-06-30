"use client";

import { useState } from "react";

interface Props {
  onConfirm: () => void;
  onRetry: () => void;
}

const RECENT = ["역삼동", "24시 약국", "공휴일 약국"];

export default function RegionSelect({ onConfirm, onRetry }: Props) {
  const [region, setRegion] = useState("강남구 역삼동");

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
          자주 가는 지역을 선택하면 그 주변의 운영 중 약국을 안내해 드려요.
        </p>

        {/* region input */}
        <label style={{ fontSize: 11, fontWeight: 800, color: "#90a6af", letterSpacing: "0.5px" }}>
          지역 선택
        </label>
        <div
          className="flex items-center gap-[10px] mt-[7px]"
          style={{
            height: 48,
            border: "1.5px solid var(--primary)",
            borderRadius: 13,
            padding: "0 14px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <input
            type="text"
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="flex-1 border-0 outline-0 bg-transparent font-semibold"
            style={{ fontSize: 14, color: "var(--ink)" }}
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fb3bc" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* recent chips */}
        <div className="flex flex-wrap gap-[7px] mt-[12px]">
          {RECENT.map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="border-0 cursor-pointer rounded-full font-semibold"
              style={{ fontSize: 12.5, color: "#3a5560", background: "#f0f5f7", padding: "7px 12px" }}
            >
              {r}
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
            onClick={onConfirm}
            className="flex-1 h-[48px] border-0 rounded-[11px] font-extrabold text-white cursor-pointer"
            style={{
              fontSize: 14,
              background: "linear-gradient(135deg, #0B8FAC, #086B82)",
              boxShadow: "0 12px 26px -12px rgba(11,143,172,0.8)",
            }}
          >
            이 지역으로 약국 찾기
          </button>
        </div>
      </div>
    </div>
  );
}
