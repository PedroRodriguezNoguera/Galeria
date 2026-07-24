import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/contexts/QueryProvider";
import { ToastProvider } from "@/contexts/ToastProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Galería",
  description: "Galería compartida de fotos y vídeos.",
  openGraph: {
    title: "Galería",
    description: "Galería compartida de fotos y vídeos.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Galería",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  // La galería siempre se ve en modo claro, así que la barra del navegador
  // también se queda fija en el color claro, sin importar el móvil.
  themeColor: "#f5f5f7",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <ToastProvider>
            {children}
            {modal}
            <ServiceWorkerRegister />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
