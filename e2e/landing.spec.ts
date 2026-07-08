import { test, expect } from "@playwright/test";

// 루트(/)가 앱이 아니라 랜딩 페이지로 승격됐는지, CTA가 앱(/map)으로 가는지 확인
test("루트는 랜딩 페이지이고 CTA가 /map으로 이동한다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/약국 어디가/);

  const cta = page.getByRole("link", { name: "내 주변 약국 찾기" });
  await expect(cta).toBeVisible();
  await cta.click();

  await expect(page).toHaveURL(/\/map$/);
});
