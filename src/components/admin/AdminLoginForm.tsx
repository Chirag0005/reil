"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (!res.ok || !data?.success) {
        setError(data?.message || "Sign in failed. Please try again.");
        setPassword("");
        return;
      }
      router.replace("/admin/appointments");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-[#EAE0D3] focus:border-[#30231F] text-[#30231F] text-sm px-4 py-3 focus:outline-none focus:shadow-[0_0_0_3px_rgba(169,133,99,0.16)] transition-[border-color,box-shadow] duration-300";

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 paper-texture">
      <div className="w-full max-w-md animate-panelIn">
        <div className="text-center mb-10">
          <p className="font-serif text-3xl sm:text-4xl tracking-[0.22em] font-light">HAIR BY REI</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.32em] text-[#817064]">Studio Administration</p>
        </div>

        <div className="bg-white border border-[#EAE0D3] shadow-[0_30px_60px_-40px_rgba(48,35,31,0.45)] p-7 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-9 h-9 rounded-full bg-[#EAE0D3] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#30231F]" />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-light leading-tight">Sign in</h1>
              <p className="text-xs text-[#817064]">Private access for the salon administrator.</p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-6 p-3.5 bg-[#F6E9E5] border border-[#E4C7BF] text-[#7A2F23] text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-[11px] uppercase tracking-[0.2em] text-[#817064] font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#817064] hover:text-[#30231F] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-tactile w-full py-4 text-xs uppercase tracking-[0.22em] font-medium text-[#F7F2EA] bg-[#30231F] hover:bg-[#2B201C] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Signing in" : "Sign in"}</span>
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[11px] text-[#817064]">
          <Link href="/" className="link-line pb-0.5 hover:text-[#30231F]">
            Return to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
