"use client";

import { useQuery } from "@tanstack/react-query";
import { Pharmacy } from "@/lib/types";
import { formatDistance } from "@/lib/mockData";
import StatusBadge from "./StatusBadge";
import { callPharmacy, navigateTo } from "@/lib/actions";
import { fetchPharmacyDetail } from "@/lib/pharmacyApi";

interface Props {
  pharmacy: Pharmacy | null;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

const countdownStyles = {
  "": { wrap: "bg-[rgba(22,163,74,0.09)] border-[rgba(22,163,74,0.18)]", icon: "bg-[#16A34A]", b: "text-[#137a3a]", small: "text-[#5f8a70]" },
  cl: { wrap: "bg-[rgba(234,144,6,0.1)] border-[rgba(234,144,6,0.22)]", icon: "bg-[#EA9006]", b: "text-[#b06d04]", small: "text-[#9c7322]" },
  cd: { wrap: "bg-[#f1f4f6] border-[var(--line)]", icon: "bg-[#94A3B8]", b: "text-[#5f7178]", small: "text-[#7d909b]" },
};

export default function DetailPanel({ pharmacy, onClose, showToast }: Props) {
  const isOpen = !!pharmacy;
  const cd = pharmacy ? countdownStyles[pharmacy.countdownType] : countdownStyles[""];

  // 상세 요일별 운영시간 — React Query가 hpid별 캐싱/중복요청 제거를 담당.
  // 같은 약국을 다시 열면 재요청 없이 캐시에서 즉시 표시된다.
  // (이전엔 useRef Map + 수동 로딩 state + useEffect로 직접 캐싱하던 것을 대체)
  const { data: detailHours, isLoading: hoursLoading } = useQuery({
    queryKey: ["pharmacyDetail", pharmacy?.id],
    queryFn: () => fetchPharmacyDetail(pharmacy!.id),
    enabled: !!pharmacy,
  });

  const weeklyHours = detailHours ?? pharmacy?.weeklyHours ?? [];

  return (
    <div
      className={`absolute inset-0 bg-white z-[38] flex flex-col
        transition-transform duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)]
        ${isOpen ? "translate-x-0 visible" : "-translate-x-full invisible"}`}
    >
      {/* top bar */}
      <div className="flex items-center gap-[10px] px-[22px] pt-[18px] pb-[6px]">
        <button
          onClick={onClose}
          aria-label="목록으로"
          className="w-[38px] h-[38px] rounded-[11px] border border-[var(--line)] bg-white
            grid place-items-center text-[var(--ink)] cursor-pointer
            hover:bg-[#f3f7f9] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[13px] text-[var(--muted)] font-semibold">목록으로</span>
      </div>

      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pb-[10px] [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-thumb]:bg-[#dce6ea] [&::-webkit-scrollbar-thumb]:rounded-full">
        {pharmacy && (
          <>
            {/* hero */}
            <div>
              <StatusBadge status={pharmacy.status} label={pharmacy.statusLabel} size="md" />
              <h2 className="mt-[12px] mb-[5px] text-[24px] font-extrabold tracking-[-0.6px]">
                {pharmacy.name}
              </h2>
              <p className="text-[13.5px] text-[var(--muted)]">{pharmacy.subText}</p>

              {/* countdown */}
              <div className={`mt-[15px] border rounded-[14px] p-[13px_15px] flex items-center gap-[11px] ${cd.wrap}`}>
                <div className={`w-[34px] h-[34px] rounded-[10px] grid place-items-center flex-none ${cd.icon}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div>
                  <b className={`text-[14px] ${cd.b}`}>{pharmacy.closeText}</b>
                  <small className={`block text-[12px] mt-[2px] ${cd.small}`}>{pharmacy.closeSubText}</small>
                </div>
              </div>
            </div>

            {/* hours */}
            <h3 className="text-[11.5px] font-extrabold text-[#90a6af] tracking-[0.8px] uppercase mt-[20px] mb-[10px]">
              운영 시간
            </h3>
            <div className="border border-[var(--line)] rounded-[14px] overflow-hidden">
              {hoursLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center px-[15px] py-[11px] ${i > 0 ? "border-t border-[var(--line)]" : ""}`}
                  >
                    <div className="w-14 h-[14px] rounded-[4px] bg-[#e8eef1] animate-pulse" />
                    <div className="w-28 h-[14px] rounded-[4px] bg-[#e8eef1] animate-pulse" />
                  </div>
                ))
              ) : (() => {
                const todayJs = new Date().getDay();
                return weeklyHours.map((row, i) => {
                  const isToday = row.jsDay === todayJs;
                  return (
                    <div
                      key={i}
                      className={`flex justify-between px-[15px] py-[11px] text-[14px]
                        ${i > 0 ? "border-t border-[var(--line)]" : ""}
                        ${isToday ? "bg-[rgba(11,143,172,0.06)]" : ""}`}
                    >
                      <span className={isToday ? "text-[var(--primary-deep)] font-bold" : "text-[var(--muted)]"}>
                        {isToday ? `오늘 (${row.label.slice(0, 1)})` : row.label}
                      </span>
                      <span className={`tabular-nums font-semibold ${row.hours === "휴무" ? "text-[var(--muted)]" : ""}`}>
                        {row.hours}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>

            {/* info rows */}
            <h3 className="text-[11.5px] font-extrabold text-[#90a6af] tracking-[0.8px] uppercase mt-[20px] mb-[10px]">
              정보
            </h3>
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />
                  </svg>
                ),
                label: "주소",
                value: pharmacy.address,
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                  </svg>
                ),
                label: "전화",
                value: pharmacy.phone,
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11l19-9-9 19-2-8-8-2Z" />
                  </svg>
                ),
                label: "거리",
                value: `${formatDistance(pharmacy.distanceM)} · ${pharmacy.walkTime}`,
              },
            ].map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-[13px] px-[2px] py-[13px] ${i > 0 ? "border-t border-[var(--line)]" : ""}`}
              >
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[#eef4f6] text-[var(--primary)] grid place-items-center flex-none">
                  {row.icon}
                </div>
                <div>
                  <div className="text-[11.5px] text-[var(--muted)] mb-[1px]">{row.label}</div>
                  <div className="text-[14.5px] font-semibold">{row.value}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* action buttons */}
      <div className="flex-none px-[22px] py-[14px] flex gap-[10px] border-t border-[var(--line)]">
        <button
          className="w-[54px] h-[50px] rounded-[13px] bg-[#eef4f6] text-[var(--primary-deep)]
            grid place-items-center cursor-pointer border-0 active:scale-95 transition-transform"
          aria-label="전화"
          onClick={() => {
            if (!pharmacy) return;
            const ok = callPharmacy(pharmacy.phone);
            if (!ok) showToast?.("전화번호 정보가 없어요");
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
          </svg>
        </button>
        <button
          className="flex-1 h-[50px] rounded-[13px] border-0 cursor-pointer font-extrabold text-[14.5px]
            flex items-center justify-center gap-[8px] text-white active:scale-95 transition-transform
            hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
            boxShadow: "0 12px 26px -12px rgba(11,143,172,0.8)",
          }}
          onClick={() => pharmacy && navigateTo(pharmacy.name, pharmacy.lat, pharmacy.lng)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2Z" />
          </svg>
          길찾기
        </button>
      </div>
    </div>
  );
}
