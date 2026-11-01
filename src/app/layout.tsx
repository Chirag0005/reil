import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reilly Gray @ Boheme · Hair by Rei · Dieppe, New Brunswick",
  description:
    "Beautiful hair that feels like you. Reilly Gray specializes in lived-in blondes and dimensional colour at Salon Boheme in Dieppe, New Brunswick.",
  keywords: [
    "HAIR BY REI",
    "Reilly Gray",
    "Reilly Gray @ Boheme",
    "Salon Boheme",
    "hairstylist Dieppe",
    "lived-in blonde Dieppe",
    "dimensional colour New Brunswick",
    "blonde specialist Moncton Dieppe",
  ],
  authors: [{ name: "Reilly Gray" }],
  openGraph: {
    title: "Reilly Gray @ Boheme · Hair by Rei",
    description:
      "Beautiful hair that feels like you. Lived-in blondes and dimensional colour in Dieppe, New Brunswick.",
    locale: "en_CA",
    type: "website",
  },
};

const MOTION_BOOT = `(function(){try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.classList.add("js-motion");setTimeout(function(){if(!window.__heroMotion)d.classList.remove("js-motion")},2500)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" className={`${cormorant.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Flags motion support before first paint so the hero entrance never flashes.
            If the entrance has not started within 2.5s, content is released untouched. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      </head>
      <body className="bg-[#F7F2EA] text-[#30231F] font-sans antialiased selection:bg-[#EAE0D3] selection:text-[#30231F] min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
