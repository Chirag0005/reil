"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { BRAND_DATA, GALLERY_DATA } from "@/data/salon";
import { useBooking } from "@/context/BookingContext";
import { ArrowUpRight } from "lucide-react";
import { gsap, EASE, MEDIA, useIsomorphicLayoutEffect } from "@/lib/motion";

// Looks from the gallery continue the feature's story.
const STORY_LOOKS = ["gal-13", "gal-4"]
  .map((id) => GALLERY_DATA.find((item) => item.id === id))
  .filter((item): item is (typeof GALLERY_DATA)[number] => !!item);

export default function EditorialFeature() {
  const { openBooking } = useBooking();
  const feature = BRAND_DATA.editorialFeature;
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  const frames = [
    { image: feature.image, alt: "Dimensional brunette hair with a glossy finish", tag: "Dimensional Colour · Custom Gloss" },
    ...STORY_LOOKS.map((look) => ({ image: look.image, alt: look.title, tag: look.tonalProfile })),
  ];
  const total = frames.length;

  /*
   * Desktop + full motion only: the photograph holds while the narrative advances through
   * the looks, then the page continues. Everywhere else this is a normal stacked section.
   */
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia(section);

    mm.add(`${MEDIA.motion} and ${MEDIA.desktop}`, () => {
      section.classList.add("is-pinned");
      const q = gsap.utils.selector(section);
      const images = q("[data-feature-image]");
      const panels = q("[data-feature-panel]");
      const ticks = q("[data-feature-tick]");

      gsap.set(images.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(panels.slice(1), { autoAlpha: 0, y: 40 });
      gsap.set(ticks.slice(1), { scaleX: 0 });

      const tl = gsap.timeline({
        defaults: { ease: EASE.inOut },
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (total - 1) * 0.9}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: { snapTo: "labels", duration: { min: 0.3, max: 0.8 }, delay: 0.1, ease: EASE.soft },
        },
      });

      tl.addLabel("step0");
      for (let i = 1; i < total; i++) {
        const at = `step${i - 1}+=0.15`;
        tl.to(panels[i - 1], { autoAlpha: 0, y: -40, duration: 0.5 }, at)
          .to(images[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, at)
          .fromTo(images[i].querySelector("img"), { scale: 1.18 }, { scale: 1, duration: 1.2, ease: EASE.soft }, at)
          .to(images[i - 1].querySelector("img"), { scale: 1.06, duration: 1 }, at)
          .to(panels[i], { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.soft }, `${at}+=0.45`)
          .to(ticks[i], { scaleX: 1, duration: 0.6 }, `${at}+=0.3`)
          .addLabel(`step${i}`, "+=0.15");
      }

      return () => section.classList.remove("is-pinned");
    });

    return () => mm.revert();
  }, [total]);

  return (
    <section ref={sectionRef} className="bg-[#2B201C] text-[#F7F2EA] relative overflow-hidden">
      <div ref={pinRef} className="py-24 sm:py-32 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Large Magazine Feature Visual — stacked frames unveil in turn while pinned */}
            <div className="lg:col-span-7 relative">
              <div
                data-reveal-image="up"
                className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-[min(76vh,640px)] overflow-hidden bg-[#30231F] shadow-2xl group border border-[#A98563]/20"
              >
                {frames.map((frame, i) => (
                  <div key={frame.image} data-feature-image className="absolute inset-0 overflow-hidden">
                    <Image
                      src={frame.image}
                      alt={frame.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className={`object-cover object-[center_30%] ${i === 0 ? "img-zoom" : ""}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B201C]/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 right-6 sm:right-auto px-4 py-2 bg-[#2B201C]/90 backdrop-blur-md border border-[#A98563]/30 text-[10px] uppercase tracking-[0.25em] text-[#EAE0D3]">
                      {frame.tag}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimalist Editorial Narrative */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              {/* Chapter ticks (pinned mode only) */}
              <div data-feature-progress aria-hidden="true" className="hidden items-center gap-3 mb-10">
                {frames.map((frame) => (
                  <span key={frame.image} className="relative h-px w-10 bg-[#F7F2EA]/15 overflow-hidden">
                    <span data-feature-tick className="absolute inset-0 bg-[#A98563] origin-left" />
                  </span>
                ))}
                <span className="ml-2 text-[10px] tracking-[0.3em] text-[#EAE0D3]/60">0{total} CHAPTERS</span>
              </div>

              <div data-feature-panels className="flex flex-col gap-14">
                <div data-feature-panel>
                  <span data-reveal className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#A98563] block mb-3">
                    {feature.label}
                  </span>
                  <h2 data-reveal-lines className="font-serif text-3xl sm:text-5xl font-light text-[#F7F2EA] leading-tight mb-4">
                    {feature.title}
                  </h2>
                  <p data-reveal data-reveal-delay="0.1" className="font-serif italic text-base sm:text-lg text-[#EAE0D3]/80 mb-6">
                    {feature.subtitle}
                  </p>
                  <div data-draw className="w-12 h-[1px] bg-[#A98563] mb-6" />
                  <p data-reveal data-reveal-delay="0.2" className="text-sm sm:text-base text-[#F7F2EA]/75 font-light leading-relaxed">
                    {feature.copy}
                  </p>
                </div>

                {STORY_LOOKS.map((look) => (
                  <div key={look.id} data-feature-panel data-pin-managed data-reveal>
                    <div data-feature-thumb className="relative aspect-[16/10] mb-6 overflow-hidden border border-[#A98563]/20 lg:hidden">
                      <Image src={look.image} alt={look.title} fill sizes="100vw" className="object-cover object-[center_30%]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#A98563] block mb-3">
                      Look {look.lookNumber} · {look.category}
                    </span>
                    <h3 className="font-serif text-3xl sm:text-4xl font-light text-[#F7F2EA] leading-tight mb-4">
                      {look.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#F7F2EA]/75 font-light leading-relaxed mb-6">
                      {look.caption}
                    </p>
                    <dl className="grid grid-cols-1 gap-3 border-l border-[#A98563]/50 pl-4 text-xs">
                      <div>
                        <dt className="uppercase tracking-[0.22em] text-[10px] text-[#A98563]">Technique</dt>
                        <dd className="text-[#EAE0D3]/85 mt-0.5">{look.technique}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.22em] text-[10px] text-[#A98563]">Tonal Family</dt>
                        <dd className="text-[#EAE0D3]/85 mt-0.5">{look.tonalProfile}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <div data-reveal className="mt-10">
                <button
                  onClick={() => openBooking("Dimensional Colour")}
                  className="group inline-flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-medium text-[#EAE0D3] hover:text-[#FFFFFF] py-2 border-b border-[#A98563] transition-colors duration-300"
                >
                  <span>REQUEST DIMENSIONAL COLOUR</span>
                  <ArrowUpRight className="arrow-nudge w-3.5 h-3.5 text-[#A98563]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
