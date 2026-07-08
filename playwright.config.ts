import { defineConfig, devices } from "@playwright/test";

/**
 * 약국 어디가 E2E 설정.
 * - reducedMotion: "reduce" → 앱의 진입 스캔 애니메이션을 건너뛰어(코드에 이미
 *   그 분기 존재) 목록이 즉시 뜨므로 테스트가 결정론적.
 * - geolocation + permissions → "위치 허용" 플로우를 실제 GPS 없이 태움.
 * 공공 API/카카오 SDK 목킹은 각 테스트의 helpers(mockBackend)에서 처리.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    reducedMotion: "reduce",
    geolocation: { latitude: 37.5665, longitude: 126.978 },
    permissions: ["geolocation"],
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
