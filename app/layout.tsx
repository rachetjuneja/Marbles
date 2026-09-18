import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales OS — Marble Visualiser",
  description: "Put real marble into real rooms and turn a showroom visit into a sale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
