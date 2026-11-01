"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { GALLERY_DATA } from "@/data/salon";
import { GalleryCategory, GalleryItem } from "@/types/salon";
import { useBooking } from "@/context/BookingContext";
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import {
  gsap,
  Flip,
  ScrollTrigger,
  EASE,
  lockScroll,
  unlockScroll,
  trapFocus,
  prefersReducedMotion,
  useIsomorphicLayoutEffect,
} from "@/lib/motion";

/*
 * Editorial rhythm, assigned by position among the *visible* looks so every filter still
 * reads as an art-directed spread: a landscape lead, an offset portrait, a trio, then a
 * mirrored pair. Offsets only apply on large screens.
 */
const RHYTHM = [
  { span: "md:col-span-2 lg:col-span-7", aspect: "aspect-[4/5] md:aspect-[16/10] lg:aspect-[4/3]", offset: "" },
  { span: "lg:col-span-5", aspect: "aspect-[4/5]", offset: "lg:mt-24" },
  { span: "lg:col-span-4", aspect: "aspect-[4/5] lg:aspect-[3/4]", offset: "" },
  { span: "lg:col-span-4", aspect: "aspect-[4/5] lg:aspect-[3/4]", offset: "lg:mt-14" },
  { span: "lg:col-span-4", aspect: "aspect-[4/5] lg:aspect-[3/4]", offset: "" },
  { span: "lg:col-span-5", aspect: "aspect-[4/5]", offset: "" },
  { span: "md:col-span-2 lg:col-span-7", aspect: "aspect-[4/5] md:aspect-[16/10] lg:aspect-[4/3]", offset: "lg:mt-16" },
];

const ALL: GalleryCategory = "All Looks";

