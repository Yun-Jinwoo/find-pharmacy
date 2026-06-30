"use client";

import { PharmacyStatus } from "@/lib/types";

interface Props {
  status: PharmacyStatus;
  label: string;
  size?: "sm" | "md";
}

const styles: Record<PharmacyStatus, string> = {
  open: "bg-[rgba(22,163,74,0.12)] text-[#137a3a]",
  closing: "bg-[rgba(234,144,6,0.14)] text-[#b06d04]",
  closed: "bg-[#eef2f4] text-[#6b7f88]",
};

const dotStyles: Record<PharmacyStatus, string> = {
  open: "bg-[#16A34A] animate-[beat_1.8s_infinite]",
  closing: "bg-[#EA9006]",
  closed: "bg-[#94A3B8]",
};

export default function StatusBadge({ status, label, size = "sm" }: Props) {
  const textSize = size === "md" ? "text-[12.5px] px-[11px] py-[5px]" : "text-[11.5px] px-[9px] py-[3px]";
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full font-bold flex-none ${textSize} ${styles[status]}`}
    >
      <span className={`w-[6px] h-[6px] rounded-full flex-none ${dotStyles[status]}`} />
      {label}
    </span>
  );
}
