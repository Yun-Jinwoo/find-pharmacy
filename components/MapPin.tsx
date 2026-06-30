"use client";

import { Pharmacy } from "@/lib/types";
import { Phase } from "@/app/page";

interface Props {
  pharmacy: Pharmacy;
  index: number;
  isActive: boolean;
  phase: Phase;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const headGradients: Record<string, string> = {
  open: "linear-gradient(135deg,#1fb257,#138a43)",
  closing: "linear-gradient(135deg,#f6a722,#e08a06)",
  closed: "linear-gradient(135deg,#9fb0bb,#7d909b)",
};

export default function MapPin({ pharmacy, index, isActive, phase, onClick, onMouseEnter, onMouseLeave }: Props) {
  const revealed = phase !== "scan";
  const delay = `${index * 0.12}s`;

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: `${pharmacy.pinX}%`,
        top: `${pharmacy.pinY}%`,
        transformOrigin: "bottom center",
        zIndex: isActive ? 9 : 6,
        opacity: revealed ? 1 : 0,
        transform: revealed
          ? "translate(-50%, -100%) scale(1)"
          : "translate(-50%, -100%) scale(0.2)",
        transition: `opacity 0.5s ease ${delay}, transform 0.55s cubic-bezier(0.18,0.9,0.32,1.4) ${delay}`,
        willChange: "transform, opacity",
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* tooltip */}
      <div
        className="absolute left-1/2 pointer-events-none bg-[#0e2a33] text-white font-bold whitespace-nowrap rounded-[9px]"
        style={{
          bottom: "calc(100% + 8px)",
          fontSize: 12,
          padding: "6px 10px",
          transform: isActive
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(6px)",
          opacity: isActive ? 1 : 0,
          transition: "opacity 0.18s, transform 0.18s",
        }}
      >
        {pharmacy.name}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-[#0e2a33]" />
      </div>

      {/* pin head */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50% 50% 50% 3px",
          background: headGradients[pharmacy.status],
          boxShadow: "0 8px 18px -4px rgba(8,53,66,0.6)",
          display: "grid",
          placeItems: "center",
          transform: isActive ? "rotate(45deg) scale(1.16)" : "rotate(45deg)",
          outline: isActive ? "3px solid rgba(34,211,238,0.9)" : "none",
          outlineOffset: isActive ? 3 : 0,
          transition: "transform 0.18s, outline 0.15s",
        }}
      >
        <b className="text-white font-extrabold" style={{ fontSize: 15, transform: "rotate(-45deg)" }}>
          {pharmacy.pinLabel}
        </b>
      </div>
    </div>
  );
}
