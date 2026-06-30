# 약국 어디가 — 디자인 시스템

위치 기반 약국 찾기 서비스의 컴포넌트 라이브러리. 각 HTML은 **Claude Design 프리뷰 카드**(첫 줄 `@dsCard` 마커) 형식이며, 그대로 디자인 시스템 프로젝트로 동기화하거나 Next.js 구현의 재료로 쓸 수 있다.

## 컴포넌트 목록

| 파일 | 그룹 | 내용 |
| --- | --- | --- |
| `00-foundations.html` | Foundations | 컬러·타이포·라운드 토큰 |
| `01-status-badge.html` | Components | 운영 상태 뱃지 (운영중/곧 마감/종료) |
| `02-buttons.html` | Components | 길찾기·전화 버튼, 필터칩, 아이콘 버튼 |
| `03-pharmacy-card.html` | Components | 약국 목록 카드 (상태별) |
| `04-search-filter.html` | Components | 검색바 + 필터칩 |
| `05-map-pin.html` | Components | 지도 핀(상태별) + 내 위치 소나 |
| `06-countdown-sheet.html` | Components | 운영 카운트다운 카드 + 바텀시트 헤더 |

전체 화면 시안(모바일 메인·상세 / 데스크탑)은 별도 아티팩트로 존재:
- `../pharmacy-finder.html` (모바일)
- `../pharmacy-finder-desktop.html` (데스크탑)

## 디자인 토큰

```
Primary       #0B8FAC   Primary Deep  #086B82   Accent  #22D3EE
Map BG        #0C2A33
운영중        #16A34A   곧 마감       #EA9006   영업종료 #94A3B8
Ink #0E2A33  Muted #5E7C88  Line #E4EDF1  BG #E8EFF2
폰트: 시스템 한글 스택(Apple SD Gothic Neo / Pretendard 폴백)
라운드: 버튼11 · 카드15 · 시트26 · 칩/뱃지 full
```

## Claude Design으로 가져가는 법

이 웹 환경에서는 design 로그인 인증이 안 돼 자동 동기화가 불가하다. 두 경로 중 택1:

1. **로컬 터미널 Claude Code**에서 `/design-login` 후 `/design-sync` 실행 → 이 폴더를 디자인 시스템 프로젝트로 푸시
2. **claude.ai/design**에서 프로젝트 생성 → "Send to Claude Code Web"으로 작업공간에 시드한 뒤 동기화

## 구현 메모

- 스택: Next.js (App Router) + 카카오맵 JS SDK + Vercel
- 백엔드: Next.js Route Handlers (공공데이터 약국 API 프록시 + "현재 운영중" 계산)
- DB: MVP는 없음 (즐겨찾기는 localStorage)
- 모바일 = 바텀시트 / 데스크탑 = 좌측 패널 + 큰 지도 (반응형 분기)
