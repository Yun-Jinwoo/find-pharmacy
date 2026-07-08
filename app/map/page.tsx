"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pharmacy } from "@/lib/types";
import { MOCK_PHARMACIES } from "@/lib/mockData";
import { fetchNearbyPharmacies, recalcDistances, haversineM } from "@/lib/pharmacyApi";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import BottomSheet from "@/components/BottomSheet";
import DetailPanel from "@/components/DetailPanel";
import MobileTopBar from "@/components/MobileTopBar";
import LocationPermission from "@/components/LocationPermission";
import RegionSelect from "@/components/RegionSelect";
import ErrorScreen from "@/components/ErrorScreen";
import Toast from "@/components/Toast";
import SearchOverlay from "@/components/SearchOverlay";
import FilterSheet from "@/components/FilterSheet";
import { requestLocation, type Coords } from "@/lib/geolocation";
import { reverseGeocode } from "@/lib/geocoder";

export type Phase = "scan" | "located" | "listed";
export type AppState = "permission" | "denied" | "error" | "loaded";

// 이 거리(m) 이상이면 비현실적인 도보 분 대신 "먼 거리"로 표시
const FAR_DISTANCE_M = 10_000;

// 화면에 보여줄 거리/도보시간을 "내 실제 위치" 기준으로 다시 계산해 덮어쓴다.
// (리스트 노출 여부를 정하는 반경 필터는 검색 위치 기준 distanceM을 그대로 쓰므로
// 이 함수는 필터링 이후, 렌더링 직전에만 적용한다 — lib/pharmacyApi.ts의 distance는
// 건드리지 않음)
function withRealDistance(list: Pharmacy[], from: Coords): Pharmacy[] {
  return list.map(p => {
    const distanceM = Math.round(haversineM(from.lat, from.lng, p.lat, p.lng));
    const walkTime = distanceM > FAR_DISTANCE_M
      ? "먼 거리"
      : `도보 ${Math.max(1, Math.round(distanceM / 67))}분`;
    return { ...p, distanceM, walkTime };
  });
}

// Static dark map background used for overlay screens
function MapBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{ background: "radial-gradient(130% 90% at 60% 30%, #123c47, #0C2A33 72%)" }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g stroke="rgba(120,200,220,0.09)" strokeWidth="16" fill="none" strokeLinecap="round">
          <path d="M-40 300 L 1060 240" />
          <path d="M-40 560 L 1060 520" />
          <path d="M260 -40 L 220 840" />
          <path d="M680 -40 L 740 840" />
        </g>
        <g stroke="rgba(120,200,220,0.04)" strokeWidth="8" fill="none">
          <path d="M-40 430 L 1060 400" />
          <path d="M470 -40 L 450 840" />
        </g>
      </svg>
    </div>
  );
}

