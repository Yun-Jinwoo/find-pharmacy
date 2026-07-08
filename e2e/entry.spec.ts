import { test, expect } from "@playwright/test";
import { enterApp, cards } from "./helpers";

test("위치 허용 시 주변 약국 목록이 표시된다", async ({ page }) => {
  await enterApp(page);

  // 목록 헤더 + 카드가 렌더됨
  await expect(page.getByRole("heading", { name: /운영 중 약국/ })).toBeVisible();
  await expect(cards(page).first()).toBeVisible();
  expect(await cards(page).count()).toBeGreaterThan(0);
});
