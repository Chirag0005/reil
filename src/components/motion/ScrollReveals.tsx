"use client";

import { gsap, ScrollTrigger, SplitText, EASE, MEDIA, useIsomorphicLayoutEffect } from "@/lib/motion";

/*
 * Declarative scroll motion for the whole page. Components opt in with data attributes:
 *
 *   data-reveal            fade + gentle rise            (data-reveal="fade" for opacity only)
 *   data-reveal-delay      seconds to wait after the trigger
 *   data-reveal-lines      masked line-by-line heading reveal (SplitText)
 *   data-reveal-group      parent whose [data-reveal-item] children stagger in
 *   data-reveal-image      "up" | "side" | "center" clip-path unveil + inner scale settle
 *   data-parallax          slow vertical drift on an oversized image wrapper (desktop only)
 *   data-draw              hairline rule that draws in from the left
 *
 * Nothing is hidden by CSS: every from-state is applied by GSAP, so if this never runs the
 * content is simply visible. Reveals play once so elements can never get stuck hidden
 * when scrolling back up. Reduced-motion visitors get no scroll motion at all.
 */
export default function ScrollReveals() {
  useIsomorphicLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const splits: SplitText[] = [];

    mm.add(
      { motion: MEDIA.motion, desktop: MEDIA.desktop },
      (context) => {
        const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        if (!motion) return;

        const distance = desktop ? 36 : 22;
        const start = desktop ? "top 86%" : "top 92%";

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          // Panels driven by the pinned editorial timeline are animated there instead.
          if (el.closest(".is-pinned [data-pin-managed]")) return;
          const fadeOnly = el.dataset.reveal === "fade";
          gsap.from(el, {
            autoAlpha: 0,
            y: fadeOnly ? 0 : distance,
            duration: 1,
            delay: parseFloat(el.dataset.revealDelay || "0"),
            ease: EASE.reveal,
            scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-lines]").forEach((el) => {
          let played = false;
          const split = SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "reveal-line",
            autoSplit: true,
            onSplit(self) {
              if (played) return;
              return gsap.from(self.lines, {
                yPercent: 110,
                duration: 1.05,
                stagger: 0.1,
                delay: parseFloat(el.dataset.revealDelay || "0.05"),
                ease: EASE.reveal,
                scrollTrigger: {
                  trigger: el,
                  start,
                  toggleActions: "play none none none",
                  onEnter: () => {
                    played = true;
                  },
                },
              });
            },
          });
          splits.push(split);
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
          const items = group.querySelectorAll<HTMLElement>("[data-reveal-item]");
          if (!items.length) return;
          gsap.from(items, {
            autoAlpha: 0,
            y: distance,
            duration: 0.95,
            stagger: { each: desktop ? 0.09 : 0.06, from: "start" },
            ease: EASE.reveal,
            scrollTrigger: { trigger: group, start, toggleActions: "play none none none" },
          });
        });

        const clipFrom: Record<string, string> = {
          up: "inset(100% 0% 0% 0%)",
          side: "inset(0% 100% 0% 0%)",
          center: "inset(14% 14% 14% 14%)",
        };

        gsap.utils.toArray<HTMLElement>("[data-reveal-image]").forEach((el) => {
          const variant = el.dataset.revealImage || "up";
          const img = el.querySelector("img");
          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: desktop ? "top 82%" : "top 90%", toggleActions: "play none none none" },
          });
          tl.fromTo(
            el,
            { clipPath: clipFrom[variant] ?? clipFrom.up },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: EASE.inOut, clearProps: "clipPath" }
          );
          if (img) {
            tl.fromTo(
              img,
              { scale: variant === "center" ? 1.12 : 1.22 },
              { scale: 1, duration: 1.7, ease: EASE.reveal, clearProps: "transform" },
              0
            );
          }
        });

        gsap.utils.toArray<HTMLElement>("[data-draw]").forEach((el) => {
          gsap.from(el, {
            scaleX: 0,
            transformOrigin: el.dataset.draw === "center" ? "50% 50%" : "0% 50%",
            duration: 1.2,
            ease: EASE.inOut,
            scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
          });
        });

        if (desktop) {
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            const amount = parseFloat(el.dataset.parallax || "7");
            gsap.fromTo(
              el,
              { yPercent: -amount },
              {
                yPercent: amount,
                ease: "none",
                scrollTrigger: {
                  trigger: el.parentElement ?? el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              }
            );
          });
        }

        // The pinned feature (created earlier, above these triggers) adds scroll distance.
        ScrollTrigger.refresh();
      }
    );

    // Web fonts change line heights; keep trigger positions honest once they land.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      splits.forEach((s) => s.revert());
      mm.revert();
    };
  }, []);

  return null;
}