function ResearchButton({ onClick, style }: { onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      className="absolute flex items-center gap-[7px] rounded-full border-0 cursor-pointer font-bold text-white"
      style={{
        padding: "11px 20px",
        fontSize: 14,
        background: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
        boxShadow: "0 8px 24px -8px rgba(11,143,172,0.85)",
        animation: "fadeIn 0.25s ease",
        ...style,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
      </svg>
      이 위치에서 재검색
    </button>
  );
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("permission");
  const [phase, setPhase] = useState<Phase>("scan");
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [nightOnly, setNightOnly] = useState(false);
  const [h24Only, setH24Only] = useState(false);
  const [search, setSearch] = useState<{ lat: number; lng: number; numOfRows: number } | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [filterRadius, setFilterRadius] = useState(10);
  // 재검색(지도 이동 후 "이 위치에서 재검색")으로 받아온 결과인지 — 재검색 결과는
  // 반경 필터(1~10km 슬라이더 상한 고정)를 우회해 지도=리스트를 항상 일치시킨다.
  const [isResearchResult, setIsResearchResult] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [regionName, setRegionName] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const [searchCenter, setSearchCenter] = useState<Coords | null>(null);
  const [movedCenter, setMovedCenter] = useState<Coords | null>(null);
  const [viewportRadiusKm, setViewportRadiusKm] = useState(1);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pharmacy-favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // 주변 약국 목록 — React Query가 검색 좌표(lat/lng/numOfRows)별 캐싱/중복요청 제거.
  // 같은 지역을 다시 검색하면 캐시에서 즉시 반환된다. 검색 트리거는 setSearch.
  const pharmaciesQuery = useQuery({
    queryKey: ["pharmacies", search?.lat, search?.lng, search?.numOfRows],
    queryFn: () => fetchNearbyPharmacies(search!.lat, search!.lng, search!.numOfRows),
    enabled: !!search,
  });

  // 서버 상태(query) → 화면용 파생.
  // 실제 API 데이터는 이미 검색 좌표(search.lat/lng) 기준 정확한 distanceM을 갖고 있으므로
  // (getParmacyLcinfoInqire가 요청 좌표 기준 distance를 내려줌) 그대로 쓴다.
  // MOCK 폴백(빈 결과·에러)만 클라이언트에서 거리 계산이 필요한데, 이때도 처음 GPS 위치가
  // 아니라 "지금 검색 중인 위치"(searchCenter)를 기준으로 삼아야 재검색(지도 이동 후
  // 다른 동네 조회) 시 반경 필터·거리 표시가 올바르게 그 위치 기준으로 맞춰진다.
  // (로딩 중엔 빈 배열 — 이 구간은 스캔 연출이 목록/핀을 가림)
  const pharmacies = useMemo<Pharmacy[]>(() => {
    if (pharmaciesQuery.data && pharmaciesQuery.data.length > 0) return pharmaciesQuery.data;
    if (pharmaciesQuery.data || pharmaciesQuery.isError) {
      return searchCenter ? recalcDistances(MOCK_PHARMACIES, searchCenter.lat, searchCenter.lng) : MOCK_PHARMACIES;
    }
    return [];
  }, [pharmaciesQuery.data, pharmaciesQuery.isError, searchCenter]);

  const activeId = detailId ?? hoveredId;
  const selectedPharmacy = useMemo(() => {
    if (!detailId) return null;
    const p = pharmacies.find(x => x.id === detailId);
    if (!p) return null;
    return userCoords ? withRealDistance([p], userCoords)[0] : p;
  }, [detailId, pharmacies, userCoords]);

  // 반경 필터(1~10km 슬라이더, 상한 고정)는 "내 주변" 최초 탐색에만 적용한다.
  // 재검색(지도 이동 후 이 위치에서 재검색)은 그 자체가 "이 범위를 보겠다"는
  // 의사표시이므로 반경 필터를 우회 — 슬라이더 상한(10km)보다 멀리서 재검색해도
  // 지도에 뜨는 약국이 리스트에서 사라지지 않는다. 야간/24시간 칩은 항상 적용.
  const displayPharmacies = useMemo(() => pharmacies.filter(p => {
    if (!isResearchResult && p.distanceM > filterRadius * 1000) return false;
    if (h24Only && p.nightBadge !== "24h") return false;
    if (nightOnly && !p.nightBadge) return false;
    return true;
  }), [pharmacies, filterRadius, h24Only, nightOnly, isResearchResult]);

  const favoritePharmacies = useMemo(
    () => pharmacies.filter(p => favorites.includes(p.id)),
    [pharmacies, favorites],
  );
  // 실제 카드에 표시할 목록 — 내 실제 위치 기준 거리/도보시간으로 덮어쓴 뒤 그 거리로 정렬.
  const tabPharmacies = useMemo(() => {
    const base = activeTab === "favorites" ? favoritePharmacies : displayPharmacies;
    const withReal = userCoords ? withRealDistance(base, userCoords) : base;
    return withReal.slice().sort((a, b) => a.distanceM - b.distanceM);
  }, [activeTab, favoritePharmacies, displayPharmacies, userCoords]);

  // 검색 오버레이용 — 필터와 무관하게 전체 목록을 내 실제 위치 기준 거리로 표시.
  const pharmaciesForSearch = useMemo(
    () => (userCoords ? withRealDistance(pharmacies, userCoords) : pharmacies),
    [pharmacies, userCoords],
  );

  // detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // phase timer — fires on every scan start (first load + re-search)
  useEffect(() => {
    if (animKey === 0) return;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setPhase("listed"); return; }
    const t1 = setTimeout(() => setPhase("located"), 1500);
    const t2 = setTimeout(() => setPhase("listed"), 2050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [animKey]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // 목록 조회 실패 시 안내 (MOCK 폴백은 위 파생 useMemo에서 처리)
  useEffect(() => {
    if (pharmaciesQuery.isError) {
      showToast("약국 데이터를 불러오지 못했어요. 샘플 데이터를 표시합니다.");
    }
  }, [pharmaciesQuery.isError, showToast]);

  function startScan() {
    setPhase("scan");
    setAppState("loaded");
    setAnimKey(k => k + 1);
  }

  // 새 검색 트리거: 쿼리 key(search)를 바꿔 fetch를 유발하고, 동시에 진입 스캔
  // 연출을 시작한다. fetch 완료를 기다리지 않으므로 연출과 데이터가 분리된다.
  function beginSearch(center: Coords, numOfRows: number, isResearch: boolean) {
    setSearch({ lat: center.lat, lng: center.lng, numOfRows });
    setIsResearchResult(isResearch);
    setMapKey(k => k + 1);
    startScan();
  }

  function loadAndStart(coords: Coords) {
    setUserCoords(coords);
    setSearchCenter(coords);
    beginSearch(coords, 50, false);
    // Reverse geocoding runs after SDK is ready (MapView loads it after startScan)
    reverseGeocode(coords.lat, coords.lng).then(name => {
      if (name) setRegionName(name);
    });
  }

  async function handleAllow() {
    setIsLocating(true);
    try {
      const coords = await requestLocation();
      await loadAndStart(coords);
    } catch {
      showToast("위치를 가져올 수 없어요. 지역을 직접 선택해 주세요.");
      setAppState("denied");
    } finally {
      setIsLocating(false);
    }
  }

  async function handleRegionConfirm(coords: Coords) {
    await loadAndStart(coords);
  }

  // "내 위치로" just re-centers the map on the already-known location — it
  // doesn't refetch GPS/pharmacy data, so drop the now-stale research prompt.
  function handleRecenterView() {
    setMovedCenter(null);
  }

  const handleCardClick = useCallback((p: Pharmacy) => {
    setDetailId(p.id);
    setHoveredId(p.id);
  }, []);
  const handleDetailClose = useCallback(() => {
    setDetailId(null);
    setHoveredId(null);
  }, []);
  const handleHoverEnter = useCallback((id: string) => { setHoveredId(id); }, []);
  const handleHoverLeave = useCallback((id: string) => {
    setHoveredId(cur => (cur === id ? null : cur));
  }, []);

  function handleSearchSelect(p: Pharmacy) {
    setSearchOpen(false);
    setDetailId(p.id);
    setHoveredId(p.id);
  }

  const handleFilterApply = useCallback((opts: { radius: number }) => {
    setFilterRadius(opts.radius);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterRadius(10);
    setNightOnly(false);
    setH24Only(false);
  }, []);


  function handleMapMove(lat: number, lng: number, radiusKm: number) {
    setMovedCenter({ lat, lng });
    setViewportRadiusKm(radiusKm);
  }

  function handleResearch() {
    if (!movedCenter) return;
    const center = movedCenter;
    const numOfRows = Math.min(100, Math.max(50, Math.round(viewportRadiusKm * viewportRadiusKm * 25)));
    setSearchCenter(center);
    setMovedCenter(null);
    beginSearch(center, numOfRows, true);
  }

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try { localStorage.setItem("pharmacy-favorites", JSON.stringify(next)); }
      catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Overlay states ──────────────────────────────────────
  if (appState !== "loaded") {
    return (
      <main className="relative h-dvh overflow-hidden">
        <MapBackground />
        {appState === "permission" && (
          <LocationPermission
            onAllow={handleAllow}
            onManual={() => setAppState("denied")}
            isLocating={isLocating}
          />
        )}
        {appState === "denied" && (
          <RegionSelect onConfirm={handleRegionConfirm} onRetry={handleAllow} />
        )}
        {appState === "error" && (
          <ErrorScreen onRetry={startScan} />
        )}      </main>
    );
  }

  // isMobile hasn't resolved yet (extremely brief, avoids hydration flash)
  if (isMobile === null) return null;

  // ── Mobile layout ───────────────────────────────────────
  if (isMobile) {
    return (
      <main className="relative h-dvh overflow-hidden">
        <MapView
          key={mapKey}
          pharmacies={pharmacies}
          phase={phase}
          activeId={activeId}
          focusId={detailId}
          isMobile
          userLat={userCoords?.lat}
          userLng={userCoords?.lng}
          initialCenter={searchCenter ?? undefined}
          onPinClick={handleCardClick}
          onPinEnter={handleHoverEnter}
          onPinLeave={handleHoverLeave}
          onRecenter={handleRecenterView}
          onMapMove={handleMapMove}
          sheetExpanded={sheetExpanded}
        />
        {movedCenter && phase === "listed" && (
          <ResearchButton
            onClick={handleResearch}
            style={{
              top: 182,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 31,
              opacity: sheetExpanded ? 0 : 1,
              pointerEvents: sheetExpanded ? "none" : "auto",
              transition: "opacity 0.25s ease",
            }}
          />
        )}
        <MobileTopBar
          phase={phase}
          nightOnly={nightOnly}
          h24Only={h24Only}
          onToggleNight={() => setNightOnly(v => !v)}
          onToggleH24={() => setH24Only(v => !v)}
          onSearchClick={() => setSearchOpen(true)}
          onFilterClick={() => setFilterOpen(true)}
        />
        <BottomSheet
          pharmacies={tabPharmacies}
          phase={phase}
          activeId={activeId}
          favorites={favorites}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetFilters={handleFilterReset}
          onToggleFavorite={handleToggleFavorite}
          onCardClick={handleCardClick}
          onCardEnter={handleHoverEnter}
          onCardLeave={handleHoverLeave}
          showToast={showToast}
          onExpandChange={setSheetExpanded}
        />
        <DetailPanel pharmacy={selectedPharmacy} onClose={handleDetailClose} showToast={showToast} />
        <Toast message={toastMsg} />
        {searchOpen && (
          <SearchOverlay
            pharmacies={pharmaciesForSearch}
            onClose={() => setSearchOpen(false)}
            onSelect={handleSearchSelect}
          />
        )}
        {filterOpen && (
          <FilterSheet
            pharmacies={pharmacies}
            initialRadius={filterRadius}
            onClose={() => setFilterOpen(false)}
            onApply={handleFilterApply}
          />
        )}      </main>
    );
  }

  // ── Desktop layout ──────────────────────────────────────
  return (
    <main
      className="relative grid h-screen min-h-[560px]"
      style={{
        gridTemplateColumns: "412px 1fr",
        boxShadow: "0 0 0 1px var(--line)",
      }}
    >
      <Sidebar
        pharmacies={tabPharmacies}
        allPharmacies={pharmaciesForSearch}
        phase={phase}
        activeId={activeId}
        selectedPharmacy={selectedPharmacy}
        favorites={favorites}
        activeTab={activeTab}
        regionName={regionName}
        searchOpen={searchOpen}
        nightOnly={nightOnly}
        h24Only={h24Only}
        onToggleNight={() => setNightOnly(v => !v)}
        onToggleH24={() => setH24Only(v => !v)}
        onTabChange={setActiveTab}
        onResetFilters={handleFilterReset}
        onToggleFavorite={handleToggleFavorite}
        onCardClick={handleCardClick}
        onCardEnter={handleHoverEnter}
        onCardLeave={handleHoverLeave}
        onDetailClose={handleDetailClose}
        onSearchClick={() => setSearchOpen(true)}
        onSearchClose={() => setSearchOpen(false)}
        onSearchSelect={handleSearchSelect}
        onFilterClick={() => setFilterOpen(true)}
        showToast={showToast}
      />
      <MapView
        key={mapKey}
        pharmacies={pharmacies}
        phase={phase}
        activeId={activeId}
        focusId={detailId}
        userLat={userCoords?.lat}
        userLng={userCoords?.lng}
        initialCenter={searchCenter ?? undefined}
        onPinClick={handleCardClick}
        onPinEnter={handleHoverEnter}
        onPinLeave={handleHoverLeave}
        onRecenter={handleRecenterView}
        onMapMove={handleMapMove}
      />
      {movedCenter && phase === "listed" && (
        <ResearchButton
          onClick={handleResearch}
          style={{ top: 20, left: "calc(206px + 50%)", transform: "translateX(-50%)", zIndex: 10 }}
        />
      )}
      <Toast message={toastMsg} />
      {filterOpen && (
        <div className="absolute z-[45]" style={{ top: 132, left: 412 - 24 - 260, width: 260 }}>
          <FilterSheet
            desktop
            pharmacies={pharmacies}
            initialRadius={filterRadius}
            onClose={() => setFilterOpen(false)}
            onApply={handleFilterApply}
          />
        </div>
      )}    </main>
  );
}
