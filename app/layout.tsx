import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { OfflineStatus } from "@/components/offline-status"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"
import { InternetStatus } from "@/components/internet-status"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión Escolar",
  description: "Sistema de gestión escolar para administrar alumnos, maestros y grupos",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  generator: 'Lic. Eduardo Gallegos Domínguez',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sistema de Gestión Escolar',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="application-name" content="Sistema de Gestión Escolar" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SGE" />
        <meta name="description" content="Sistema de gestión escolar para maestros y administradores" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/favicon.png" color="#000000" />
        <link rel="shortcut icon" href="/favicon.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          {/* <OfflineStatus />
          <InternetStatus /> */}
          {children}
          {/* <PWAInstallPrompt />
          <OfflineIndicator /> */}
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </body>
    </html>
  )
}
