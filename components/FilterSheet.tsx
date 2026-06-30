"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  pharmacyCount: number;
}

interface Toggle { label: string; on: boolean }

export default function FilterSheet({ onClose, pharmacyCount }: Props) {
  const [radius, setRadius] = useState(3);
  const [toggles, setToggles] = useState<Toggle[]>([
    { label: "운영 중만 보기", on: true },
    { label: "심야 운영 (24시)", on: true },
    { label: "공휴일 운영", on: false },
    { label: "연중무휴", on: false },
  ]);

  function flip(i: number) {
    setToggles(prev => prev.map((t, j) => j === i ? { ...t, on: !t.on } : t));
  }

  return (
    <>
      {/* backdrop */}
      <div
        className="absolute inset-0 z-[40]"
        style={{ background: "rgba(12,42,51,0.5)" }}
        onClick={onClose}
      />

      {/* sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 z-[45] bg-white flex flex-col"
        style={{
          borderRadius: "22px 22px 0 0",
          padding: "8px 18px 32px",
          animation: "sheetIn 0.38s cubic-bezier(0.22,0.61,0.36,1) forwards",
        }}
      >
        {/* grip */}
        <div className="flex justify-center pb-[10px]">
          <span className="rounded-full" style={{ width: 34, height: 4, background: "#d3dfe4", display: "block" }} />
        </div>

        {/* title row */}
        <div className="flex items-center justify-between mb-[14px]">
          <h2 className="m-0" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" }}>필터</h2>
          <button
            onClick={() => {
              setToggles(prev => prev.map(t => ({ ...t, on: false })));
              setRadius(3);
            }}
            className="border-0 bg-transparent cursor-pointer font-bold"
            style={{ fontSize: 12.5, color: "var(--muted)" }}
          >
            초기화
          </button>
        </div>

        {/* toggles */}
        {toggles.map((t, i) => (
          <div key={t.label}>
            <div className="flex items-center justify-between" style={{ padding: "12px 0" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.on ? "var(--ink)" : "var(--muted)" }}>
                {t.label}
              </span>
              <button
                onClick={() => flip(i)}
                className="border-0 cursor-pointer relative flex-none"
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  background: t.on ? "var(--primary)" : "#d3dfe4",
                  padding: 0,
                  transition: "background 0.2s",
                }}
              >
                <span
                  className="absolute top-[3px] rounded-full bg-white"
                  style={{
                    width: 20,
                    height: 20,
                    left: t.on ? "calc(100% - 23px)" : 3,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>
            {i < toggles.length - 1 && (
              <div style={{ height: 1, background: "var(--line)" }} />
            )}
          </div>
        ))}

        {/* radius slider */}
        <div style={{ marginTop: 18 }}>
          <div className="flex items-center justify-between mb-[10px]">
            <span style={{ fontSize: 14, fontWeight: 600 }}>검색 반경</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
              {radius}km
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={radius}
            onChange={e => setRadius(+e.target.value)}
            className="w-full"
            style={{
              accentColor: "var(--primary)",
              height: 5,
              cursor: "pointer",
            }}
          />
          <div className="flex justify-between" style={{ fontSize: 10.5, color: "#9fb3bc", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
            <span>1km</span><span>10km</span>
          </div>
        </div>

        {/* confirm */}
        <button
          onClick={onClose}
          className="w-full border-0 rounded-[13px] font-extrabold text-white cursor-pointer flex items-center justify-center"
          style={{
            height: 52,
            fontSize: 14.5,
            marginTop: 20,
            background: "linear-gradient(135deg, #0B8FAC, #086B82)",
            boxShadow: "0 12px 26px -12px rgba(11,143,172,0.85)",
          }}
        >
          약국 {pharmacyCount}곳 보기
        </button>
      </div>
    </>
  );
}
