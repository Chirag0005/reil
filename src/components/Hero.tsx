"use client";

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { BRAND_DATA, GALLERY_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { ArrowUpRight, MapPin, Pause, Play } from "lucide-react";
import { gsap, EASE, MEDIA, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

declare global {
  interface Window {
    __heroMotion?: boolean;
  }
}

// Autoplay interval per look (2.5s). The wipe transition (~1.15s) finishes well inside it.
const SLIDE_SECONDS = 2.5;

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(MEDIA.reduced);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// Signature looks shown in the hero, taken from the real portfolio.
const SLIDES = BRAND_DATA.hero.showcase
  .map((id) => GALLERY_DATA.find((item) => item.id === id))
  .filter((item): item is (typeof GALLERY_DATA)[number] => !!item);

export default function Hero() {
  const { openBooking } = useBooking();
  const hero = BRAND_DATA.hero;
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const captionRef = useRef<HTMLDivElement>(null);
  const timer = useRef<gsap.core.Tween | null>(null);
  const firstCycle = useRef(true);

  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  // null = no explicit choice yet: reduced-motion visitors start paused, everyone else autoplays.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [hoverPaused, setHoverPaused] = useState(false);

  const total = SLIDES.length;
  const nextIndex = (active + 1) % total;
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const stopped = userPaused ?? reduced;
  const paused = stopped || hoverPaused;

  const goTo = useCallback(
    (index: number) => {
      if (index === active) return;
      setPrev(active);
      setActive(index);
    },
    [active]
  );

  // Entrance: header settles → photograph unveils → headline lines rise → copy → CTA → labels.
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    const mm = gsap.matchMedia(root);

    mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;

      const q = gsap.utils.selector(root);
      const header = document.querySelector("[data-header-inner]");
      const tl = gsap.timeline({ defaults: { ease: EASE.reveal } });

      if (header) {
        tl.fromTo(header, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.8, clearProps: "transform" }, 0);
      }
      tl.fromTo(
        q("[data-hero-image]"),
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: desktop ? 1.35 : 1.05, ease: EASE.inOut },
        0.1
      )
        .fromTo(
          q("[data-hero-pointer]"),
          { scale: 1.2 },
          { scale: 1, duration: desktop ? 1.9 : 1.4, clearProps: "scale" },
          0.1
        )
        .fromTo(
          q("[data-hero-line]"),
          { yPercent: 112, autoAlpha: 1 },
          { yPercent: 0, duration: 1.1, stagger: 0.12 },
          desktop ? 0.5 : 0.35
        )
        .fromTo(q("[data-hero-copy]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.75")
        .fromTo(
          q("[data-hero-cta]"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.08, clearProps: "transform" },
          "-=0.7"
        )
        .fromTo(
          q("[data-hero-label]"),
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 },
          "-=0.6"
        );

      if (desktop) {
        tl.fromTo(
          q("[data-hero-detail]"),
          { clipPath: "inset(0% 100% 0% 0%)", autoAlpha: 1 },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: EASE.inOut },
          0.95
        );

        // Layered depth as the visitor leaves the hero: main frame drifts, preview card floats.
        gsap.to(q("[data-hero-drift]"), {
          yPercent: 7,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
        });
        gsap.to(q("[data-hero-detail]"), {
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
        });
      } else {
        tl.fromTo(q("[data-hero-detail]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.9);
      }

      // GSAP now owns every from-state inline, so the pre-paint CSS guard can go.
      window.__heroMotion = true;
      html.classList.remove("js-motion");
    });

    // Reduced motion (or the boot script skipped): make sure nothing is held back.
    if (!window.matchMedia(MEDIA.motion).matches) html.classList.remove("js-motion");

    return () => mm.revert();
  }, []);

  // Pointer depth (desktop, fine pointer, full motion): photograph leans toward the cursor,
  // preview card drifts the other way.
  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    const layer = pointerRef.current;
    if (!stage || !layer) return;
    const mm = gsap.matchMedia();
    mm.add(`${MEDIA.motion} and ${MEDIA.desktop} and (hover: hover)`, () => {
      const lx = gsap.quickTo(layer, "x", { duration: 0.9, ease: EASE.soft });
      const ly = gsap.quickTo(layer, "y", { duration: 0.9, ease: EASE.soft });
      const card = cardRef.current;
      const cx = card ? gsap.quickTo(card, "xPercent", { duration: 1.1, ease: EASE.soft }) : null;
      const cy = card ? gsap.quickTo(card, "yPercent", { duration: 1.1, ease: EASE.soft }) : null;

      const onMove = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        lx(nx * 18);
        ly(ny * 14);
        cx?.(nx * -6);
        cy?.(ny * -5);
      };
      const onLeave = () => {
        lx(0);
        ly(0);
        cx?.(0);
        cy?.(0);
      };
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
      return () => {
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => mm.revert();
  }, []);

  // Slide change: the incoming look wipes across from the right and settles from a gentle zoom.
  const mounted = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (prefersReducedMotion()) return;
    const incoming = slideRefs.current[active];
    const outgoing = prev !== null ? slideRefs.current[prev] : null;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        incoming,
        { clipPath: "inset(0% 0% 0% 100%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: EASE.inOut, clearProps: "clipPath" }
      );
      gsap.fromTo(
        incoming?.querySelector("img") ?? [],
        { scale: 1.16 },
        { scale: 1, duration: 1.6, ease: EASE.reveal, clearProps: "transform" }
      );
      if (outgoing) {
        gsap.fromTo(
          outgoing.querySelector("img"),
          { scale: 1 },
          { scale: 1.06, duration: 1.15, ease: EASE.inOut, clearProps: "transform" }
        );
      }
      gsap.fromTo(
        captionRef.current?.children ?? [],
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, delay: 0.35, ease: EASE.reveal }
      );
    });
    return () => ctx.revert();
  }, [active, prev]);

  // Autoplay timer doubles as the progress line under the active tab.
  useEffect(() => {
    const bar = barRefs.current[active];
    barRefs.current.forEach((b, i) => {
      if (b && i !== active) gsap.set(b, { scaleX: i < active ? 1 : 0 });
    });
    if (!bar) return;
    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: SLIDE_SECONDS,
        ease: "none",
        delay: firstCycle.current ? 1.8 : 0,
        onComplete: () => {
          setPrev(active);
          setActive((active + 1) % total);
        },
      }
    );
    firstCycle.current = false;
    timer.current = tween;
    return () => {
      tween.kill();
    };
  }, [active, total]);

  useEffect(() => {
    timer.current?.paused(paused);
  }, [paused, active]);

  const current = SLIDES[active];

  return (
    <section
      ref={root}
      id="hero"
      className="relative min-h-[95vh] sm:min-h-screen flex items-center justify-center bg-[#F7F2EA] pt-28 pb-16 sm:py-28 overflow-hidden paper-texture"
    >
      <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Asymmetrical Editorial Typography */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center order-2 lg:order-1 pt-2 lg:pt-0">
            {/* Understated Location Indicator */}
            <div
              data-hero-hide
              data-hero-label
              className="inline-flex items-center space-x-2 px-3 py-1 bg-[#EAE0D3]/70 border border-[#EAE0D3] mb-6 sm:mb-8 self-start"
            >
              <MapPin className="w-3.5 h-3.5 text-[#A98563] shrink-0" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#817064] font-medium">
                {BRAND_DATA.locationLabel}
              </span>
            </div>

            {/* Editorial Headline — each line rises out of its own mask */}
            <h1
              aria-label={`${hero.headlineTop} ${hero.headlineAccent}`}
              className="font-serif text-4xl sm:text-6xl lg:text-[4.75rem] font-light leading-[1.05] text-[#30231F] tracking-tight mb-6"
            >
              <span aria-hidden="true" className="block overflow-hidden pb-[0.06em]">
                <span data-hero-hide data-hero-line className="block">
                  {hero.headlineTop}
                </span>
              </span>
              <span aria-hidden="true" className="block overflow-hidden pb-[0.08em] -mt-[0.08em]">
                <span data-hero-hide data-hero-line className="block italic font-normal text-[#A98563]">
                  {hero.headlineAccent}
                </span>
              </span>
            </h1>

            {/* Supporting Copy */}
            <p
              data-hero-hide
              data-hero-copy
              className="text-base sm:text-lg text-[#30231F]/80 font-light leading-relaxed max-w-lg mb-8 sm:mb-10"
            >
              {hero.supportingCopy}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3.5 sm:space-y-0 sm:space-x-4 mb-10">
              <button
                data-hero-hide
                data-hero-cta
                onClick={() => openBooking()}
                className="btn-tactile inline-flex items-center justify-center px-8 py-4 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-[#F7F2EA] bg-[#30231F] hover:bg-[#2B201C] border border-[#30231F] shadow-sm group"
              >
                <span>{hero.primaryCta}</span>
                <ArrowUpRight className="arrow-nudge w-4 h-4 ml-2 text-[#EAE0D3]" />
              </button>

              <a
                data-hero-hide
                data-hero-cta
                href="#gallery"
                className="group inline-flex items-center justify-center px-7 py-4 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-[#30231F] hover:text-[#2B201C] bg-transparent hover:bg-[#EAE0D3]/50 border border-[#817064]/50 hover:border-[#30231F]/70 transition-[background-color,border-color,color] duration-300"
              >
                <span>{hero.secondaryCta}</span>
                <span
                  aria-hidden="true"
                  className="ml-0 w-0 overflow-hidden opacity-0 group-hover:ml-2 group-hover:w-4 group-hover:opacity-100 transition-all duration-300 text-[#A98563]"
                >
                  ↓
                </span>
              </a>
            </div>

            {/* Small Verified Credential Pills */}
            <div
              data-hero-hide
              data-hero-label
              className="pt-6 border-t border-[#EAE0D3] flex flex-wrap items-center gap-6 text-xs text-[#817064]"
            >
              <span>Lived-In Blondes</span>
              <span className="text-[#A98563]">·</span>
              <span>Dimensional Colour</span>
              <span className="text-[#A98563]">·</span>
              <span>{BRAND_DATA.name}</span>
            </div>
          </div>

          {/* Right Column: Interactive Signature-Look Showcase */}
          <div
            className="lg:col-span-6 xl:col-span-7 order-1 lg:order-2"
            role="region"
            aria-roledescription="carousel"
            aria-label="Signature looks"
            onMouseEnter={() => setHoverPaused(true)}
            onMouseLeave={() => setHoverPaused(false)}
            onFocus={() => setHoverPaused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoverPaused(false);
            }}
          >
            <div ref={stageRef} className="relative">
              {/* Main photograph frame */}
              <div
                data-hero-clip
                data-hero-image
                className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] overflow-hidden bg-[#EAE0D3] border border-[#EAE0D3] shadow-xl"
              >
                <div data-hero-drift className="absolute inset-x-0 -top-[6%] -bottom-[6%]">
                  <div ref={pointerRef} data-hero-pointer className="absolute -inset-[3%]">
                    {SLIDES.map((slide, i) => (
                      <div
                        key={slide.id}
                        ref={(el) => {
                          slideRefs.current[i] = el;
                        }}
                        aria-hidden={i !== active}
                        className="absolute inset-0 overflow-hidden"
                        style={{ zIndex: i === active ? 2 : i === prev ? 1 : 0 }}
                      >
                        <Image
                          src={slide.image}
                          alt={i === active ? slide.title : ""}
                          fill
                          preload={i === 0}
                          sizes="(max-width: 1024px) 100vw, 55vw"
                          className="object-cover object-[center_28%]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[#2B201C]/65 via-[#2B201C]/5 to-transparent pointer-events-none" />

                {/* Counter */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-[4] px-2.5 py-1 bg-[#F7F2EA]/90 backdrop-blur-md border border-[#EAE0D3] text-[10px] tracking-[0.25em] text-[#30231F] font-medium">
                  {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </div>

                {/* Caption for the current look */}
                <div
                  ref={captionRef}
                  aria-live={paused ? "polite" : "off"}
                  className="absolute z-[4] left-5 right-5 bottom-5 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[62%] text-[#F7F2EA] sm:text-right"
                >
                  <span className="block text-[10px] uppercase tracking-[0.28em] text-[#EAE0D3]/85 mb-1.5">
                    Look {current.lookNumber} · {current.category}
                  </span>
                  <span className="block font-serif text-xl sm:text-2xl font-light leading-snug mb-2.5">
                    {current.title}
                  </span>
                  <a
                    href="#gallery"
                    className="group inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#F7F2EA]"
                  >
                    <span className="link-line pb-0.5">View in gallery</span>
                    <ArrowUpRight className="arrow-nudge w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Next-look preview card: a peek at what's coming, click to advance */}
              <button
                ref={cardRef}
                type="button"
                data-hero-hide
                data-hero-detail
                onClick={() => goTo(nextIndex)}
                aria-label={`Show next look: ${SLIDES[nextIndex].title}`}
                className="group hidden sm:block absolute z-10 -bottom-8 -left-8 w-44 h-52 overflow-hidden bg-[#30231F] border-4 border-[#F7F2EA] shadow-2xl"
              >
                {SLIDES.map((slide, i) => (
                  <Image
                    key={slide.id}
                    src={slide.image}
                    alt=""
                    fill
                    sizes="200px"
                    className={`object-cover object-[center_28%] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${
                      i === nextIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <span className="absolute bottom-2 left-2 right-2 p-2 flex items-center justify-between bg-[#F7F2EA]/95 backdrop-blur-sm text-[9px] uppercase tracking-wider text-[#30231F] font-medium">
                  <span>Next look</span>
                  <ArrowUpRight className="arrow-nudge w-3 h-3 text-[#A98563]" />
                </span>
              </button>
            </div>

            {/* Look tabs with autoplay progress */}
            <div
              data-hero-hide
              data-hero-label
              className="mt-5 sm:mt-6 sm:pl-[10.5rem] flex items-stretch gap-3 sm:gap-4"
            >
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show look ${slide.lookNumber}: ${slide.title}`}
                  aria-current={i === active ? "true" : undefined}
                  className="group/tab flex-1 min-w-0 text-left pt-3 pb-1"
                >
                  <span className="relative block h-px bg-[#30231F]/15 overflow-hidden mb-2.5">
                    <span
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      className="absolute inset-0 bg-[#A98563] origin-left scale-x-0"
                    />
                  </span>
                  <span
                    className={`block text-[10px] uppercase tracking-[0.22em] truncate transition-colors duration-300 ${
                      i === active ? "text-[#30231F]" : "text-[#817064] group-hover/tab:text-[#30231F]"
                    }`}
                  >
                    <span className="font-serif italic normal-case tracking-normal text-[#A98563] mr-1.5 text-xs">
                      {slide.lookNumber}
                    </span>
                    {slide.category}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUserPaused(!stopped)}
                aria-label={stopped ? "Play showcase" : "Pause showcase"}
                aria-pressed={stopped}
                className="shrink-0 self-end w-9 h-9 flex items-center justify-center rounded-full border border-[#30231F]/20 text-[#30231F] hover:bg-[#30231F] hover:text-[#F7F2EA] transition-colors duration-300"
              >
                {stopped ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
