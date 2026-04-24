import type { Metadata } from "next";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MathBounty — Decentralized Math Bounty Marketplace",
  description: "Post mathematical problems, escrow ETH, and let solvers compete. Trustless smart contract payouts on the Sepolia network.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MathBounty — Decentralized Math Bounty Marketplace",
    description: "Post mathematical problems, escrow ETH, and let solvers compete. Trustless smart contract payouts on the Sepolia network.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MathBounty — Decentralized Math Bounty Marketplace",
    description: "Post mathematical problems, escrow ETH, and let solvers compete.",
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
      className={`${bebasNeue.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mathbounty-theme');if(t){document.documentElement.setAttribute('data-theme',t);}else{var s=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.setAttribute('data-theme',s?'light':'dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-ink font-body">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
