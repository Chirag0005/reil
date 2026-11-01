"use client";

import React from "react";
import Image from "next/image";
import { BRAND_DATA } from "@/data/salon";
import AppointmentForm from "./AppointmentForm";
import { Sparkles, Calendar, Scissors, ArrowUpRight } from "lucide-react";

export default function FinalAppointmentFeature() {
  const { finalFeature } = BRAND_DATA;

  return (
    <section id="book" className="py-24 sm:py-32 bg-[#F7F2EA] border-t border-[#EAE0D3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Editorial Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span data-reveal className="text-[11px] uppercase tracking-[0.3em] font-medium text-[#A98563] block mb-3">
            BOOK WITH REILLY
          </span>
          <h2 data-reveal-lines className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#30231F] leading-tight tracking-tight mb-4">
            {finalFeature.headline}
          </h2>
          <div data-draw="center" className="w-12 h-[1px] bg-[#A98563] mx-auto mb-4" />
          <p data-reveal data-reveal-delay="0.2" className="text-sm sm:text-base text-[#817064] font-light leading-relaxed">
            {finalFeature.supporting}
          </p>
        </div>

        {/* 2-Column High-Impact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: High-Impact Editorial Hair Photography & Ethos */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div data-reveal-image="up" className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-[#EAE0D3] border border-[#EAE0D3] shadow-xl group">
              <Image
                src={finalFeature.image}
                alt="Woman with glossy, styled hair"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#30231F]/50 via-transparent to-transparent opacity-60" />

              <div data-reveal data-reveal-delay="0.7" className="absolute bottom-6 left-6 right-6 p-4 bg-[#F7F2EA]/95 backdrop-blur-md border border-[#EAE0D3]">
                <p className="font-serif italic text-base text-[#30231F]">
                  &ldquo;Beautiful hair that feels like you.&rdquo;
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98563] font-medium mt-1">
                  — {BRAND_DATA.name}
                </p>
              </div>
            </div>

            {/* Booking notes */}
            <div data-reveal-group className="bg-[#EAE0D3]/30 border border-[#EAE0D3] p-6 space-y-4">
              <div data-reveal-item className="flex items-start space-x-3.5">
                <Scissors className="w-4 h-4 text-[#A98563] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#30231F]">
                    Booking Colour?
                  </h3>
                  <p className="text-xs text-[#30231F]/85 font-light mt-0.5 leading-relaxed">
                    {BRAND_DATA.colourHaircutNote}
                  </p>
                </div>
              </div>

              <div data-reveal-item className="flex items-start space-x-3.5">
                <Sparkles className="w-4 h-4 text-[#A98563] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#30231F]">
                    Personalized To You
                  </h3>
                  <p className="text-xs text-[#817064] font-light mt-0.5 leading-relaxed">
                    Every service is tailored to your goals, lifestyle, and maintenance preferences.
                  </p>
                </div>
              </div>

              <div data-reveal-item className="flex items-start space-x-3.5">
                <Calendar className="w-4 h-4 text-[#A98563] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#30231F]">
                    Prefer To Book Instantly?
                  </h3>
                  <p className="text-xs text-[#817064] font-light mt-0.5 leading-relaxed">
                    Requests sent here are confirmed by Reilly by email. To choose a time yourself, use{" "}
                    <a
                      href={BRAND_DATA.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[#30231F] underline underline-offset-2 hover:text-[#A98563]"
                    >
                      online booking
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Central Appointment Form */}
          <div data-reveal data-reveal-delay="0.15" className="lg:col-span-7 bg-[#FFFFFF] border border-[#EAE0D3] p-6 sm:p-10 shadow-lg">
            <div className="mb-6 pb-4 border-b border-[#EAE0D3] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#A98563] font-medium block">
                  Appointment Request
                </span>
                <p className="text-xs text-[#817064] mt-0.5">
                  Fields marked with <span className="text-[#A98563]">*</span> are required.
                </p>
              </div>
              <Calendar className="w-4 h-4 text-[#817064]" />
            </div>

            <AppointmentForm isModal={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

