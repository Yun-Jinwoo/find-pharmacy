"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pharmacy } from "@/lib/types";
import { MOCK_PHARMACIES } from "@/lib/mockData";
import { fetchNearbyPharmacies, recalcDistances } from "@/lib/pharmacyApi";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import BottomSheet from "@/components/BottomSheet";
import MobileTopBar from "@/components/MobileTopBar";
import LocationPermission from "@/components/LocationPermission";
import RegionSelect from "@/components/RegionSelect";
import ErrorScreen from "@/components/ErrorScreen";
import Toast from "@/components/Toast";
import SearchOverlay from "@/components/SearchOverlay";
import FilterSheet from "@/components/FilterSheet";
import DevNav from "@/components/DevNav";
import { requestLocation, type Coords } from "@/lib/geolocation";
import { reverseGeocode } from "@/lib/geocoder";

export type Phase = "scan" | "located" | "listed";
export type AppState = "permission" | "denied" | "error" | "loaded";

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
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [filterRadius, setFilterRadius] = useState(10);
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

  const activeId = detailId ?? hoveredId;
  const selectedPharmacy = detailId
    ? pharmacies.find(p => p.id === detailId) ?? null
    : null;

  const displayPharmacies = pharmacies.filter(p => {
    if (p.distanceM > filterRadius * 1000) return false;
    if (h24Only && p.nightBadge !== "24h") return false;
    if (nightOnly && !p.nightBadge) return false;
    return true;
  });

  const favoritePharmacies = pharmacies.filter(p => favorites.includes(p.id));
  const tabPharmacies = (activeTab === "favorites" ? favoritePharmacies : displayPharmacies)
    .slice()
    .sort((a, b) => a.distanceM - b.distanceM);

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

  function startScan() {
    setPhase("scan");
    setAppState("loaded");
    setAnimKey(k => k + 1);
  }

  async function loadAndStart(coords: Coords) {
    setUserCoords(coords);
    setSearchCenter(coords);
    try {
      const data = await fetchNearbyPharmacies(coords.lat, coords.lng);
      setPharmacies(data.length > 0 ? data : MOCK_PHARMACIES);
    } catch {
      setPharmacies(MOCK_PHARMACIES);
      showToast("약국 데이터를 불러오지 못했어요. 샘플 데이터를 표시합니다.");
    }
    setMapKey(k => k + 1);
    startScan();
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

  function switchState(s: AppState) {
    setDetailId(null);
    setHoveredId(null);
    if (s === "loaded") {
      setPhase("scan");
    }
    setAppState(s);
  }

  function handleCardClick(p: Pharmacy) {
    setDetailId(p.id);
    setHoveredId(p.id);
  }
  function handleDetailClose() {
    setDetailId(null);
    setHoveredId(null);
  }
  function handleHoverEnter(id: string) { setHoveredId(id); }
  function handleHoverLeave(id: string) {
    setHoveredId(cur => (cur === id ? null : cur));
  }

  function handleSearchSelect(p: Pharmacy) {
    setSearchOpen(false);
    setDetailId(p.id);
    setHoveredId(p.id);
  }

  function handleFilterApply(opts: { radius: number }) {
    setFilterRadius(opts.radius);
  }


  function handleMapMove(lat: number, lng: number, radiusKm: number) {
    setMovedCenter({ lat, lng });
    setViewportRadiusKm(radiusKm);
  }

  async function handleResearch() {
    if (!movedCenter) return;
    const center = movedCenter;
    setSearchCenter(center);
    setMovedCenter(null);

    const numOfRows = Math.min(100, Math.max(50, Math.round(viewportRadiusKm * viewportRadiusKm * 25)));

    let data: Pharmacy[];
    try {
      const raw = await fetchNearbyPharmacies(center.lat, center.lng, numOfRows);
      const list = raw.length > 0 ? raw : MOCK_PHARMACIES;
      data = userCoords ? recalcDistances(list, userCoords.lat, userCoords.lng) : list;
    } catch {
      data = userCoords ? recalcDistances(MOCK_PHARMACIES, userCoords.lat, userCoords.lng) : MOCK_PHARMACIES;
      showToast("약국 데이터를 불러오지 못했어요. 샘플 데이터를 표시합니다.");
    }

    setPharmacies(data);
    setMapKey(k => k + 1);
    startScan();
  }

  function handleToggleFavorite(id: string) {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try { localStorage.setItem("pharmacy-favorites", JSON.stringify(next)); }
      catch { /* ignore */ }
      return next;
    });
  }

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
        )}
        <DevNav current={appState} onChange={switchState} />
      </main>
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
          onToggleFavorite={handleToggleFavorite}
          onCardClick={handleCardClick}
          onCardEnter={handleHoverEnter}
          onCardLeave={handleHoverLeave}
          showToast={showToast}
          onExpandChange={setSheetExpanded}
        />
        <Toast message={toastMsg} />
        {searchOpen && (
          <SearchOverlay
            pharmacies={pharmacies}
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
        )}
        <DevNav current={appState} onChange={switchState} />
      </main>
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
        allPharmacies={pharmacies}
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
      )}
      <DevNav current={appState} onChange={switchState} />
    </main>
  );
}
