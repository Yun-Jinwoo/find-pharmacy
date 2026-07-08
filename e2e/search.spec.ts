import { test, expect } from "@playwright/test";
import { enterApp } from "./helpers";

test("검색 결과를 선택하면 상세가 열린다", async ({ page }) => {
  await enterApp(page);

  // 검색 열기 (사이드바의 검색 버튼)
  await page.getByRole("button", { name: /약국 이름 검색/ }).click();

  // 대부분의 약국명에 포함되는 "약국"으로 검색
  await page.getByPlaceholder("지역 · 약국 이름 검색").fill("약국");

  const result = page.getByRole("button", { name: /선택$/ }).first();
  await expect(result).toBeVisible();
  await result.click();

  await expect(page.getByRole("button", { name: "길찾기" })).toBeVisible();
});
