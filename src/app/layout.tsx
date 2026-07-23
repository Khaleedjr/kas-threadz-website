import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Jost, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kasthreadz.com"),
  title: {
    default: "KAS THREADZ · Bespoke Embroidery, Abuja",
    template: "%s · KAS THREADZ",
  },
  description:
    "Kaftan, agbada, jallabiya and senator wear, machine-embroidered from the house design library and finished by hand at the Abuja atelier.",
  openGraph: {
    title: "KAS THREADZ · Bespoke Embroidery, Abuja",
    description:
      "Bespoke tailoring and embroidery from the house design library. Every design code is a real machine file.",
    locale: "en_NG",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e13",
};

/**
 * Hides the mark before first paint so a first-time visitor watches it sewn
 * rather than seeing it finished and then rewound. Runs inline, ahead of
 * render; without JavaScript the class is never added and the mark is simply
 * there.
 */
const CEREMONY_GUARD = `try{if(!sessionStorage.getItem("kas-mark-sewn"))document.documentElement.classList.add("kas-sew-pending")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jost.variable} ${jetbrains.variable} h-full antialiased`}
      // the ceremony guard below adds kas-sew-pending before hydration, so the
      // class list on this element is expected to differ from the server HTML
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: CEREMONY_GUARD }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.2em]"
          style={{ background: "var(--color-thread)", color: "var(--color-cloth-deep)" }}
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
