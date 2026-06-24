import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ProgressBar } from "@/components/ui/progress-bar";
import "./globals.css";

// Inter Variable: la familia de Linear. Mantiene el nombre de variable previo
// (--font-geist-sans) para no tocar el resto de la cadena de estilos.
const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";
const defaultTitle = `${appName} | Asociación Civil habilitada por IRCCA`;
const defaultDescription = `${appName} — Asociación Civil habilitada por IRCCA en Uruguay, bajo Ley 19.172 y Decreto 120/014.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s · ${appName}`,
  },
  description: defaultDescription,
  applicationName: appName,
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: siteUrl,
    siteName: appName,
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("theme")?.value === "light" ? "light" : "dark";
  return (
    <html
      lang="es-UY"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Congela el padding lateral al primer render: % del viewport
            inicial según breakpoint, sin recalcular en resize. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var w=window.innerWidth;var pct=w>=1024?0.10:w>=640?0.07:0.04;document.documentElement.style.setProperty('--page-pad',Math.round(w*pct)+'px');})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ProgressBar>{children}</ProgressBar>
      </body>
    </html>
  );
}
