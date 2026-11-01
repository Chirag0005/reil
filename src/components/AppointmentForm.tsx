"use client";

import React, { useState } from "react";
import { BRAND_DATA, REQUEST_SERVICE_OPTIONS } from "@/data/salon";
import { AppointmentFormData, AppointmentResponse } from "@/types/salon";
import { Calendar, Clock, User, Mail, Phone, CheckCircle2, AlertCircle, Loader2, Sparkles, Shield } from "lucide-react";

interface AppointmentFormProps {
  initialService?: string;
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function AppointmentForm({
  initialService = "",
  onSuccess,
  isModal = false,
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    fullName: "",
    email: "",
    phone: "",
    service: initialService || REQUEST_SERVICE_OPTIONS[0],
    preferredDate: "",
    preferredTime: "morning",
    notes: "",
    hairLength: "medium",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AppointmentResponse | null>(null);

  // Compute minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split("T")[0];

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = "Please enter your full name (minimum 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!formData.service || !formData.service.trim()) {
      errs.service = "Please select a service or consultation type.";
    }

    if (!formData.preferredDate) {
      errs.preferredDate = "Please choose a preferred appointment date.";
    }

    if (!formData.preferredTime) {
      errs.preferredTime = "Please choose a preferred time window.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Only a saved request (2xx + success) counts; anything else shows the server's reason.
      const data = (await res.json().catch(() => null)) as AppointmentResponse | null;

      if (!res.ok || !data?.success) {
        setResult({
          success: false,
          message: data?.message || "We couldn't send your request. Please try again in a few minutes.",
        });
      } else {
        setResult(data);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch {
      setResult({
        success: false,
        message:
          `Network connection issue. Please check your connection or message ${BRAND_DATA.instagramHandle} on Instagram directly.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      service: REQUEST_SERVICE_OPTIONS[0],
      preferredDate: "",
      preferredTime: "morning",
      notes: "",
      hairLength: "medium",
    });
    setErrors({});
    setResult(null);
  };

  // SUCCESS CONFIRMATION STATE
  if (result?.success) {
    return (
      <div className="bg-[#F7F2EA] border border-[#EAE0D3] p-8 sm:p-10 text-center animate-fadeIn shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#EAE0D3] border border-[#A98563]/40 flex items-center justify-center text-[#30231F] mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#A98563]" />
        </div>

        <span className="text-[10px] uppercase tracking-[0.25em] text-[#A98563] font-medium block mb-2">
          Request Received · Reilly Gray @ Boheme
        </span>

        <h3 className="font-serif text-2xl sm:text-3xl text-[#30231F] font-light mb-3">
          Thank You, {formData.fullName.split(" ")[0]}
        </h3>

        <div className="bg-[#FFFFFF] border border-[#EAE0D3] p-5 max-w-md mx-auto my-6 text-left space-y-2.5">
          <div className="flex justify-between items-center text-xs border-b border-[#EAE0D3] pb-2">
            <span className="text-[#817064] uppercase tracking-wider">Reference Code</span>
            <span className="font-mono text-[#30231F] font-semibold tracking-wider">
              {result.referenceNumber}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#817064]">Client:</span>
            <span className="text-[#30231F] font-medium">{formData.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#817064]">Service:</span>
            <span className="text-[#30231F] font-medium">{formData.service}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#817064]">Preferred Date:</span>
            <span className="text-[#30231F]">{formData.preferredDate}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#817064]">Time Window:</span>
            <span className="text-[#30231F] capitalize">{formData.preferredTime}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#30231F]/80 font-light leading-relaxed max-w-md mx-auto mb-6">
          {result.message}
        </p>

        <div className="p-4 bg-[#EAE0D3]/40 border border-[#EAE0D3] text-xs text-[#817064] max-w-md mx-auto mb-8 text-left space-y-1">
          <p className="font-semibold text-[#30231F] flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#A98563]" />
            Awaiting Reply From Reilly
          </p>
          <p>
            This request is not a confirmed booking. Reilly will review it and reply by email. To reserve a time instantly, use the Square booking page.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium text-[#30231F] hover:text-[#F7F2EA] bg-[#EAE0D3] hover:bg-[#30231F] border border-[#A98563] transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 text-left">
      {/* Error Alert Banner */}
      {result && !result.success && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Unable to Submit Request</p>
            <p>{result.message}</p>
          </div>
        </div>
      )}

      {/* Full Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor={`fullName-${isModal ? "modal" : "page"}`}
            className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2"
          >
            Full Name <span className="text-[#A98563]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id={`fullName-${isModal ? "modal" : "page"}`}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Scarlett Miller"
              className={`w-full bg-[#FFFFFF] border ${
                errors.fullName ? "border-red-400 ring-1 ring-red-400" : "border-[#EAE0D3] focus:border-[#30231F]"
              } text-[#30231F] text-sm px-4 py-3 placeholder-[#817064]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300`}
              disabled={loading}
              required
            />
            <User className="w-4 h-4 text-[#817064]/70 absolute right-3.5 top-3.5" />
          </div>
          {errors.fullName && (
            <p className="text-red-600 text-[11px] mt-1.5">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor={`email-${isModal ? "modal" : "page"}`}
            className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2"
          >
            Email Address <span className="text-[#A98563]">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              id={`email-${isModal ? "modal" : "page"}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. scarlett@example.com"
              className={`w-full bg-[#FFFFFF] border ${
                errors.email ? "border-red-400 ring-1 ring-red-400" : "border-[#EAE0D3] focus:border-[#30231F]"
              } text-[#30231F] text-sm px-4 py-3 placeholder-[#817064]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300`}
              disabled={loading}
              required
            />
            <Mail className="w-4 h-4 text-[#817064]/70 absolute right-3.5 top-3.5" />
          </div>
          {errors.email && (
            <p className="text-red-600 text-[11px] mt-1.5">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Phone Number (Optional) & Service Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor={`phone-${isModal ? "modal" : "page"}`}
              className="text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium"
            >
              Phone Number
            </label>
            <span className="text-[10px] text-[#817064]/70 lowercase italic">(optional)</span>
          </div>
          <div className="relative">
            <input
              type="tel"
              id={`phone-${isModal ? "modal" : "page"}`}
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 506 555 0123"
              className="w-full bg-[#FFFFFF] border border-[#EAE0D3] focus:border-[#30231F] text-[#30231F] text-sm px-4 py-3 placeholder-[#817064]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300"
              disabled={loading}
            />
            <Phone className="w-4 h-4 text-[#817064]/70 absolute right-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label
            htmlFor={`service-${isModal ? "modal" : "page"}`}
            className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2"
          >
            Preferred Service <span className="text-[#A98563]">*</span>
          </label>
          <select
            id={`service-${isModal ? "modal" : "page"}`}
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className={`w-full bg-[#FFFFFF] border ${
              errors.service ? "border-red-400 ring-1 ring-red-400" : "border-[#EAE0D3] focus:border-[#30231F]"
            } text-[#30231F] text-sm px-4 py-3 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300 cursor-pointer`}
            disabled={loading}
          >
            {initialService && !REQUEST_SERVICE_OPTIONS.includes(initialService) && (
              <option value={initialService}>{initialService}</option>
            )}
            {REQUEST_SERVICE_OPTIONS.map((name) => (
              <option key={name} value={name} className="text-[#30231F]">
                {name}
              </option>
            ))}
          </select>
          {errors.service && (
            <p className="text-red-600 text-[11px] mt-1.5">{errors.service}</p>
          )}
        </div>
      </div>

      {/* Preferred Date & Preferred Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor={`preferredDate-${isModal ? "modal" : "page"}`}
            className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2"
          >
            Preferred Date <span className="text-[#A98563]">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id={`preferredDate-${isModal ? "modal" : "page"}`}
              min={minDateString}
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className={`w-full bg-[#FFFFFF] border ${
                errors.preferredDate ? "border-red-400 ring-1 ring-red-400" : "border-[#EAE0D3] focus:border-[#30231F]"
              } text-[#30231F] text-sm px-4 py-3 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300`}
              disabled={loading}
              required
            />
            <Calendar className="w-4 h-4 text-[#817064]/70 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
          {errors.preferredDate && (
            <p className="text-red-600 text-[11px] mt-1.5">{errors.preferredDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor={`preferredTime-${isModal ? "modal" : "page"}`}
            className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2"
          >
            Preferred Time Window <span className="text-[#A98563]">*</span>
          </label>
          <div className="relative">
            <select
              id={`preferredTime-${isModal ? "modal" : "page"}`}
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              className={`w-full bg-[#FFFFFF] border ${
                errors.preferredTime ? "border-red-400 ring-1 ring-red-400" : "border-[#EAE0D3] focus:border-[#30231F]"
              } text-[#30231F] text-sm px-4 py-3 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300 cursor-pointer`}
              disabled={loading}
            >
              <option value="morning">Morning</option>
              <option value="midday">Midday</option>
              <option value="afternoon">Afternoon</option>
              <option value="flexible">Flexible / Any Available Time</option>
            </select>
            <Clock className="w-4 h-4 text-[#817064]/70 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
          {errors.preferredTime && (
            <p className="text-red-600 text-[11px] mt-1.5">{errors.preferredTime}</p>
          )}
        </div>
      </div>

      {/* Hair Length Selector */}
      <div>
        <label className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2">
          Current Hair Length
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: "short", label: "Above Shoulders" },
            { id: "medium", label: "Collarbone" },
            { id: "long", label: "Mid-Back" },
            { id: "extra-long", label: "Past Mid-Back" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setFormData({ ...formData, hairLength: item.id })}
              className={`py-2 px-3 text-xs border text-center transition-all ${
                formData.hairLength === item.id
                  ? "bg-[#30231F] text-[#F7F2EA] border-[#30231F]"
                  : "bg-[#FFFFFF] text-[#30231F]/80 border-[#EAE0D3] hover:border-[#A98563]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Notes (Optional) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor={`notes-${isModal ? "modal" : "page"}`}
            className="text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium"
          >
            Additional Notes or Hair Goals
          </label>
          <span className="text-[10px] text-[#817064]/70 lowercase italic">(optional)</span>
        </div>
        <textarea
          id={`notes-${isModal ? "modal" : "page"}`}
          rows={3}
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Share your colour history, previous box dye or treatments, and the look you’re hoping for..."
          className="w-full bg-[#FFFFFF] border border-[#EAE0D3] focus:border-[#30231F] text-[#30231F] text-sm px-4 py-3 placeholder-[#817064]/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300 resize-none"
          disabled={loading}
        />
      </div>

      {/* Privacy Notice */}
      <div className="p-3 bg-[#EAE0D3]/30 border border-[#EAE0D3] text-[11px] text-[#817064] flex items-start space-x-2.5">
        <Shield className="w-4 h-4 text-[#A98563] shrink-0 mt-0.5" />
        <p>
          <strong>Privacy Notice:</strong> Your details are used only by Reilly Gray @ Boheme to respond to your request.
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-xs sm:text-sm uppercase tracking-[0.22em] font-medium text-[#F7F2EA] bg-[#30231F] hover:bg-[#2B201C] border border-[#30231F] shadow-sm btn-tactile flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#EAE0D3]" />
              <span>Sending Request...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#EAE0D3] group-hover:rotate-12 transition-transform" />
              <span>Send Request</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-[#817064] mt-3 font-light">
          Requests go directly to Reilly, who replies by email.
        </p>
      </div>
    </form>
  );
}
