"use client";

import React from "react";
import Image from "next/image";
import { BRAND_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "./icons/InstagramIcon";

export default function AboutReilly() {
  const { openBooking } = useBooking();
  const about = BRAND_DATA.about;

  return (
    <section id="about" className="py-24 sm:py-32 bg-[#F7F2EA] border-t border-[#EAE0D3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Stylist Portrait */}
          <div className="lg:col-span-5 relative">
            <div data-reveal-image="up" className="relative aspect-[4/5] overflow-hidden bg-[#EAE0D3] border border-[#EAE0D3] shadow-md group">
              <div data-parallax="5" className="absolute inset-x-0 -top-[6%] -bottom-[6%]">
                <Image
                  src={about.image}
                  alt={about.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-[28%_40%] img-zoom"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#30231F]/30 via-transparent to-transparent opacity-40" />
            </div>

            {/* Discreet Instagram Link */}
            <div data-reveal="fade" data-reveal-delay="0.4" className="mt-4 flex items-center justify-between text-xs text-[#817064] px-1">
              <span>Hair Stylist · {BRAND_DATA.salon}</span>
              <a
                href={BRAND_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line inline-flex items-center space-x-1.5 text-[#30231F] hover:text-[#A98563] font-medium pb-0.5"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#A98563]" />
                <span>{BRAND_DATA.instagramHandle}</span>
              </a>
            </div>
          </div>

          {/* Editorial Introduction */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span data-reveal className="text-[11px] uppercase tracking-[0.25em] font-medium text-[#A98563] block mb-3">
              {about.label}
            </span>
            <h2 data-reveal-lines className="font-serif text-3xl sm:text-5xl font-light text-[#30231F] leading-tight mb-4">
              {about.title}
            </h2>

            {/* Verified Credentials */}
            <div data-reveal-group className="flex flex-wrap items-center gap-2 mb-8">
              {about.credentials.map((cred, idx) => (
                <span
                  key={idx}
                  data-reveal-item
                  className="px-3 py-1 bg-[#EAE0D3]/60 text-[#30231F] text-[11px] uppercase tracking-wider font-medium border border-[#EAE0D3]"
                >
                  {cred}
                </span>
              ))}
            </div>

            <div className="space-y-5 text-sm sm:text-base text-[#30231F]/80 font-light leading-relaxed mb-10 max-w-2xl">
              {about.copy.map((para, i) => (
                <p key={i} data-reveal data-reveal-delay={String(0.1 + i * 0.1)}>
                  {para}
                </p>
              ))}
            </div>

            <div data-reveal data-reveal-delay="0.2" className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
              <button
                onClick={() => openBooking()}
                className="btn-tactile group inline-flex items-center space-x-2 px-8 py-3.5 bg-[#30231F] hover:bg-[#2B201C] text-[#F7F2EA] text-xs uppercase tracking-[0.2em] font-medium shadow-sm"
              >
                <span>REQUEST AN APPOINTMENT</span>
                <ArrowUpRight className="arrow-nudge w-4 h-4 text-[#EAE0D3]" />
              </button>

              <a
                href={BRAND_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center space-x-2 text-xs uppercase tracking-[0.18em] font-medium text-[#30231F] hover:text-[#A98563] py-2 transition-colors duration-300"
              >
                <span className="link-line pb-0.5">VIEW INSTAGRAM WORK</span>
                <ArrowUpRight className="arrow-nudge w-3.5 h-3.5 text-[#A98563]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
