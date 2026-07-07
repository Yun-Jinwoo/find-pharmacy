"use client";

interface Props {
  type: "24h" | "night";
}

export default function NightBadge({ type }: Props) {
  const is24h = type === "24h";
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full font-bold flex-none text-[11.5px] px-[9px] py-[3px]"
      style={
        is24h
          ? { background: "linear-gradient(135deg, rgba(8,107,130,0.14), rgba(34,211,238,0.14))", color: "var(--primary-deep)" }
          : { background: "rgba(34,211,238,0.14)", color: "#0e7f96" }
      }
    >
      {is24h ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.7 15.9A8.5 8.5 0 1 1 12.1 3.3a7 7 0 0 0 8.6 12.6Z" />
        </svg>
      )}
      {is24h ? "24시간" : "심야"}
    </span>
  );
}
