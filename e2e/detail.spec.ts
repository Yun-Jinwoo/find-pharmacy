import { test, expect } from "@playwright/test";
import { enterApp, cards } from "./helpers";

test("카드를 클릭하면 상세 패널이 열린다", async ({ page }) => {
  await enterApp(page);

  await cards(page).first().click();

  // 상세 패널의 시그니처 요소들
  await expect(page.getByRole("button", { name: "길찾기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "목록으로" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /운영 시간/ })).toBeVisible();
});
