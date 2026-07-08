import { test, expect } from "@playwright/test";
import { enterApp, cards } from "./helpers";

// #3 접근성 작업 회귀 방지: 카드가 키보드로 조작 가능해야 한다
test("카드에 키보드 포커스 후 Enter로 상세를 연다", async ({ page }) => {
  await enterApp(page);

  const firstCard = cards(page).first();
  await firstCard.focus();
  await expect(firstCard).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "길찾기" })).toBeVisible();
});
