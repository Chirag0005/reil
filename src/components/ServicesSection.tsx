"use client";

import React from "react";
import Image from "next/image";
import { BRAND_DATA, SERVICE_CATEGORIES } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { ArrowUpRight, Scissors } from "lucide-react";

export default function ServicesSection() {
  const { openBooking } = useBooking();

  return (
    <section id="services" className="py-24 sm:py-32 bg-[#F7F2EA] border-t border-[#EAE0D3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 pb-8 border-b border-[#EAE0D3]">
          <div className="max-w-2xl">
            <span data-reveal className="text-[11px] uppercase tracking-[0.25em] font-medium text-[#A98563] block mb-3">
              SERVICE MENU
            </span>
            <h2 data-reveal-lines className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#30231F] leading-tight">
              Signature Services
            </h2>
          </div>
          <div data-reveal data-reveal-delay="0.2" className="mt-6 md:mt-0 max-w-sm">
            <p className="text-xs sm:text-sm text-[#817064] font-light leading-relaxed">
              Every colour and cut is personalized to your goals, lifestyle, and maintenance preferences. All prices are
              in Canadian dollars (CAD).
            </p>
          </div>
        </div>

        {/* Colour haircut note */}
        <div
          data-reveal
          role="note"
          className="mb-14 sm:mb-16 flex items-start gap-3.5 p-4 sm:p-5 bg-[#EAE0D3]/45 border border-[#EAE0D3] border-l-2 border-l-[#A98563]"
        >
          <Scissors className="w-4 h-4 text-[#A98563] shrink-0 mt-0.5" />
          <p className="text-sm text-[#30231F] leading-relaxed">{BRAND_DATA.colourHaircutNote}</p>
        </div>

        {/* Staggered Editorial Service Layout */}
        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 items-start">
          {SERVICE_CATEGORIES.map((category, idx) => {
            const bridal = category.id === "bridal";
            return (
              <article
                key={category.id}
                id={`svc-${category.id}`}
                data-reveal-item
                className={`group flex flex-col justify-between bg-[#EAE0D3]/20 border border-[#EAE0D3] p-6 sm:p-7 hover:border-[#A98563]/70 hover:bg-[#EAE0D3]/35 transition-[border-color,background-color,box-shadow,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm hover:shadow-[0_24px_50px_-30px_rgba(48,35,31,0.45)] [@media(hover:hover)]:hover:-translate-y-1 ${
                  idx % 3 === 1 ? "lg:mt-16" : ""
                }`}
              >
                <div>
                  {/* Visual — alternating crops keep the menu from reading as identical tiles */}
                  <div
                    data-reveal-image={idx % 2 === 0 ? "up" : "center"}
                    className={`relative overflow-hidden bg-[#EAE0D3] mb-6 ${
                      idx % 3 === 1 ? "aspect-[4/5]" : "aspect-[16/11]"
                    }`}
                  >
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-[center_30%] img-zoom"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#F7F2EA]/90 backdrop-blur-md text-[9px] uppercase tracking-wider text-[#A98563] font-medium border border-[#EAE0D3]">
                      {category.highlight}
                    </div>
                  </div>

                  {/* Number & Title */}
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="font-serif text-2xl text-[#30231F] font-light group-hover:text-[#A98563] transition-colors">
                      {category.title}
                    </h3>
                    <span className="flex items-center gap-2 font-serif italic text-sm text-[#A98563]">
                      <span aria-hidden="true" className="h-px w-4 bg-[#A98563]/60 origin-right transition-transform duration-500 group-hover:scale-x-[1.8]" />
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Price list */}
                  <ul className="mb-6 divide-y divide-[#EAE0D3] border-t border-[#EAE0D3]">
                    {category.services.map((service) => (
                      <li key={service.id} className="py-3.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="text-sm font-medium text-[#30231F]">{service.name}</h4>
                          {typeof service.price === "number" && (
                            <span className="font-serif text-lg text-[#30231F] whitespace-nowrap">${service.price}</span>
                          )}
                        </div>
                        {service.duration && (
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#A98563] mt-0.5">{service.duration}</p>
                        )}
                        {service.description?.map((d) => (
                          <p key={d} className="text-xs text-[#30231F]/75 font-light leading-relaxed mt-1.5">
                            {d}
                          </p>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <div className="pt-4 border-t border-[#EAE0D3] space-y-4">
                  {bridal ? (
                    <>
                      <p className="text-xs text-[#30231F]/85 font-light leading-relaxed">{BRAND_DATA.bridalMessage}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={BRAND_DATA.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3 px-2 text-[11px] uppercase tracking-[0.16em] font-medium text-center text-[#30231F] hover:text-[#F7F2EA] hover:bg-[#30231F] border border-[#817064]/40 hover:border-[#30231F] transition-[background-color,color,border-color] duration-300"
                        >
                          Instagram
                        </a>
                        <a
                          href={`mailto:${BRAND_DATA.bridalEmail}?subject=${encodeURIComponent("Bridal inquiry")}`}
                          className="py-3 px-2 text-[11px] uppercase tracking-[0.16em] font-medium text-center text-[#30231F] hover:text-[#F7F2EA] hover:bg-[#30231F] border border-[#817064]/40 hover:border-[#30231F] transition-[background-color,color,border-color] duration-300"
                        >
                          Email Reilly
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      {category.colourNote && (
                        <p className="text-[11px] text-[#817064] font-light italic">
                          <strong className="text-[#30231F] not-italic font-medium">Please note: </strong>
                          Haircuts are not included. Add the Add-On Haircut when booking.
                        </p>
                      )}
                      <button
                        onClick={() => openBooking(category.id === "add-ons" ? undefined : category.services[0].name)}
                        className="group/btn w-full py-3 px-4 text-xs uppercase tracking-[0.18em] font-medium text-[#30231F] hover:text-[#F7F2EA] bg-transparent hover:bg-[#30231F] border border-[#817064]/40 hover:border-[#30231F] transition-[background-color,color,border-color] duration-300 flex items-center justify-center space-x-2"
                      >
                        <span>Request Appointment</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-[3px] group-hover/btn:-translate-y-[3px]" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p data-reveal className="mt-14 text-center text-xs text-[#817064]">
          Prefer to choose your own time?{" "}
          <a
            href={BRAND_DATA.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-line pb-0.5 text-[#30231F] hover:text-[#A98563] font-medium"
          >
            Book online with Square
          </a>
        </p>
      </div>
    </section>
  );
}
