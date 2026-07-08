"use client";

interface Props {
  onAllow: () => void;
  onManual: () => void;
  isLocating?: boolean;
}

export default function LocationPermission({ onAllow, onManual, isLocating = false }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="w-full text-center"
        style={{
          maxWidth: 420,
          background: "#fff",
          borderRadius: 22,
          padding: "40px 38px",
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.52)",
        }}
      >
        {/* icon */}
        <div
          className="relative mx-auto mb-[36px]"
          style={{ width: 130, height: 130, animation: "floaty 4.5s ease-in-out infinite" }}
        >
          <span
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "41.5%",
              width: 20,
              height: 20,
              background: "rgba(34,211,238,0.35)",
              animation: "sonar 2.8s ease-out infinite",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "41.5%",
              width: 20,
              height: 20,
              background: "rgba(34,211,238,0.35)",
              animation: "sonar 2.8s ease-out 1.4s infinite",
            }}
          />
          <svg
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: "absolute",
              left: "50%",
              top: "46%",
              transform: "translate(-50%,-50%)",
              filter: "drop-shadow(0 10px 18px rgba(11,143,172,0.52))",
            }}
          >
            <path
              d="M12 22s-7.5-6-7.5-12A7.5 7.5 0 0 1 12 2.5 7.5 7.5 0 0 1 19.5 10c0 6-7.5 12-7.5 12Z"
              fill="#097A96"
            />
            <circle cx="12" cy="10" r="3" fill="#fff" />
          </svg>
        </div>

        <h1
          className="m-0 leading-[1.4]"
          style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}
        >
          내 주변 약국을 찾으려면
          <br />위치 권한이 필요해요
        </h1>
        <p
          className="leading-[1.6]"
          style={{ margin: "12px 0 28px", fontSize: 14, color: "var(--muted)" }}
        >
          현재 위치를 기준으로 가까운 운영 중<br />약국을 안내해 드려요.
        </p>

        <button
          onClick={onAllow}
          disabled={isLocating}
          className="w-full h-[52px] rounded-[13px] border-0 font-extrabold text-white cursor-pointer flex items-center justify-center gap-[8px]"
          style={{
            fontSize: 15.5,
            background: "linear-gradient(135deg, #097A96, #086B82)",
            boxShadow: "0 14px 28px -14px rgba(11,143,172,0.9)",
            opacity: isLocating ? 0.8 : 1,
          }}
        >
          {isLocating ? (
            <>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}
              >
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              위치 확인 중…
            </>
          ) : "위치 허용"}
        </button>
        <button
          onClick={onManual}
          className="w-full h-[48px] border-0 bg-transparent font-bold cursor-pointer"
          style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}
        >
          지역 직접 선택
        </button>
      </div>
    </div>
  );
}
