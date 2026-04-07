import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://valleyspecialtyroasters.com"
  ),
  title: {
    default: "Valley Specialty Roasters | Premium Wholesale Coffee",
    template: "%s | Valley Specialty Roasters",
  },
  description:
    "Small-batch specialty coffee roasted to order for discerning businesses. Premium wholesale coffee sourced from the world's finest origins.",
  keywords: [
    "wholesale coffee",
    "roasted coffee",
    "specialty coffee roaster",
    "wholesale coffee beans",
    "coffee supplier",
    "B2B coffee",
    "small batch coffee",
    "premium coffee wholesale",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Valley Specialty Roasters",
    title: "Valley Specialty Roasters | Premium Wholesale Coffee",
    description:
      "Small-batch specialty coffee roasted to order for discerning businesses.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
