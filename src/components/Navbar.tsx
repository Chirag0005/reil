"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BRAND_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { Menu, X, Calendar, Sparkles, ArrowUpRight, UserRound } from "lucide-react";
import { InstagramIcon } from "./icons/InstagramIcon";
import { gsap, MEDIA, lockScroll, unlockScroll, trapFocus, useIsomorphicLayoutEffect } from "@/lib/motion";

const navLinks = [
  { label: "Home", href: "#hero" },
  { label: "Services", href: "#services" },
  { label: "Hair Gallery", href: "#gallery" },
  { label: "About Reilly", href: "#about" },
  { label: "Visit", href: "#studio" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#hero");
  const { openBooking } = useBooking();
  const progressRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll-spy: the last nav section whose top has crossed the upper reading band.
  // Position-based (not intersection events) so jumps and unlisted sections never leave it stale.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = navLinks[0].href;
      navLinks.forEach((l) => {
        const el = document.querySelector<HTMLElement>(l.href);
        if (el && el.getBoundingClientRect().top <= line) current = l.href;
      });
      setActiveHref(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Minimal editorial reading-progress hairline.
  useIsomorphicLayoutEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: window.matchMedia(MEDIA.reduced).matches ? true : 0.3 },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  // Mobile drawer: scroll lock, Escape, focus in on open and back to the toggle on close.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    lockScroll();
    closeRef.current?.focus();
    const toggle = toggleRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
      trapFocus(e, drawerRef.current);
    };
    // Drawer is hidden at xl; close it so the scroll lock never outlives it.
    const wide = window.matchMedia("(min-width: 1280px)");
    const onWide = () => wide.matches && setMobileMenuOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      unlockScroll();
      toggle?.focus({ preventScroll: true });
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        id="site-header"
        className={`fixed top-0 left-0 right-0 z-40 transition-[background-color,box-shadow,padding,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-b ${
          scrolled
            ? "py-3.5 bg-[#F7F2EA]/95 backdrop-blur-md border-[#EAE0D3] shadow-[0_8px_30px_-18px_rgba(48,35,31,0.35)]"
            : "py-5 sm:py-6 bg-[#F7F2EA]/70 backdrop-blur-sm border-transparent"
        }`}
      >
        <div
          data-header-inner
          data-hero-hide
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between"
        >
          {/* Brand Wordmark & Descriptor */}
          <Link
            href="#hero"
            className="group flex flex-col items-start"
            aria-label="Hair by Rei - Return to top"
          >
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.22em] font-light text-[#30231F] group-hover:text-[#A98563] transition-colors duration-300">
              {BRAND_DATA.wordmark}
            </span>
            <span className="text-[9px] uppercase tracking-[0.32em] text-[#817064] font-sans -mt-0.5 transition-[letter-spacing] duration-500 group-hover:tracking-[0.36em]">
              {BRAND_DATA.descriptor}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden xl:flex items-center space-x-9"
            aria-label="Primary Navigation"
          >
            {navLinks.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? "location" : undefined}
                  className={`group/nav whitespace-nowrap text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-250 relative py-1 ${
                    isActive ? "text-[#30231F]" : "text-[#30231F]/70 hover:text-[#30231F]"
                  }`}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-0.5 h-px bg-[#A98563] transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? "scale-x-100 origin-left"
                        : "scale-x-0 origin-right group-hover/nav:scale-x-100 group-hover/nav:origin-left group-focus-visible/nav:scale-x-100"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Right Action Touchpoints */}
          <div className="hidden xl:flex items-center space-x-5">
            <div className="flex items-center gap-1">
              <a
                href={BRAND_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#817064] hover:text-[#30231F] transition-[color,transform] duration-300 hover:-translate-y-px"
                title="Follow Reilly on Instagram"
                aria-label="Instagram @reillyincolour"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <Link
                href="/admin/login"
                className="p-2 text-[#817064] hover:text-[#30231F] transition-[color,transform] duration-300 hover:-translate-y-px"
                title="Admin Login"
                aria-label="Admin Login"
              >
                <UserRound className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>

            <button
              onClick={() => openBooking()}
              className="btn-tactile inline-flex items-center justify-center px-6 py-2.5 text-xs uppercase tracking-[0.2em] font-medium text-[#F7F2EA] bg-[#30231F] hover:bg-[#2B201C] border border-[#30231F] shadow-sm group"
            >
              <Calendar className="w-3.5 h-3.5 mr-2 text-[#EAE0D3]" />
              <span className="whitespace-nowrap">BOOK APPOINTMENT</span>
            </button>
          </div>

          {/* Mobile Actions & Toggle */}
          <div className="flex xl:hidden items-center space-x-2.5">
            <button
              onClick={() => openBooking()}
              className="btn-tactile px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-medium text-[#F7F2EA] bg-[#30231F]"
            >
              Book
            </button>
            <button
              ref={toggleRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#30231F] hover:text-[#817064] transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Reading progress */}
        <div
          ref={progressRef}
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 h-px bg-[#A98563]/80 origin-left scale-x-0"
        />
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        ref={drawerRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!mobileMenuOpen}
        className={`fixed inset-0 z-50 bg-[#F7F2EA] xl:hidden flex flex-col justify-between p-7 transition-[opacity,clip-path] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileMenuOpen
            ? "opacity-100 [clip-path:inset(0_0_0_0)]"
            : "opacity-0 pointer-events-none [clip-path:inset(0_0_100%_0)]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#EAE0D3] pb-4">
          <div className="flex flex-col">
            <span className="font-serif text-2xl tracking-[0.2em] text-[#30231F]">
              {BRAND_DATA.wordmark}
            </span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#817064]">
              {BRAND_DATA.descriptor}
            </span>
          </div>
          <button
            ref={closeRef}
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-[#30231F] hover:text-[#817064] transition-[color,transform] duration-300 hover:rotate-90"
            aria-label="Close navigation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col my-auto py-6" aria-label="Mobile Navigation">
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{ transitionDelay: mobileMenuOpen ? `${120 + i * 55}ms` : "0ms" }}
              className={`group flex items-baseline justify-between py-3 border-b border-[#EAE0D3]/70 font-serif text-[1.75rem] tracking-wide text-[#30231F] transition-[opacity,transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } ${activeHref === link.href ? "text-[#A98563]" : ""}`}
            >
              <span>{link.label}</span>
              <span className="font-sans text-[10px] tracking-[0.25em] text-[#A98563]">0{i + 1}</span>
            </a>
          ))}
        </nav>

        <div
          style={{ transitionDelay: mobileMenuOpen ? "420ms" : "0ms" }}
          className={`border-t border-[#EAE0D3] pt-5 space-y-4 transition-[opacity,transform] duration-500 ${
            mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#817064] tracking-widest uppercase font-medium">
              {BRAND_DATA.locationLabel}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={BRAND_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#30231F] flex items-center space-x-1.5 font-medium"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#A98563]" />
                <span>{BRAND_DATA.instagramHandle}</span>
              </a>
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-[#A98563] hover:text-[#30231F] transition-colors duration-300"
                title="Admin Login"
                aria-label="Admin Login"
              >
                <UserRound className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openBooking();
            }}
            className="btn-tactile group w-full py-4 text-xs uppercase tracking-[0.2em] font-medium text-[#F7F2EA] bg-[#30231F] flex items-center justify-center space-x-2 shadow"
          >
            <Sparkles className="w-4 h-4 text-[#EAE0D3]" />
            <span>BOOK AN APPOINTMENT</span>
            <ArrowUpRight className="arrow-nudge w-4 h-4 text-[#EAE0D3]" />
          </button>
        </div>
      </div>
    </>
  );
}
