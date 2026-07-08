"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState 초기화로 클라이언트를 한 번만 생성 (리렌더마다 재생성 방지)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 약국 운영시간 등은 자주 안 바뀌므로 재요청을 넉넉히 억제
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 30 * 60 * 1000, // 30분
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
