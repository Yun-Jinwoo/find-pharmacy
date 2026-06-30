"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pharmacy } from "@/lib/types";
import { MOCK_PHARMACIES } from "@/lib/mockData";
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activeId = detailId ?? hoveredId;
  const selectedPharmacy = detailId
    ? MOCK_PHARMACIES.find(p => p.id === detailId) ?? null
    : null;

  // detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // phase timer — runs when app becomes "loaded"
  useEffect(() => {
    if (appState !== "loaded") return;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setPhase("listed"); return; }
    const t1 = setTimeout(() => setPhase("located"), 1500);
    const t2 = setTimeout(() => setPhase("listed"), 2050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [appState]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  function startScan() {
    setPhase("scan");
    setAppState("loaded");
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

  // ── Overlay states ──────────────────────────────────────
  if (appState !== "loaded") {
    return (
      <main className="relative h-screen overflow-hidden">
        <MapBackground />
        {appState === "permission" && (
          <LocationPermission
            onAllow={startScan}
            onManual={() => setAppState("denied")}
          />
        )}
        {appState === "denied" && (
          <RegionSelect onConfirm={startScan} onRetry={startScan} />
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
      <main className="relative h-screen overflow-hidden">
        <MapView
          pharmacies={MOCK_PHARMACIES}
          phase={phase}
          activeId={activeId}
          isMobile
          onPinClick={handleCardClick}
          onPinEnter={handleHoverEnter}
          onPinLeave={handleHoverLeave}
          onRecenter={() => showToast("현재 위치로 이동했어요")}
        />
        <MobileTopBar
          phase={phase}
          activeChip={activeChip}
          onChipChange={setActiveChip}
          onSearchClick={() => setSearchOpen(true)}
          onFilterClick={() => setFilterOpen(true)}
        />
        <BottomSheet
          pharmacies={MOCK_PHARMACIES}
          phase={phase}
          activeId={activeId}
          onCardClick={handleCardClick}
          onCardEnter={handleHoverEnter}
          onCardLeave={handleHoverLeave}
          showToast={showToast}
        />
        <Toast message={toastMsg} />
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        {filterOpen && (
          <FilterSheet
            pharmacyCount={MOCK_PHARMACIES.filter(p => p.status !== "closed").length}
            onClose={() => setFilterOpen(false)}
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
        pharmacies={MOCK_PHARMACIES}
        phase={phase}
        activeId={activeId}
        selectedPharmacy={selectedPharmacy}
        onCardClick={handleCardClick}
        onCardEnter={handleHoverEnter}
        onCardLeave={handleHoverLeave}
        onDetailClose={handleDetailClose}
        onSearchClick={() => setSearchOpen(true)}
        onFilterClick={() => setFilterOpen(true)}
        showToast={showToast}
      />
      <MapView
        pharmacies={MOCK_PHARMACIES}
        phase={phase}
        activeId={activeId}
        onPinClick={handleCardClick}
        onPinEnter={handleHoverEnter}
        onPinLeave={handleHoverLeave}
        onRecenter={() => showToast("현재 위치로 이동했어요")}
      />
      <Toast message={toastMsg} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {filterOpen && (
        <FilterSheet
          pharmacyCount={MOCK_PHARMACIES.filter(p => p.status !== "closed").length}
          onClose={() => setFilterOpen(false)}
        />
      )}
      <DevNav current={appState} onChange={switchState} />
    </main>
  );
}
