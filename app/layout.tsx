
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CureWell | Multispecialty Hospital",
    template: "%s | CureWell",
  },
  description:
    "CureWell Multispecialty Hospital — Care for a Healthier Tomorrow. Manage appointments, connect with healthcare professionals, and access your medical information securely.",
  applicationName: "CureWell",
  keywords: [
    "CureWell",
    "hospital management",
    "healthcare appointments",
    "patient portal",
    "medical records",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f1f6fa",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
