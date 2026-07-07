"use client";

interface Props {
  nightOnly: boolean;
  h24Only: boolean;
  onToggleNight: () => void;
  onToggleH24: () => void;
  className?: string;
}

export default function NightFilterChips({ nightOnly, h24Only, onToggleNight, onToggleH24, className }: Props) {
  return (
    <div className={`flex gap-[8px] ${className ?? ""}`}>
      <button
        onClick={onToggleNight}
        className="flex-none border-0 font-semibold rounded-full cursor-pointer whitespace-nowrap"
        style={{
          fontSize: 13,
          padding: "8px 13px",
          background: nightOnly ? "linear-gradient(135deg, #2b3a6b, #1c2748)" : "rgba(255,255,255,0.94)",
          color: nightOnly ? "#fff" : "#234a55",
          boxShadow: "0 4px 12px -6px rgba(8,53,66,0.5)",
        }}
      >
        심야 운영
      </button>
      <button
        onClick={onToggleH24}
        className="flex-none border-0 font-semibold rounded-full cursor-pointer whitespace-nowrap"
        style={{
          fontSize: 13,
          padding: "8px 13px",
          background: h24Only ? "linear-gradient(135deg, var(--primary-deep), var(--accent))" : "rgba(255,255,255,0.94)",
          color: h24Only ? "#fff" : "#234a55",
          boxShadow: "0 4px 12px -6px rgba(8,53,66,0.5)",
        }}
      >
        24시간
      </button>
    </div>
  );
}
