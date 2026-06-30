"use client";

import { useState } from "react";
import { AppState } from "@/app/page";

const SCREENS: { key: AppState; label: string }[] = [
  { key: "permission", label: "01 위치 권한" },
  { key: "denied", label: "02 지역 선택" },
  { key: "error", label: "03 에러" },
  { key: "loaded", label: "04 메인" },
];

export default function DevNav({
  current,
  onChange,
}: {
  current: AppState;
  onChange: (s: AppState) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        pointerEvents: "auto",
      }}
    >
      {open && (
        <div
          style={{
            background: "rgba(14,42,51,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: 14,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            boxShadow: "0 16px 40px -12px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: "rgba(120,200,220,0.7)",
              letterSpacing: "0.8px",
              padding: "2px 4px 6px",
              textTransform: "uppercase",
            }}
          >
            화면 전환
          </span>
          {SCREENS.map((s) => (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              style={{
                border: "none",
                borderRadius: 9,
                padding: "7px 12px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
                background: current === s.key ? "#0B8FAC" : "rgba(255,255,255,0.08)",
                color: current === s.key ? "#fff" : "rgba(255,255,255,0.65)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {s.label}
              {current === s.key && (
                <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>●</span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          border: "none",
          borderRadius: 10,
          padding: "7px 12px",
          fontSize: 11.5,
          fontWeight: 700,
          cursor: "pointer",
          background: "rgba(14,42,51,0.88)",
          color: "rgba(120,200,220,0.9)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 20px -8px rgba(0,0,0,0.5)",
        }}
      >
        {open ? "닫기" : "화면 전환"}
      </button>
    </div>
  );
}