export default function PortfolioGallery() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>(ALL);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { openBooking } = useBooking();

  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  // Only offer categories that actually have looks.
  const categories = useMemo(() => {
    const order: GalleryCategory[] = [ALL, "Haircuts", "Blonde", "Brunette", "Copper", "Styling", "Transformations"];
    return order
      .map((cat) => ({
        cat,
        count: cat === ALL ? GALLERY_DATA.length : GALLERY_DATA.filter((i) => i.category === cat).length,
      }))
      .filter(({ count }) => count > 0);
  }, []);

  const filteredItems: GalleryItem[] = useMemo(
    () => (activeCategory === ALL ? GALLERY_DATA : GALLERY_DATA.filter((item) => item.category === activeCategory)),
    [activeCategory]
  );

  const selectCategory = (cat: GalleryCategory) => {
    if (cat === activeCategory) return;
    if (gridRef.current && !prefersReducedMotion()) {
      flipState.current = Flip.getState(gridRef.current.querySelectorAll("[data-look]"));
    }
    setActiveCategory(cat);
  };

  // Layout transition between filters: survivors glide to their new slots,
  // newcomers rise in, departing looks fade out — no remounting of the grid.
  useIsomorphicLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !gridRef.current) return;
    flipState.current = null;
    const tween = Flip.from(state, {
      targets: gridRef.current.querySelectorAll("[data-look]"),
      duration: 0.8,
      ease: EASE.inOut,
      absolute: true,
      stagger: 0.02,
      // Flip owns x/y here, so entrances use only opacity + scale.
      onEnter: (els) =>
        gsap.fromTo(els, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: EASE.reveal, stagger: 0.04, delay: 0.12 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.97, duration: 0.35, ease: "power2.in" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
    return () => {
      tween.progress(1);
      tween.kill();
    };
  }, [activeCategory]);

  /* ---------- Lightbox ---------- */
  const currentItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  const showNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % filteredItems.length));
  }, [filteredItems.length]);

  const showPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? prev : (prev - 1 + filteredItems.length) % filteredItems.length));
  }, [filteredItems.length]);

  return (
    <section id="gallery" className="py-24 sm:py-32 bg-[#EAE0D3]/30 border-t border-[#EAE0D3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 pb-6 border-b border-[#EAE0D3] gap-6 lg:gap-12">
          <div>
            <span data-reveal className="text-[11px] uppercase tracking-[0.25em] font-medium text-[#A98563] block mb-2">
              HAIR INSPIRATION
            </span>
            <h2 data-reveal-lines className="font-serif text-3xl sm:text-5xl font-light text-[#30231F] leading-tight lg:whitespace-nowrap">
              Looks We Love
            </h2>
          </div>

          {/* Working Category Filters */}
          <div data-reveal data-reveal-delay="0.15" role="group" aria-label="Filter looks by category" className="flex flex-wrap items-center gap-2 lg:justify-end lg:max-w-[620px]">
            {categories.map(({ cat, count }) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCategory(cat)}
                  className={`group/filter relative px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-[background-color,color,border-color] duration-300 ${
                    isActive
                      ? "bg-[#30231F] border-[#30231F] text-[#F7F2EA] font-medium shadow-sm"
                      : "bg-[#F7F2EA] text-[#30231F]/80 hover:text-[#30231F] border-[#EAE0D3] hover:border-[#30231F]/60"
                  }`}
                >
                  {cat}
                  <sup
                    className={`ml-1 text-[9px] tracking-normal transition-colors duration-300 ${
                      isActive ? "text-[#EAE0D3]/80" : "text-[#A98563]"
                    }`}
                  >
                    {count}
                  </sup>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Showing {filteredItems.length} {filteredItems.length === 1 ? "look" : "looks"}
          {activeCategory === ALL ? "" : ` in ${activeCategory}`}
        </p>

        {/* Asymmetrical Editorial Portfolio Grid — every look stays mounted; filters toggle visibility */}
        <div ref={gridRef} data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-6 sm:gap-x-8 gap-y-10 sm:gap-y-12 items-start">
          {GALLERY_DATA.map((item) => {
            const visibleIndex = filteredItems.indexOf(item);
            const isVisible = visibleIndex !== -1;
            const rhythm = RHYTHM[(isVisible ? visibleIndex : 0) % RHYTHM.length];

            return (
              <figure
                key={item.id}
                data-look
                data-flip-id={item.id}
                data-reveal-item
                hidden={!isVisible}
                className={`${rhythm.span} ${rhythm.offset} group relative m-0`}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(visibleIndex)}
                  aria-label={`View look ${item.lookNumber}: ${item.title}`}
                  className="block w-full text-left"
                >
                  {/* Hairstyle Focus Image */}
                  <span className={`relative block w-full ${rhythm.aspect} overflow-hidden bg-[#EAE0D3]`}>
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 45vw"
                      className="object-cover object-[center_28%] img-zoom"
                    />

                    {/* Subtle top category indicator */}
                    <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-[#F7F2EA]/90 backdrop-blur-md text-[9px] uppercase tracking-[0.2em] text-[#817064] font-medium border border-[#EAE0D3]">
                      {item.category}
                    </span>

                    {/* Editorial hover veil: tonal profile rises in, arrow drifts */}
                    <span className="absolute inset-0 flex items-end p-5 sm:p-6 bg-gradient-to-t from-[#2B201C]/75 via-[#2B201C]/15 to-transparent opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:group-hover:opacity-100 group-focus-within:opacity-100">
                      <span className="w-full flex items-end justify-between gap-4 text-[#F7F2EA] translate-y-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:group-hover:translate-y-0 group-focus-within:translate-y-0">
                        <span>
                          <span className="block text-[10px] uppercase tracking-[0.25em] text-[#EAE0D3]/80 mb-1">
                            Look {item.lookNumber} · {item.category}
                          </span>
                          <span className="block font-serif text-lg sm:text-xl font-light leading-snug">
                            {item.tonalProfile}
                          </span>
                        </span>
                        <span className="shrink-0 w-10 h-10 rounded-full border border-[#F7F2EA]/50 flex items-center justify-center">
                          <ArrowUpRight className="arrow-nudge w-4 h-4" />
                        </span>
                      </span>
                    </span>
                  </span>

                  {/* Understated Minimalist Caption */}
                  <span className="mt-4 flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block font-serif text-lg sm:text-xl text-[#30231F] font-light leading-snug group-hover:text-[#A98563] transition-colors duration-300">
                        {item.title}
                      </span>
                      <span className="block text-[11px] text-[#817064] tracking-wide font-light mt-1">
                        {item.technique}
                      </span>
                    </span>
                    <span className="shrink-0 flex items-center gap-2 pt-1 font-serif italic text-sm text-[#A98563]">
                      <span aria-hidden="true" className="h-px w-5 bg-[#A98563]/60 origin-right transition-transform duration-500 group-hover:scale-x-150" />
                      {item.lookNumber}
                    </span>
                  </span>
                </button>
              </figure>
            );
          })}
        </div>
      </div>

      {lightboxIndex !== null && currentItem && (
        <Lightbox
          item={currentItem}
          index={lightboxIndex}
          total={filteredItems.length}
          onClose={() => setLightboxIndex(null)}
          onNext={showNext}
          onPrev={showPrev}
          onRequest={() => {
            setLightboxIndex(null);
            openBooking(currentItem.title);
          }}
        />
      )}
    </section>
  );
}

/* ---------- Lightbox ---------- */

interface LightboxProps {
  item: GalleryItem;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRequest: () => void;
}

