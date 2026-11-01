import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SignatureArtistry from "@/components/SignatureArtistry";
import PortfolioGallery from "@/components/PortfolioGallery";
import ServicesSection from "@/components/ServicesSection";
import EditorialFeature from "@/components/EditorialFeature";
import AboutReilly from "@/components/AboutReilly";
import StudioSection from "@/components/StudioSection";
import FinalAppointmentFeature from "@/components/FinalAppointmentFeature";
import Footer from "@/components/Footer";
import AppointmentModal from "@/components/AppointmentModal";
import { BookingProvider } from "@/context/BookingContext";
import ScrollReveals from "@/components/motion/ScrollReveals";

export default function Home() {
  return (
    <BookingProvider>
      <div className="relative min-h-screen bg-[#F7F2EA] text-[#30231F] selection:bg-[#EAE0D3] selection:text-[#30231F]">
        {/* Navigation Bar */}
        <Navbar />

        <main>
          {/* Section 1: Editorial Hero */}
          <Hero />

          {/* Section 2: Signature Hair Artistry */}
          <SignatureArtistry />

          {/* Section 3: Featured Hair Portfolio (Filters & Modal View) */}
          <PortfolioGallery />

          {/* Section 4: Signature Services */}
          <ServicesSection />

          {/* Section 5: Editorial Feature (The Art of Dimensional Colour) */}
          <EditorialFeature />

          {/* Section 6: Meet Reilly Gray */}
          <AboutReilly />

          {/* Section 7: Visit Salon Boheme (location & contact) */}
          <StudioSection />

          {/* Section 8: Final Appointment Feature (request form + Square) */}
          <FinalAppointmentFeature />
        </main>

        {/* Section 9: Refined Footer */}
        <Footer />

        {/* Global Appointment Request Modal */}
        <AppointmentModal />

        {/* Site-wide scroll-reveal choreography (data-reveal attributes) */}
        <ScrollReveals />
      </div>
    </BookingProvider>
  );
}
