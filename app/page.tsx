import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "약국 어디가 — 지금 문 연 약국만, 가까운 순으로",
  description:
    "밤 11시에도, 연휴 한복판에도. 현재 위치에서 지금 운영 중인 약국을 지도에서 바로 확인하세요.",
};

export default function LandingPage() {
  return <LandingClient />;
}
