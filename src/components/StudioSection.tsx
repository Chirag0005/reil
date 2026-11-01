"use client";

import React from "react";
import Image from "next/image";
import { BRAND_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";
import { InstagramIcon } from "./icons/InstagramIcon";

export default function StudioSection() {
  const { openBooking } = useBooking();
  const studio = BRAND_DATA.studio;

  const featureIcons = [MapPin, Phone, InstagramIcon, Mail];

  return (
    <section id="studio" className="py-24 sm:py-32 bg-[#F7F2EA] border-t border-[#EAE0D3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <span data-reveal className="text-[11px] uppercase tracking-[0.25em] font-medium text-[#A98563] block mb-3">
            {studio.label}
          </span>
          <h2 data-reveal-lines className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#30231F] leading-tight mb-6">
            {studio.title}
          </h2>
          <div data-draw className="w-12 h-[1px] bg-[#A98563] mb-6" />
          <p data-reveal data-reveal-delay="0.15" className="text-sm sm:text-base text-[#30231F]/80 font-light leading-relaxed max-w-2xl">
            {studio.copy}
          </p>
        </div>

        {/* Editorial Split: Features & Studio Atmosphere */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Studio Pillars Column */}
          <div data-reveal-group className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
            {studio.features.map((feature, idx) => {
              const Icon = featureIcons[idx % featureIcons.length];
              return (
                <div
                  key={idx}
                  data-reveal-item
                  className="group bg-[#EAE0D3]/30 border border-[#EAE0D3] p-6 hover:border-[#A98563]/70 hover:bg-[#EAE0D3]/50 transition-colors duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-9 h-9 rounded-full bg-[#EAE0D3] border border-[#A98563]/30 flex items-center justify-center text-[#30231F] shrink-0 mt-0.5 transition-[background-color,color,border-color] duration-300 group-hover:bg-[#30231F] group-hover:text-[#EAE0D3] group-hover:border-[#30231F]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-serif text-base text-[#30231F] font-medium leading-snug">
                        {feature.title}
                      </p>
                      {feature.href ? (
                        <a
                          href={feature.href}
                          target={feature.href.startsWith("http") ? "_blank" : undefined}
                          rel={feature.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="link-line inline-block text-xs text-[#817064] hover:text-[#30231F] font-light mt-1.5 leading-relaxed break-all"
                        >
                          {feature.detail}
                        </a>
                      ) : (
                        <p className="text-xs text-[#817064] font-light mt-1.5 leading-relaxed">{feature.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Studio Photography Column */}
          <div className="lg:col-span-7 relative">
            <div data-reveal-image="center" className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-[#EAE0D3] border border-[#EAE0D3] shadow-lg group">
              <div data-parallax="6" className="absolute inset-x-0 -top-[8%] -bottom-[8%]">
                <Image
                  src={studio.image}
                  alt="Bright, modern salon interior"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover img-zoom"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#30231F]/40 via-transparent to-transparent opacity-60" />

              <div data-reveal data-reveal-delay="0.6" className="absolute bottom-6 left-6 right-6 p-4 sm:p-5 bg-[#F7F2EA]/95 backdrop-blur-md border border-[#EAE0D3] max-w-sm shadow-md">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98563] font-semibold mb-1">
                  Bridal Inquiries
                </p>
                <p className="text-xs text-[#30231F] font-light leading-relaxed">
                  {BRAND_DATA.bridalMessage}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xs text-[#817064] flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#A98563] shrink-0" />
                <span>{BRAND_DATA.salon} · {BRAND_DATA.city}, {BRAND_DATA.province} · {BRAND_DATA.country}</span>
              </div>

              <button
                onClick={() => openBooking()}
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-[0.18em] font-medium text-[#30231F] hover:text-[#A98563] transition-colors self-start sm:self-auto py-1 border-b border-[#30231F] hover:border-[#A98563]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Request an Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
