"use client";

import { useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
}

/* One easing language for the whole site: a soft editorial expo-out for reveals,
   a gentler power curve for UI states. */
export const EASE = {
  reveal: "expo.out",
  soft: "power3.out",
  inOut: "power3.inOut",
} as const;

export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px)",
  mobile: "(max-width: 1023px)",
} as const;

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(MEDIA.reduced).matches;
}

/* Shared, counted body scroll lock so the booking modal and the gallery lightbox
   never fight over `document.body.style.overflow`. */
let lockCount = 0;
let savedOverflow = "";
let savedPadding = "";

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    savedOverflow = document.body.style.overflow;
    savedPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
  }
  lockCount += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined" || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPadding;
  }
}

/* Keeps keyboard focus inside a dialog while it is open. */
export function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (e.key !== "Tab" || !container) return;
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export { gsap, ScrollTrigger, SplitText, Flip };