function Lightbox({ item, index, total, onClose, onNext, onPrev, onRequest }: LightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Animated exit, then unmount.
  const requestClose = useCallback(
    (after?: () => void) => {
      if (closing.current) return;
      closing.current = true;
      const done = after ?? onClose;
      if (prefersReducedMotion() || !rootRef.current) return done();
      gsap
        .timeline({ onComplete: done })
        .to(panelRef.current, { autoAlpha: 0, y: 16, scale: 0.985, duration: 0.35, ease: "power2.in" }, 0)
        .to(rootRef.current, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.05);
    },
    [onClose]
  );

  // Entrance: veil fades, panel rises, photograph unveils from below.
  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: EASE.reveal } })
        // Opacity only (not autoAlpha): visibility:hidden would block focusing the close button.
        .from(rootRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" })
        .from(panelRef.current, { y: 30, opacity: 0, duration: 0.8 }, 0.05)
        .fromTo(
          imageRef.current,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: EASE.inOut },
          0.1
        );
    });
    return () => ctx.revert();
  }, []);

  // Crossfade on previous / next.
  const firstRender = useRef(true);
  useIsomorphicLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current, { autoAlpha: 0.2, scale: 1.03 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: EASE.reveal });
      gsap.fromTo("[data-lightbox-copy]", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05, ease: EASE.reveal });
    }, panelRef);
    return () => ctx.revert();
  }, [item.id]);

  // Scroll lock, keyboard, focus management.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
      else trapFocus(e, rootRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [requestClose, onNext, onPrev]);

  const multiple = total > 1;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-50 bg-[#2B201C]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-8"
      onClick={() => requestClose()}
    >
      {/* Close button */}
      <button
        ref={closeRef}
        type="button"
        onClick={() => requestClose()}
        className="absolute top-3 right-3 sm:top-6 sm:right-6 w-11 h-11 flex items-center justify-center rounded-full border border-[#F7F2EA]/30 text-[#F7F2EA] hover:bg-[#F7F2EA] hover:text-[#30231F] transition-colors duration-300 z-20"
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      {multiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="group hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full border border-[#F7F2EA]/30 text-[#F7F2EA] hover:bg-[#F7F2EA] hover:text-[#30231F] transition-colors duration-300 z-20"
            aria-label="Previous look"
          >
            <ChevronLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="group hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full border border-[#F7F2EA]/30 text-[#F7F2EA] hover:bg-[#F7F2EA] hover:text-[#30231F] transition-colors duration-300 z-20"
            aria-label="Next look"
          >
            <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {/* Modal Container */}
      <div
        ref={panelRef}
        className="relative max-w-5xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] bg-[#F7F2EA] border border-[#EAE0D3] shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || !multiple) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            if (dx < 0) onNext();
            else onPrev();
          }
        }}
      >
        <div ref={imageRef} className="relative shrink-0 md:w-3/5 h-[52vh] md:h-[80vh] bg-[#EAE0D3] overflow-hidden">
          <Image
            key={item.id}
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover object-[center_28%]"
            preload
          />
        </div>

        <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-[#F7F2EA] border-t md:border-t-0 md:border-l border-[#EAE0D3] md:overflow-y-auto">
          <div>
            <span data-lightbox-copy className="inline-block px-2.5 py-1 bg-[#EAE0D3] text-[10px] uppercase tracking-[0.2em] text-[#30231F] font-semibold mb-4">
              {item.category} · LOOK #{item.lookNumber}
            </span>

            <h3 id="lightbox-title" data-lightbox-copy className="font-serif text-2xl sm:text-3xl text-[#30231F] font-light mb-3">
              {item.title}
            </h3>

            <p data-lightbox-copy className="text-xs sm:text-sm text-[#30231F]/80 font-light leading-relaxed mb-6">
              {item.caption}
            </p>

            <div data-lightbox-copy className="p-3.5 bg-[#EAE0D3]/40 border-l-2 border-[#A98563] text-xs text-[#817064] space-y-1">
              <p>
                <strong className="text-[#30231F] font-medium">Technique: </strong>
                {item.technique}
              </p>
              <p>
                <strong className="text-[#30231F] font-medium">Tonal Family: </strong>
                {item.tonalProfile}
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#EAE0D3] space-y-4">
            <button
              type="button"
              onClick={() => requestClose(onRequest)}
              className="btn-tactile group w-full py-3.5 bg-[#30231F] hover:bg-[#2B201C] text-[#F7F2EA] text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center space-x-2 shadow"
            >
              <span>REQUEST THIS LOOK</span>
              <ArrowUpRight className="arrow-nudge w-4 h-4 text-[#EAE0D3]" />
            </button>

            <div className="flex items-center justify-between">
              {multiple ? (
                <button
                  type="button"
                  onClick={onPrev}
                  className="md:hidden w-11 h-11 flex items-center justify-center border border-[#EAE0D3] text-[#30231F]"
                  aria-label="Previous look"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <span />
              )}
              <p className="text-[11px] text-center text-[#817064] tracking-[0.15em] uppercase flex-1" aria-live="polite">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </p>
              {multiple ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="md:hidden w-11 h-11 flex items-center justify-center border border-[#EAE0D3] text-[#30231F]"
                  aria-label="Next look"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
