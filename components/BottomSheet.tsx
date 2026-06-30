"use client";

import { useRef, useState, useEffect } from "react";
import { Pharmacy } from "@/lib/types";
import { Phase } from "@/app/page";
import PharmacyCard from "./PharmacyCard";

interface Props {
  pharmacies: Pharmacy[];
  phase: Phase;
  activeId: string | null;
  onCardClick: (p: Pharmacy) => void;
  onCardEnter: (id: string) => void;
  onCardLeave: (id: string) => void;
  showToast: (msg: string) => void;
}

const PEEK_FRAC = 0.5;

export default function BottomSheet({
  pharmacies,
  phase,
  activeId,
  onCardClick,
  onCardEnter,
  onCardLeave,
  showToast,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState("110%");
  const [animating, setAnimating] = useState(true);
  const dragging = useRef(false);
  const startY = useRef(0);
  const baseY = useRef(0);
  const isUp = useRef(false);
  const openCount = pharmacies.filter(p => p.status !== "closed").length;

  function getH() { return sheetRef.current?.offsetHeight ?? 400; }

  // Slide in to peek when phase becomes "listed"
  useEffect(() => {
    if (phase !== "listed") return;
    setAnimating(true);
    const peekY = getH() * PEEK_FRAC;
    setTranslateY(`${peekY}px`);
  }, [phase]);

  function onDown(e: React.PointerEvent) {
    if (translateY === "110%") return;
    dragging.current = true;
    startY.current = e.clientY;
    baseY.current = parseFloat(translateY) || 0;
    setAnimating(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const h = getH();
    let y = baseY.current + (e.clientY - startY.current);
    y = Math.max(0, Math.min(h * PEEK_FRAC, y));
    setTranslateY(`${y}px`);
  }

  function onUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const moved = e.clientY - startY.current;
    if (moved < -30) isUp.current = true;
    else if (moved > 30) isUp.current = false;
    setAnimating(true);
    setTranslateY(isUp.current ? "0px" : `${getH() * PEEK_FRAC}px`);
  }

  return (
    <div
      ref={sheetRef}
      className="absolute left-0 right-0 bottom-0 z-[35] bg-white flex flex-col"
      style={{
        height: "86%",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -16px 40px -20px rgba(8,53,66,0.45)",
        transform: `translateY(${translateY})`,
        transition: animating ? "transform 0.42s cubic-bezier(0.22,0.61,0.36,1)" : "none",
        touchAction: "none",
        willChange: "transform",
      }}
    >
      {/* drag grip */}
      <div
        className="flex-none flex justify-center cursor-grab"
        style={{ padding: "11px 0 6px", touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <span
          className="rounded-full"
          style={{ width: 42, height: 5, background: "#d3dfe4", display: "block" }}
        />
      </div>

      {/* header */}
      <div className="flex-none px-[20px] pb-[12px]">
        <h1
          className="m-0 tracking-[-0.4px]"
          style={{ fontSize: 19, fontWeight: 800 }}
        >
          주변 운영 중 약국{" "}
          <em className="not-italic" style={{ color: "var(--primary)" }}>{openCount}곳</em>
        </h1>
        <p
          className="flex items-center gap-[6px] m-0 mt-[4px]"
          style={{ fontSize: 12.5, color: "var(--muted)" }}
        >
          <span
            className="rounded-full flex-none"
            style={{
              width: 7,
              height: 7,
              background: "var(--open)",
              animation: "beat 1.8s infinite",
            }}
          />
          밤 9:41 기준 · 가까운 순
        </p>
      </div>

      {/* scrollable card list */}
      <div
        className="flex-1 overflow-y-auto px-[14px] pb-[30px]"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {pharmacies.map((p, i) => (
          <PharmacyCard
            key={p.id}
            pharmacy={p}
            index={i}
            phase={phase}
            isActive={activeId === p.id}
            showActions
            showToast={showToast}
            onClick={() => onCardClick(p)}
            onMouseEnter={() => onCardEnter(p.id)}
            onMouseLeave={() => onCardLeave(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
