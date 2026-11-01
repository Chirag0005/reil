"use client";

import React from "react";
import { BRAND_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "./icons/InstagramIcon";

export default function Footer() {
  const { openBooking } = useBooking();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#F7F2EA] text-[#30231F] border-t border-[#EAE0D3] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Top Tier: Wordmark & Primary CTA */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-14 border-b border-[#EAE0D3] gap-8">
          <div>
            <span data-reveal-lines className="font-serif text-3xl sm:text-5xl lg:text-6xl tracking-[0.2em] font-light text-[#30231F] block">
              {BRAND_DATA.wordmark}
            </span>
            <span className="text-xs uppercase tracking-[0.35em] text-[#A98563] block mt-2">
              {BRAND_DATA.descriptor}
            </span>
            <p className="text-xs sm:text-sm text-[#817064] font-light max-w-md mt-4 leading-relaxed">
              Lived-in blondes, dimensional colour and personalized hair services at Salon Boheme in Dieppe, New Brunswick.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <button
              onClick={() => openBooking()}
              className="btn-tactile group px-8 py-3.5 bg-[#30231F] hover:bg-[#2B201C] text-[#F7F2EA] text-xs uppercase tracking-[0.2em] font-medium border border-[#30231F] shadow-sm text-center flex items-center justify-center space-x-2"
            >
              <span>REQUEST APPOINTMENT</span>
              <ArrowUpRight className="arrow-nudge w-4 h-4 text-[#EAE0D3]" />
            </button>

            <button
              onClick={scrollToTop}
              className="group p-3.5 border border-[#EAE0D3] hover:border-[#30231F] bg-[#FFFFFF] text-[#817064] hover:text-[#30231F] transition-colors duration-300 flex items-center justify-center"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* Middle Tier: Navigation Links */}
        <div data-reveal-group className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-[#EAE0D3] text-xs">
          {/* Navigation */}
          <div data-reveal-item>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#A98563] font-semibold block mb-4">
              Explore
            </span>
            <ul className="space-y-2.5 text-[#30231F]/80 font-light">
              <li>
                <a href="#hero" className="link-line pb-0.5 hover:text-[#A98563]">
                  Home
                </a>
              </li>
              <li>
                <a href="#gallery" className="link-line pb-0.5 hover:text-[#A98563]">
                  Hair Portfolio
                </a>
              </li>
              <li>
                <a href="#services" className="link-line pb-0.5 hover:text-[#A98563]">
                  Signature Services
                </a>
              </li>
              <li>
                <a href="#about" className="link-line pb-0.5 hover:text-[#A98563]">
                  About Reilly
                </a>
              </li>
              <li>
                <a href="#studio" className="link-line pb-0.5 hover:text-[#A98563]">
                  Visit the Salon
                </a>
              </li>
              <li>
                <a href="#book" className="link-line pb-0.5 hover:text-[#A98563]">
                  Book Appointment
                </a>
              </li>
            </ul>
          </div>

          {/* Core Services */}
          <div data-reveal-item>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#A98563] font-semibold block mb-4">
              Services
            </span>
            <ul className="space-y-2.5 text-[#30231F]/80 font-light">
              <li>
                <button
                  onClick={() => openBooking("Haircut + Blowout")}
                  className="link-line pb-0.5 hover:text-[#A98563] text-left"
                >
                  Cut + Style
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBooking("Lived-In Blonde")}
                  className="link-line pb-0.5 hover:text-[#A98563] text-left"
                >
                  Lived-In Blonde
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBooking("Dimensional Colour")}
                  className="link-line pb-0.5 hover:text-[#A98563] text-left"
                >
                  Dimensional Colour
                </button>
              </li>
            </ul>
          </div>

          {/* Salon location */}
          <div data-reveal-item>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#A98563] font-semibold block mb-4">
              Salon Location
            </span>
            <div className="space-y-1.5 text-[#30231F]/80 font-light leading-relaxed">
              <p className="font-medium text-[#30231F]">{BRAND_DATA.salon}</p>
              <p>
                {BRAND_DATA.city}, {BRAND_DATA.province}, {BRAND_DATA.country}
              </p>
              <p className="text-[11px] text-[#817064] pt-1">
                Salon phone:{" "}
                <a href={BRAND_DATA.phoneHref} className="link-line hover:text-[#A98563]">
                  {BRAND_DATA.phone}
                </a>
              </p>
            </div>
          </div>

          {/* Social & Connection */}
          <div data-reveal-item>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#A98563] font-semibold block mb-4">
              Connect
            </span>
            <div className="space-y-3 text-[#30231F]/80 font-light">
              <a
                href={BRAND_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-[#30231F] hover:text-[#A98563] transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-[#A98563]" />
                <span className="font-medium">{BRAND_DATA.instagramHandle}</span>
              </a>
              <p className="text-[11px] text-[#817064] leading-relaxed">
                Bridal inquiries:{" "}
                <a href={`mailto:${BRAND_DATA.bridalEmail}`} className="link-line hover:text-[#A98563] break-all">
                  {BRAND_DATA.bridalEmail}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Discretion & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#817064] font-light gap-4">
          <p>© {new Date().getFullYear()} {BRAND_DATA.name}. All rights reserved.</p>
          <div className="flex items-center space-x-5">
            <span>{BRAND_DATA.locationLabel}</span>
            <a href={BRAND_DATA.bookingUrl} target="_blank" rel="noopener noreferrer" className="link-line hover:text-[#30231F]">
              Book online
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
