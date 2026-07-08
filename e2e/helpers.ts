import { Page, expect } from "@playwright/test";

// 상세 조회(hpid) 목 응답 — 월~금 09:00–21:00, 토 09:00–15:00
const DETAIL_ITEM = {
  dutyTime1s: "0900", dutyTime1c: "2100",
  dutyTime2s: "0900", dutyTime2c: "2100",
  dutyTime3s: "0900", dutyTime3c: "2100",
  dutyTime4s: "0900", dutyTime4c: "2100",
  dutyTime5s: "0900", dutyTime5c: "2100",
  dutyTime6s: "0900", dutyTime6c: "1500",
};

/**
 * 외부 의존성 목킹:
 * - /api/pharmacies → [] : 앱이 MOCK_PHARMACIES(5곳)로 폴백 → 결정론적 목록
 * - /api/pharmacy?hpid= → 요일별 시간표
 * - dapi.kakao.com(지도 SDK) → 차단 : E2E는 목록/상세 플로우만 검증
 */
export async function mockBackend(page: Page) {
  await page.route(/\/api\/pharmacies\?/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route(/\/api\/pharmacy\?hpid=/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DETAIL_ITEM) }),
  );
  await page.route(/dapi\.kakao\.com/, route => route.abort());
}

/** 진입 → "위치 허용" → 사이드바 목록이 뜬 상태까지 */
export async function enterApp(page: Page) {
  await mockBackend(page);
  await page.goto("/");
  await page.getByRole("button", { name: "위치 허용" }).click();
  await expect(page.getByRole("heading", { name: /약국/ })).toBeVisible();
}

/** 약국 카드들 (aria-label "…상세 정보 보기") */
export function cards(page: Page) {
  return page.getByRole("button", { name: /상세 정보 보기/ });
}
