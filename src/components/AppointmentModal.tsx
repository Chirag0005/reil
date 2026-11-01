"use client";

import React, { useEffect, useRef } from "react";
import { useBooking } from "@/context/BookingContext";
import AppointmentForm from "./AppointmentForm";
import { X, Calendar } from "lucide-react";
import { lockScroll, unlockScroll, trapFocus } from "@/lib/motion";

export default function AppointmentModal() {
  const { isOpen, closeBooking, selectedServiceId } = useBooking();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape, focus trap, shared scroll lock, and focus restored to the opener on close.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    lockScroll();
    closeRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBooking();
      trapFocus(e, dialogRef.current);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
      opener?.focus?.({ preventScroll: true });
    };
  }, [isOpen, closeBooking]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-[#30231F]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-backdropIn"
      onClick={closeBooking}
    >
      <div
        className="relative max-w-2xl w-full bg-[#F7F2EA] border border-[#EAE0D3] shadow-2xl p-6 sm:p-10 my-8 max-h-[92vh] overflow-y-auto animate-panelIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          ref={closeRef}
          onClick={closeBooking}
          className="absolute top-5 right-5 p-2 text-[#817064] hover:text-[#30231F] transition-[color,transform] duration-300 hover:rotate-90"
          aria-label="Close booking modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-8 pr-8">
          <div className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-[#A98563] mb-2 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#A98563]" />
            <span>Reilly Gray @ Boheme · Dieppe</span>
          </div>
          <h2
            id="booking-modal-title"
            className="font-serif text-2xl sm:text-3xl text-[#30231F] font-light"
          >
            Request Your Appointment
          </h2>
          <p className="text-xs sm:text-sm text-[#30231F]/75 mt-1.5 font-light">
            Share your preferred timing and hair goals. Reilly reviews every request personally and will confirm by email.
          </p>
        </div>

        {/* Form Body */}
        <AppointmentForm
          key={selectedServiceId || "modal"}
          initialService={selectedServiceId}
          onSuccess={() => {}}
          isModal={true}
        />
      </div>
    </div>
  );
}
