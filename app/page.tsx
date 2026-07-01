"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pharmacy } from "@/lib/types";
import { MOCK_PHARMACIES } from "@/lib/mockData";
import { fetchNearbyPharmacies } from "@/lib/pharmacyApi";
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

export default function Home() {
  const [appState, setAppState] = useState<AppState>("permission");
  const [phase, setPhase] = useState<Phase>("scan");
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeChip, setActiveChip] = useState(0);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [filterOnlyOpen, setFilterOnlyOpen] = useState(false);
  const [filterRadius, setFilterRadius] = useState(10);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [regionName, setRegionName] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const [movedCenter, setMovedCenter] = useState<Coords | null>(null);
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
    if (filterOnlyOpen && p.status === "closed") return false;
    if (p.distanceM > filterRadius * 1000) return false;
    return true;
  });

  const favoritePharmacies = pharmacies.filter(p => favorites.includes(p.id));
  const tabPharmacies = activeTab === "favorites" ? favoritePharmacies : displayPharmacies;

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
    setMovedCenter(null);
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

  function handleFilterApply(opts: { onlyOpen: boolean; radius: number }) {
    setFilterOnlyOpen(opts.onlyOpen);
    setFilterRadius(opts.radius);
  }

  function handleMapMove(lat: number, lng: number) {
    setMovedCenter({ lat, lng });
  }

  async function handleResearch() {
    if (!movedCenter) return;
    await loadAndStart(movedCenter);
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
      <main className="relative h-screen overflow-hidden">
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
  const SonarPin = () => (
    <div style={{ position: "relative", width: 24, height: 24 }}>
      <span style={{
        position: "absolute", left: "50%", top: "50%",
        width: 24, height: 24, borderRadius: "50%",
        background: "rgba(11,143,172,0.32)",
        animation: "sonar 2.2s ease-out infinite",
      }} />
      <span style={{
        display: "block", position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        width: 18, height: 18, borderRadius: "50%",
        background: "var(--primary)",
        border: "3px solid white",
        boxShadow: "0 0 0 5px rgba(11,143,172,0.2), 0 4px 14px -4px rgba(11,143,172,0.75)",
        zIndex: 2,
      }} />
    </div>
  );

  if (isMobile) {
    return (
      <main className="relative h-screen overflow-hidden">
        <MapView
          key={mapKey}
          pharmacies={pharmacies}
          phase={phase}
          activeId={activeId}
          isMobile
          userLat={userCoords?.lat}
          userLng={userCoords?.lng}
          onPinClick={handleCardClick}
          onPinEnter={handleHoverEnter}
          onPinLeave={handleHoverLeave}
          onRecenter={() => showToast("현재 위치로 이동했어요")}
          onMapMove={handleMapMove}
        />
        {movedCenter && phase === "listed" && (
          <div
            className="absolute pointer-events-none"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 28 }}
          >
            <SonarPin />
          </div>
        )}
        {movedCenter && phase === "listed" && (
          <button
            onClick={handleResearch}
            className="absolute left-1/2 z-[29] flex items-center gap-[7px] rounded-full border-0 cursor-pointer font-bold text-white"
            style={{
              top: 110,
              transform: "translateX(-50%)",
              padding: "11px 20px",
              fontSize: 14,
              background: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
              boxShadow: "0 8px 24px -8px rgba(11,143,172,0.85)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
            </svg>
            이 위치에서 재검색
          </button>
        )}
        <MobileTopBar
          phase={phase}
          activeChip={activeChip}
          onChipChange={setActiveChip}
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
            initialOnlyOpen={filterOnlyOpen}
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
        phase={phase}
        activeId={activeId}
        selectedPharmacy={selectedPharmacy}
        favorites={favorites}
        activeTab={activeTab}
        regionName={regionName}
        onTabChange={setActiveTab}
        onToggleFavorite={handleToggleFavorite}
        onCardClick={handleCardClick}
        onCardEnter={handleHoverEnter}
        onCardLeave={handleHoverLeave}
        onDetailClose={handleDetailClose}
        onSearchClick={() => setSearchOpen(true)}
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
        onPinClick={handleCardClick}
        onPinEnter={handleHoverEnter}
        onPinLeave={handleHoverLeave}
        onRecenter={() => showToast("현재 위치로 이동했어요")}
        onMapMove={handleMapMove}
      />
      {movedCenter && phase === "listed" && (
        <div
          className="absolute pointer-events-none"
          style={{ top: "50%", left: "calc(206px + 50%)", transform: "translate(-50%, -50%)", zIndex: 9 }}
        >
          <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
            <line x1="24" y1="6"  x2="24" y2="15" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="24" y1="33" x2="24" y2="42" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="6"  y1="24" x2="15" y2="24" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="33" y1="24" x2="42" y2="24" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="9" stroke="var(--primary)" strokeWidth="2.2"/>
            <circle cx="24" cy="24" r="3.5" fill="var(--primary)"/>
            <line x1="24" y1="33" x2="24" y2="46" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round"/>
            <ellipse cx="24" cy="49" rx="4.5" ry="2" fill="rgba(11,143,172,0.35)"/>
          </svg>
        </div>
      )}
      {movedCenter && phase === "listed" && (
        <button
          onClick={handleResearch}
          className="absolute z-[10] flex items-center gap-[7px] rounded-full border-0 cursor-pointer font-bold text-white"
          style={{
            top: 20,
            left: "calc(206px + 50%)",
            transform: "translateX(-50%)",
            padding: "11px 20px",
            fontSize: 14,
            background: "linear-gradient(135deg, var(--primary), var(--primary-deep))",
            boxShadow: "0 8px 24px -8px rgba(11,143,172,0.85)",
            animation: "fadeIn 0.25s ease",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          이 위치에서 재검색
        </button>
      )}
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
          initialOnlyOpen={filterOnlyOpen}
          initialRadius={filterRadius}
          onClose={() => setFilterOpen(false)}
          onApply={handleFilterApply}
        />
      )}
      <DevNav current={appState} onChange={switchState} />
    </main>
  );
}
