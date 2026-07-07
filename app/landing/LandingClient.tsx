"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./landing.css";

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

/* 약국 십자 아이콘 (핀 내부) */
function CrossIcon({ size, strokeWidth = 2.4 }: { size: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <path d="M4 13a8 8 0 0 0 16 0M4 13h16M8.5 9L15 3" />
    </svg>
  );
}

/* 히어로 핀 — hover 툴팁(htip) 포함 */
function HeroPin({
  tone,
  left,
  top,
  pd,
  tip,
}: {
  tone: "g" | "a";
  left: string;
  top: string;
  pd: string;
  tip: React.ReactNode;
}) {
  return (
    <div className={`pin ${tone}`} style={{ left, top, "--pd": pd } as CSSVars}>
      <span className="htip">{tip}</span>
      <div className="pin-head">
        <CrossIcon size={15} />
      </div>
    </div>
  );
}

/* 기능 무대 미니 핀 (26px) */
function MiniPin({ tone, left, top, pd }: { tone: "g" | "a"; left: string; top: string; pd: string }) {
  return (
    <div className={`pin ${tone}`} style={{ left, top, "--pd": pd } as CSSVars}>
      <div className="pin-head" style={{ width: 26, height: 26 }}>
        <CrossIcon size={12} />
      </div>
    </div>
  );
}

/* 폰 데모 핀 */
function PhonePin({ cls, left, top, pd }: { cls: string; left: string; top: string; pd: string }) {
  return (
    <div className={`pin ${cls}`} style={{ left, top, "--pd": pd } as CSSVars}>
      <div className="pin-head">
        <CrossIcon size={11} strokeWidth={2.6} />
      </div>
    </div>
  );
}

