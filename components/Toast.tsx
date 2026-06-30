"use client";

export default function Toast({ message }: { message: string | null }) {
  const visible = !!message;
  return (
    <div
      className="absolute left-1/2 z-[90] pointer-events-none whitespace-nowrap"
      style={{
        bottom: 42,
        background: "#0e2a33",
        color: "#fff",
        fontSize: 13.5,
        fontWeight: 600,
        padding: "12px 18px",
        borderRadius: 13,
        boxShadow: "0 14px 30px -12px rgba(0,0,0,0.5)",
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
        transition: "opacity 0.25s, transform 0.25s",
      }}
    >
      {message ?? " "}
    </div>
  );
}
