"use client";

import React from "react";
import Image from "next/image";
import { BRAND_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { ArrowUpRight } from "lucide-react";

export default function SignatureArtistry() {
  const { openBooking } = useBooking();
  const artistry = BRAND_DATA.artistry;

  return (
    <section className="py-24 sm:py-32 bg-[#F7F2EA] border-t border-[#EAE0D3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Large Hairstyle Visual */}
          <div className="lg:col-span-7">
            <div data-reveal-image="side" className="relative aspect-[16/11] sm:aspect-[16/10] overflow-hidden bg-[#EAE0D3] border border-[#EAE0D3] shadow-lg group">
              <div data-parallax="6" className="absolute inset-x-0 -top-[8%] -bottom-[8%]">
                <Image
                  src={artistry.image}
                  alt="Woman with softly styled, dimensional hair"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-[center_30%] img-zoom"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#30231F]/30 via-transparent to-transparent opacity-50" />
            </div>
          </div>

          {/* Concise Editorial Copy */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <span data-reveal className="text-[11px] uppercase tracking-[0.25em] font-medium text-[#A98563] block mb-3">
              {artistry.label}
            </span>
            <h2 data-reveal-lines className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#30231F] leading-tight mb-6">
              {artistry.title}
            </h2>
            <div data-draw className="w-12 h-[1px] bg-[#A98563] mb-6" />
            <p data-reveal data-reveal-delay="0.15" className="text-sm sm:text-base text-[#30231F]/80 font-light leading-relaxed mb-8">
              {artistry.copy}
            </p>

            <div data-reveal data-reveal-delay="0.25">
              <button
                onClick={() => openBooking()}
                className="group inline-flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#30231F] hover:text-[#A98563] transition-colors duration-300 py-2 border-b border-[#30231F] hover:border-[#A98563]"
              >
                <span>REQUEST A CONSULTATION</span>
                <ArrowUpRight className="arrow-nudge w-3.5 h-3.5 text-[#A98563]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

