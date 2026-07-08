"use client";

export default function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="w-full text-center"
        style={{
          maxWidth: 380,
          background: "#fff",
          borderRadius: 22,
          padding: "38px",
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.52)",
        }}
      >
        {/* error icon */}
        <div
          className="w-[72px] h-[72px] rounded-full grid place-items-center mx-auto mb-[22px]"
          style={{ background: "#fdf2e6", color: "#EA9006" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h1a4 4 0 0 1 .5 8H7a5 5 0 0 1-1-9.9" />
            <path d="M3 3l18 18" />
            <path d="M8.5 8.5A5 5 0 0 1 16 9" />
          </svg>
        </div>

        <h1
          className="m-0 leading-[1.4]"
          style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px" }}
        >
          약국 정보를 불러오지<br />못했어요
        </h1>
        <p
          className="leading-[1.6]"
          style={{ margin: "11px 0 26px", fontSize: 14, color: "var(--muted)" }}
        >
          네트워크 연결이 불안정해요.
          <br />연결 상태를 확인한 뒤 다시 시도해 주세요.
        </p>

        <button
          onClick={onRetry}
          className="h-[52px] rounded-[13px] border-0 font-extrabold text-white cursor-pointer flex items-center justify-center gap-[8px] mx-auto"
          style={{
            padding: "0 40px",
            fontSize: 14.5,
            background: "linear-gradient(135deg, #097A96, #086B82)",
            boxShadow: "0 14px 28px -14px rgba(11,143,172,0.9)",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          다시 시도
        </button>
      </div>
    </div>
  );
}