function Badge({ status, children }: { status: "open" | "closing" | "closed"; children: React.ReactNode }) {
  return (
    <span className={`badge ${status}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

export default function LandingClient() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observers: IntersectionObserver[] = [];
    const timeouts: number[] = [];
    const intervals: number[] = [];
    const rafs: number[] = [];
    const later = (fn: () => void, ms: number) => timeouts.push(window.setTimeout(fn, ms));
    const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

    /* ---------- 라이브 시계 (히어로 칩) ---------- */
    function koreanTime(d: Date) {
      const h = d.getHours();
      const m = d.getMinutes();
      const part = h < 6 ? "새벽" : h < 12 ? "오전" : h < 18 ? "낮" : h < 21 ? "저녁" : "밤";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return `${part} ${h12}:${m < 10 ? "0" + m : m}`;
    }
    const clockEl = $("#liveClock");
    const tick = () => {
      if (clockEl) clockEl.textContent = koreanTime(new Date());
    };
    tick();
    intervals.push(window.setInterval(tick, 30000));

    /* ---------- 히어로 진입 시퀀스 ----------
       0ms 소나 링 3회 → 900ms부터 핀 6개 160ms 간격 드롭
       → 1500ms 시계 칩 → 1650ms 헤드라인 20px 슬라이드업
       (타이밍은 전부 CSS transition-delay, 여기선 트리거만) */
    rafs.push(
      requestAnimationFrame(() => {
        rafs.push(requestAnimationFrame(() => root.classList.add("play")));
      })
    );

    /* ---------- 공통: 스크롤 리빌 ---------- */
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" }
    );
    $$("[data-reveal]").forEach((el) => io.observe(el));
    observers.push(io);

    /* ---------- 카운트업 (앱 PharmacyCard와 동일한 ease-out cubic, 800ms) ---------- */
    function countUp(el: Element) {
      const target = +(el.getAttribute("data-count") ?? 0);
      if (reduced || target === 0) {
        el.textContent = target.toLocaleString();
        return;
      }
      const dur = 800;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString();
        if (p < 1) rafs.push(requestAnimationFrame(step));
        else el.textContent = target.toLocaleString();
      };
      rafs.push(requestAnimationFrame(step));
    }
    const cio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            countUp(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    $$(".t-stat [data-count]").forEach((el) => cio.observe(el));
    observers.push(cio);

    /* ---------- 문제 섹션: 시계 카운트 + 리스트가 꺼지는 연출 ----------
       뷰포트 진입 시: 21:00 → 23:47 카운트(1.1s) 후
       카드가 900ms 간격으로 '영업종료'로 꺼지고 마지막 초록 카드가 팝 */
    const dying = $("#dyingList");
    const pH = $("#pClockH");
    const pM = $("#pClockM");
    const dCount = $("#dyingCount");
    function setOff(c: Element) {
      c.classList.add("off");
      const b = c.querySelector(".badge");
      if (b) {
        b.className = "badge closed";
        b.innerHTML = '<span class="dot"></span>영업종료';
      }
      const hours = c.querySelector(".hours");
      if (hours) hours.textContent = "오후 7시 마감";
    }
    function runProblem() {
      if (!dying || !pH || !pM || !dCount) return;
      if (reduced) {
        pH.textContent = "23";
        pM.textContent = "47";
        dCount.textContent = "1";
        dying.querySelectorAll(".d-card:not(.found)").forEach(setOff);
        return;
      }
      // 시계: 21:00 → 23:47
      const t0 = 21 * 60;
      const t1 = 23 * 60 + 47;
      const dur = 1100;
      const s = performance.now();
      const cstep = (now: number) => {
        const p = Math.min(1, (now - s) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        const t = Math.round(t0 + (t1 - t0) * e);
        const h = Math.floor(t / 60);
        const m = t % 60;
        pH.textContent = String(h);
        pM.textContent = m < 10 ? "0" + m : String(m);
        if (p < 1) rafs.push(requestAnimationFrame(cstep));
      };
      cstep(s);
      // 카드 끄기
      const cards = Array.from(dying.querySelectorAll(".d-card:not(.found)"));
      const found = dying.querySelector(".d-card.found");
      let left = cards.length + 1;
      cards.forEach((c, i) => {
        later(() => {
          setOff(c);
          left--;
          dCount.textContent = String(left);
        }, 1300 + i * 900);
      });
      later(() => {
        found?.classList.add("pop");
        dCount.textContent = "1";
        const label = dying.querySelector("header span:first-child");
        if (label) label.textContent = "찾았다!";
      }, 1300 + cards.length * 900 + 250);
    }
    if (dying) {
      const pio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              runProblem();
              pio.unobserve(e.target);
            }
          });
        },
        { threshold: 0.45 }
      );
      pio.observe(dying);
      observers.push(pio);
    }

    /* ---------- 기능 무대: 지도/경로 in-view 트리거 ---------- */
    const sio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in", "play");
            sio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    $$(".f-stage").forEach((el) => sio.observe(el));
    observers.push(sio);

    /* ---------- 필터 데모: 3.2초마다 칩 자동 토글 (클릭도 가능) ---------- */
    const chipN = $("#chipNight");
    const chip24 = $("#chip24");
    const rows = $$(".stage-filter .mini-row");
    let fmode: "night" | "24" = "night";
    function applyFilter() {
      chipN?.classList.toggle("on", fmode === "night");
      chip24?.classList.toggle("on", fmode === "24");
      rows.forEach((r) => {
        const tag = r.getAttribute("data-tag");
        const show = fmode === "24" ? tag === "night24" : tag !== "day";
        r.classList.toggle("hide", !show);
      });
    }
    chipN?.addEventListener("click", () => {
      fmode = "night";
      applyFilter();
    });
    chip24?.addEventListener("click", () => {
      fmode = "24";
      applyFilter();
    });
    applyFilter();
    if (!reduced)
      intervals.push(
        window.setInterval(() => {
          fmode = fmode === "night" ? "24" : "night";
          applyFilter();
        }, 3200)
      );

    /* ---------- 즐겨찾기 데모 ---------- */
    const heart = $("#favHeart");
    const toast = $("#favToast");
    let toastT = 0;
    heart?.addEventListener("click", () => {
      const on = heart.classList.toggle("on");
      if (toast) {
        toast.textContent = on ? "즐겨찾기에 저장됨" : "즐겨찾기 해제";
        toast.classList.add("show");
      }
      clearTimeout(toastT);
      toastT = window.setTimeout(() => toast?.classList.remove("show"), 1400);
      timeouts.push(toastT);
    });
    // 뷰포트 진입 1초 후 한 번 자동 시연
    if (heart) {
      const fio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              fio.unobserve(e.target);
              if (!reduced) later(() => (heart as HTMLElement).click(), 1000);
            }
          });
        },
        { threshold: 0.6 }
      );
      fio.observe(heart);
      observers.push(fio);
    }

    /* ---------- 폰 데모: 스텝 스크롤 연동 ---------- */
    const phone = $("#phone");
    const steps = $$(".step");
    const demoSec = $(".demo");
    let counted = false;
    function setStep(n: number) {
      if (!phone) return;
      phone.setAttribute("data-step", String(n));
      steps.forEach((s) => s.classList.toggle("on", s.getAttribute("data-go") === String(n)));
      const scanning = n === 1;
      phone.querySelectorAll<HTMLElement>("[data-s1]").forEach((el) => {
        el.style.display = scanning ? "" : "none";
      });
      phone.querySelectorAll<HTMLElement>("[data-alt]").forEach((el) => {
        // CSS 기본값이 display:none이라 ""로는 다시 보이지 않음 → 명시적으로 켬
        el.style.display = scanning ? "none" : "inline-block";
      });
      if (n >= 2 && !counted) {
        counted = true;
        phone.querySelectorAll("[data-count]").forEach(countUp);
      }
    }
    const stio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) setStep(+(e.target.getAttribute("data-go") ?? 1));
        });
      },
      { threshold: 0.55 }
    );
    steps.forEach((s) => stio.observe(s));
    observers.push(stio);
    setStep(1);
    if (demoSec) {
      const dio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => demoSec.classList.toggle("in", e.isIntersecting));
        },
        { threshold: 0.05 }
      );
      dio.observe(demoSec);
      observers.push(dio);
    }

    /* ---------- CTA 링: 보일 때만 재생 ---------- */
    const cta = $(".cta");
    if (cta) {
      const ctaio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => cta.classList.toggle("in", e.isIntersecting));
        },
        { threshold: 0.25 }
      );
      ctaio.observe(cta);
      observers.push(ctaio);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
      timeouts.forEach((t) => clearTimeout(t));
      intervals.forEach((t) => clearInterval(t));
      rafs.forEach((r) => cancelAnimationFrame(r));
    };
  }, []);

  return (
    <div className="lp" ref={rootRef}>
      {/* ================================================================ HERO */}
      <section className="hero" id="hero">
        <div className="hero-map" aria-hidden="true">
          {/* 밤 지도 : 블록 + 도로 */}
          <svg viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
            <rect width="1400" height="900" fill="#0C2A33" />
            <g fill="#0f333e">
              <rect x="60" y="40" width="240" height="170" rx="10" />
              <rect x="340" y="20" width="300" height="130" rx="10" />
              <rect x="690" y="50" width="210" height="180" rx="10" />
              <rect x="950" y="30" width="330" height="150" rx="10" />
              <rect x="40" y="260" width="200" height="230" rx="10" />
              <rect x="290" y="200" width="250" height="180" rx="10" />
              <rect x="590" y="280" width="280" height="160" rx="10" />
              <rect x="920" y="230" width="200" height="240" rx="10" />
              <rect x="1170" y="230" width="190" height="200" rx="10" />
              <rect x="80" y="540" width="270" height="180" rx="10" />
              <rect x="400" y="430" width="220" height="200" rx="10" />
              <rect x="680" y="490" width="300" height="170" rx="10" />
              <rect x="1030" y="520" width="290" height="190" rx="10" />
              <rect x="130" y="770" width="320" height="110" rx="10" />
              <rect x="520" y="700" width="260" height="160" rx="10" />
              <rect x="840" y="710" width="230" height="150" rx="10" />
            </g>
            <g fill="#11413c" opacity=".9">
              <rect x="1150" y="470" width="150" height="120" rx="14" />
              <rect x="300" y="640" width="130" height="100" rx="14" />
            </g>
            <g stroke="#16404d" strokeLinecap="round" fill="none">
              <path d="M0 240 H1400" strokeWidth="12" />
              <path d="M0 500 H1400" strokeWidth="10" />
              <path d="M0 690 H1400" strokeWidth="9" />
              <path d="M270 0 V900" strokeWidth="10" />
              <path d="M560 0 V900" strokeWidth="12" />
              <path d="M910 0 V900" strokeWidth="10" />
              <path d="M1140 0 V900" strokeWidth="8" />
            </g>
            <path
              d="M-40 820 L520 380 Q560 350 620 350 L1440 350"
              stroke="#1b4a59"
              strokeWidth="17"
              fill="none"
              strokeLinecap="round"
            />
            <g stroke="#123742" strokeWidth="4" fill="none" opacity=".8">
              <path d="M140 240 V500" />
              <path d="M420 500 V690" />
              <path d="M1020 240 V500" />
              <path d="M700 500 V690" />
              <path d="M270 380 H560" />
            </g>
          </svg>

          {/* 소나 링 3회 */}
          <div className="sonar" style={{ "--sd": ".15s" } as CSSVars} />
          <div className="sonar" style={{ "--sd": ".5s" } as CSSVars} />
          <div className="sonar" style={{ "--sd": ".85s" } as CSSVars} />
          <div className="me" />

          {/* 핀 드롭 : 소나 뒤 900ms부터 160ms 간격 */}
          <div className="pin g" style={{ left: "58%", top: "26%", "--pd": ".9s" } as CSSVars}>
            <div className="pin-tip">
              <b>290m</b> · 신현대약국 · 운영 중
            </div>
            <div className="pin-head">
              <CrossIcon size={15} />
            </div>
          </div>
          <HeroPin tone="a" left="38%" top="22%" pd="1.06s" tip={<><b>320m</b> · 현대온누리약국 · 곧 마감</>} />
          <HeroPin tone="g" left="70%" top="44%" pd="1.22s" tip={<><b>320m</b> · 홈타운약국 · 운영 중</>} />
          <HeroPin tone="g" left="30%" top="47%" pd="1.38s" tip={<><b>350m</b> · 미래팜연세약국 · 운영 중</>} />
          <HeroPin tone="a" left="80%" top="24%" pd="1.54s" tip={<><b>380m</b> · 홍은약국 · 곧 마감</>} />
          <HeroPin tone="g" left="18%" top="30%" pd="1.7s" tip={<><b>290m</b> · 울산우리안약국 · 운영 중</>} />
          <div className="hero-shade" />
        </div>

        <div className="wrap hero-body">
          <span className="clock-chip">
            <span className="dot" />
            지금 <b className="num" id="liveClock">밤 9:41</b> · 운영 중인 약국만 표시
          </span>
          <h1>
            지금 문 연 약국만,
            <br />
            <em>가까운 순</em>으로.
          </h1>
          <p className="sub">
            밤 11시에도, 연휴 한복판에도. 현재 위치에서 지금 운영 중인 약국을 지도에서 바로 확인하세요.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href="/">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l19-9-9 19-2-8-8-2Z" />
              </svg>
              내 주변 약국 찾기
            </Link>
            <a className="btn btn-ghost" href="#problem">
              왜 필요한가요
            </a>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          SCROLL
        </div>
      </section>

      {/* ================================================================ 문제 제기 */}
      <section className="problem" id="problem">
        <div className="wrap grid">
          <div>
            <span className="eyebrow" data-reveal>
              이런 적, 있으시죠
            </span>
            <h2 data-reveal style={{ "--d": ".08s" } as CSSVars}>
              &lsquo;약국&rsquo;을 검색하면 <span className="num">42곳</span>.
              <br />
              지금 문 연 곳은 어디죠?
            </h2>
            <p data-reveal style={{ "--d": ".16s" } as CSSVars}>
              아이 열이 오르는 밤, 지도 앱은 약국을 수십 곳 보여주지만{" "}
              <b style={{ color: "#fff" }}>이 시간에 문을 연 곳</b>이 어딘지는 알려주지 않아요. 전화를 한 통씩
              돌리는 사이 밤은 깊어가죠.
            </p>
            <div className="big-clock num" data-reveal style={{ "--d": ".24s" } as CSSVars} aria-label="밤 11시 47분">
              <span>
                <span id="pClockH">23</span>
                <span className="colon">:</span>
                <span id="pClockM">47</span>
              </span>
              <small>아이 해열제가 떨어졌다</small>
            </div>
          </div>

          <div
            className="dying-list"
            data-reveal
            style={{ "--d": ".2s" } as CSSVars}
            id="dyingList"
            aria-label="약국에 전화를 돌리는 상황 데모"
          >
            <header>
              <span>전화 돌리는 중&hellip;</span>
              <span>
                <span className="num" id="dyingCount">5</span>곳 남음
              </span>
            </header>
            <div className="d-card">
              <span className="name">늘푸른약국</span>
              <Badge status="closing">확인 중</Badge>
              <span className="hours">신호 감&hellip;</span>
            </div>
            <div className="d-card">
              <span className="name">중앙온누리약국</span>
              <Badge status="closing">확인 중</Badge>
              <span className="hours">신호 감&hellip;</span>
            </div>
            <div className="d-card">
              <span className="name">행복한약국</span>
              <Badge status="closing">확인 중</Badge>
              <span className="hours">신호 감&hellip;</span>
            </div>
            <div className="d-card found">
              <span className="name">홈타운약국</span>
              <Badge status="open">운영 중</Badge>
              <span className="dist num">320m · 밤 12시까지</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ 기능 */}
      <section className="features" id="features">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow" data-reveal>
              핵심 기능
            </span>
            <h2 data-reveal style={{ "--d": ".08s" } as CSSVars}>
              헤매는 시간을 지도가 대신 줄여줍니다
            </h2>
            <p data-reveal style={{ "--d": ".16s" } as CSSVars}>
              복잡한 기능 대신, 급할 때 실제로 쓰게 되는 네 가지에 집중했어요.
            </p>
          </div>

          <div className="f-grid">
            {/* ① 지도 */}
            <article className="f-card" data-reveal>
              <div className="f-stage stage-map" data-stage="map">
                <svg className="bgmap" viewBox="0 0 500 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="500" height="260" fill="#0C2A33" />
                  <g fill="#0f333e">
                    <rect x="30" y="20" width="120" height="80" rx="7" />
                    <rect x="190" y="30" width="130" height="70" rx="7" />
                    <rect x="360" y="20" width="110" height="90" rx="7" />
                    <rect x="40" y="140" width="140" height="90" rx="7" />
                    <rect x="220" y="150" width="110" height="80" rx="7" />
                    <rect x="370" y="150" width="100" height="80" rx="7" />
                  </g>
                  <g stroke="#16404d" fill="none" strokeLinecap="round">
                    <path d="M0 120 H500" strokeWidth="8" />
                    <path d="M170 0 V260" strokeWidth="7" />
                    <path d="M345 0 V260" strokeWidth="6" />
                  </g>
                </svg>
                <MiniPin tone="g" left="34%" top="52%" pd=".15s" />
                <MiniPin tone="a" left="62%" top="38%" pd=".32s" />
                <MiniPin tone="g" left="80%" top="66%" pd=".49s" />
                <span className="mini-tip" style={{ left: "34%", top: "52%" }}>
                  여기가 제일 가까워요 · 290m
                </span>
              </div>
              <div className="f-ico" aria-hidden="true">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>지도에서 운영 상태가 색으로</h3>
              <p>초록은 운영 중, 주황은 곧 마감. 목록을 읽기 전에 지도만 봐도 갈 곳이 보여요. 핀을 누르면 바로 상세로.</p>
            </article>

            {/* ② 필터 */}
            <article className="f-card" data-reveal style={{ "--d": ".08s" } as CSSVars}>
              <div className="f-stage stage-filter light" data-stage="filter">
                <div className="chips">
                  <span className="chip on" id="chipNight">심야 운영</span>
                  <span className="chip" id="chip24">24시간</span>
                </div>
                <div className="mini-row" data-tag="night24">
                  비무브약국24 <Badge status="open">운영 중</Badge>
                  <span className="m-dist num">1.2km</span>
                </div>
                <div className="mini-row" data-tag="night">
                  홈타운약국 <Badge status="open">운영 중</Badge>
                  <span className="m-dist num">320m</span>
                </div>
                <div className="mini-row" data-tag="day">
                  신현대약국 <Badge status="closed">영업종료</Badge>
                  <span className="m-dist num">290m</span>
                </div>
              </div>
              <div className="f-ico" aria-hidden="true">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
                </svg>
              </div>
              <h3>심야 · 24시간 필터</h3>
              <p>밤 10시가 넘었다면 심야 운영 약국만 남기세요. 탭 한 번이면 지금 갈 수 없는 곳이 목록에서 사라져요.</p>
            </article>

            {/* ③ 즐겨찾기 */}
            <article className="f-card" data-reveal style={{ "--d": ".16s" } as CSSVars}>
              <div className="f-stage stage-fav light" data-stage="fav">
                <button className="fav-heart" id="favHeart" aria-label="즐겨찾기 토글 데모">
                  <span className="ring" aria-hidden="true" />
                  <svg width="30" height="30" viewBox="0 0 24 24">
                    <path
                      className="h-fill"
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                </button>
                <span className="fav-toast" id="favToast">즐겨찾기에 저장됨</span>
              </div>
              <div className="f-ico" aria-hidden="true">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3>우리 동네 단골 약국은 하트로</h3>
              <p>자주 가는 약국을 저장해두면 다음 급한 순간엔 검색 없이 바로. 즐겨찾기 탭에서 운영 여부만 확인하면 끝.</p>
            </article>

            {/* ④ 길찾기 */}
            <article className="f-card" data-reveal style={{ "--d": ".24s" } as CSSVars}>
              <div className="f-stage stage-route" data-stage="route">
                <svg className="bgmap" viewBox="0 0 500 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="500" height="260" fill="#0C2A33" />
                  <g fill="#0f333e">
                    <rect x="40" y="30" width="130" height="80" rx="7" />
                    <rect x="210" y="20" width="120" height="90" rx="7" />
                    <rect x="370" y="40" width="100" height="70" rx="7" />
                    <rect x="50" y="150" width="120" height="80" rx="7" />
                    <rect x="230" y="160" width="130" height="70" rx="7" />
                    <rect x="390" y="150" width="90" height="80" rx="7" />
                  </g>
                  <g stroke="#16404d" fill="none" strokeLinecap="round">
                    <path d="M0 130 H500" strokeWidth="8" />
                    <path d="M195 0 V260" strokeWidth="7" />
                    <path d="M365 0 V260" strokeWidth="6" />
                  </g>
                </svg>
                <svg
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  viewBox="0 0 500 260"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                >
                  <path className="route-path route-len" style={{ "--len": 520 } as CSSVars} d="M85 205 H195 V130 H320 V72 H395" />
                </svg>
                <span className="me" style={{ left: "17%", top: "79%", width: 12, height: 12 }} />
                <MiniPin tone="g" left="79%" top="28%" pd=".1s" />
                <span className="walk-label num" style={{ left: "42%", top: "44%" }}>
                  도보 4분 · 290m
                </span>
              </div>
              <div className="f-ico" aria-hidden="true">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l19-9-9 19-2-8-8-2Z" />
                </svg>
              </div>
              <h3>전화 · 길찾기 한 번에</h3>
              <p>카드에서 바로 전화를 걸거나 카카오맵 도보 길안내로 이어져요. 앱을 오가며 주소를 복사할 필요가 없어요.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ================================================================ 데모 */}
      <section className="demo" id="demo">
        <div className="wrap">
          <div className="demo-head">
            <span className="eyebrow" data-reveal>
              실제 화면
            </span>
            <h2 data-reveal style={{ "--d": ".08s" } as CSSVars}>
              열자마자 찾기까지, 딱 세 걸음
            </h2>
            <p data-reveal style={{ "--d": ".16s" } as CSSVars}>
              스크롤을 내리면 실제 앱의 흐름을 그대로 볼 수 있어요.
            </p>
          </div>

          <div className="demo-grid">
            <div className="demo-phone-wrap" data-reveal>
              <div className="phone" id="phone" data-step="1" role="img" aria-label="약국 어디가 앱 화면 데모">
                <div className="screen">
                  <div className="bgmap-wrap" aria-hidden="true">
                    <svg viewBox="0 0 500 700" xmlns="http://www.w3.org/2000/svg">
                      <rect width="500" height="700" fill="#0C2A33" />
                      <g fill="#0f333e">
                        <rect x="30" y="40" width="140" height="100" rx="8" />
                        <rect x="210" y="30" width="120" height="90" rx="8" />
                        <rect x="370" y="50" width="100" height="110" rx="8" />
                        <rect x="40" y="200" width="120" height="110" rx="8" />
                        <rect x="220" y="190" width="130" height="100" rx="8" />
                        <rect x="390" y="210" width="90" height="100" rx="8" />
                        <rect x="30" y="380" width="150" height="100" rx="8" />
                        <rect x="230" y="360" width="110" height="110" rx="8" />
                        <rect x="380" y="370" width="100" height="100" rx="8" />
                        <rect x="50" y="540" width="130" height="110" rx="8" />
                        <rect x="230" y="530" width="140" height="100" rx="8" />
                      </g>
                      <g stroke="#16404d" fill="none" strokeLinecap="round">
                        <path d="M0 170 H500" strokeWidth="9" />
                        <path d="M0 340 H500" strokeWidth="8" />
                        <path d="M0 510 H500" strokeWidth="8" />
                        <path d="M195 0 V700" strokeWidth="9" />
                        <path d="M360 0 V700" strokeWidth="7" />
                      </g>
                    </svg>
                  </div>

                  <div className="p-chip">
                    <span className="spinner" data-s1="" />
                    <span data-s1="">현재 위치 확인 중&hellip;</span>
                    <span className="dot" data-alt="" />
                    <b data-alt="" className="num">지금 운영 중 12곳</b>
                  </div>

                  <span className="p-me" aria-hidden="true" />
                  <span className="p-sonar" aria-hidden="true" />

                  <svg className="p-route" viewBox="0 0 310 640" aria-hidden="true">
                    <path style={{ "--len": 430 } as CSSVars} d="M155 218 V300 H92 V385 H60" />
                  </svg>

                  <div className="p-pins" aria-hidden="true">
                    <PhonePin cls="g hot" left="19%" top="60%" pd=".05s" />
                    <PhonePin cls="a dim" left="72%" top="26%" pd=".2s" />
                    <PhonePin cls="g dim" left="65%" top="55%" pd=".35s" />
                    <PhonePin cls="g dim" left="36%" top="24%" pd=".5s" />
                  </div>

                  <div className="p-sheet">
                    <div className="grab" aria-hidden="true" />
                    <h4>
                      주변 운영 중 약국 <b className="num">12곳</b>
                    </h4>
                    <div className="p-card first">
                      <div className="r1">
                        <span className="nm">홈타운약국</span>
                        <Badge status="open">운영 중</Badge>
                      </div>
                      <div className="r2">
                        <span className="hrs">밤 12시까지</span>
                        <span className="dst num">
                          <span data-count="320">0</span>m<small>도보 5분</small>
                        </span>
                      </div>
                      <div className="p-actions">
                        <button className="call">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                            <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                          </svg>
                          전화
                        </button>
                        <button className="nav">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 11l19-9-9 19-2-8-8-2Z" />
                          </svg>
                          길찾기
                        </button>
                      </div>
                    </div>
                    <div className="p-card second">
                      <div className="r1">
                        <span className="nm">신현대약국</span>
                        <Badge status="closing">곧 마감</Badge>
                      </div>
                      <div className="r2">
                        <span className="hrs">밤 11시 30분까지</span>
                        <span className="dst num">
                          <span data-count="290">0</span>m<small>도보 4분</small>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="demo-steps">
              <div className="step" data-go="1">
                <span className="no num">1</span>
                <h3>위치 허용, 그걸로 끝</h3>
                <p>열자마자 현재 위치를 잡고 주변을 스캔해요. 회원가입도, 설치도 없어요. 위치를 켜기 어려우면 동네 이름으로도 찾을 수 있어요.</p>
              </div>
              <div className="step" data-go="2">
                <span className="no num">2</span>
                <h3>지금 운영 중인 곳만, 가까운 순</h3>
                <p>영업이 끝난 약국은 뒤로 보내고, 지금 갈 수 있는 곳부터 거리순으로 정렬해요. 곧 마감인 곳은 미리 알려드려요.</p>
              </div>
              <div className="step" data-go="3">
                <span className="no num">3</span>
                <h3>누르면 바로 전화 · 길찾기</h3>
                <p>가까운 약국을 고르면 경로가 그려지고, 전화와 카카오맵 도보 안내가 버튼 하나로 이어져요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ 신뢰 */}
      <section className="trust" id="trust">
        <div className="wrap inner">
          <div>
            <span className="eyebrow" data-reveal>
              믿을 수 있는 데이터
            </span>
            <h2 data-reveal style={{ "--d": ".08s" } as CSSVars}>
              공공데이터를 기반으로,
              <br />
              매일 새로 확인합니다
            </h2>
            <p className="lead" data-reveal style={{ "--d": ".16s" } as CSSVars}>
              전국 약국의 운영시간 정보는 공공데이터포털의 약국 정보 API를 기반으로 하며, 매일 자동으로 갱신돼요.
              광고나 제휴 순위 없이 오직 거리와 운영 여부로만 정렬합니다.
            </p>
            <div className="t-note" data-reveal style={{ "--d": ".24s" } as CSSVars}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              <span>
                실제 운영시간은 사정에 따라 다를 수 있어요. 늦은 시간엔 방문 전 전화 확인을 권장하며, 약 복용 상담은
                반드시 약사와 하세요.
              </span>
            </div>
          </div>
          <div className="t-stats" data-reveal style={{ "--d": ".2s" } as CSSVars}>
            <div className="t-stat">
              <div className="v num">
                <span data-count="24000">0</span>
                <small>+</small>
              </div>
              <div className="k">전국 약국 정보</div>
            </div>
            <div className="t-stat">
              <div className="v num">
                <span data-count="365">0</span>
                <small>일</small>
              </div>
              <div className="k">매일 자동 갱신</div>
            </div>
            <div className="t-stat">
              <div className="v num">
                <span data-count="0">0</span>
                <small>원</small>
              </div>
              <div className="k">가입 없이 무료</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ CTA */}
      <section className="cta" id="cta">
        <span className="ring" aria-hidden="true" />
        <span className="ring" aria-hidden="true" />
        <span className="ring" aria-hidden="true" />
        <div className="wrap">
          <h2 data-reveal>
            다음 급한 밤엔,
            <br />
            헤매지 않도록.
          </h2>
          <p className="sub" data-reveal style={{ "--d": ".1s" } as CSSVars}>
            설치 없이 웹에서 바로 열려요. 지금 한 번 써보고, 즐겨찾기만 눌러두세요.
          </p>
          <div data-reveal style={{ "--d": ".2s" } as CSSVars}>
            <Link className="btn btn-primary" href="/">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              지금 문 연 약국 보기
            </Link>
            <div className="tiny">무료 · 회원가입 없음</div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="row">
            <span className="brand">
              <span className="logo-mark" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              약국 어디가
            </span>
            <span>© 2026 약국 어디가</span>
          </div>
          <p>
            본 서비스는 공공데이터포털 약국 정보를 기반으로 하며, 의료 행위 또는 약사 상담을 대체하지 않습니다.
            표시된 운영시간은 실제와 다를 수 있으니 방문 전 전화로 확인해 주세요.
          </p>
        </div>
      </footer>
    </div>
  );
}
