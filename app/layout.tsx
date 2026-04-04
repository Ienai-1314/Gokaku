import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "合格道 Gokaku | 最懂真题的 AI JLPT N1 备考工具",
  description: "基于 2010-2025 年 30 套完整真题数据，提供语法查询、词汇考频、错题分析三大 AI 工具。让真题告诉你该复习什么，做错题越多越懂你的弱点。",
  keywords: "JLPT N1, 日语能力考, N1备考, 真题数据, AI语法查询, 词汇考频, 错题分析, 薄弱点报告, 合格道",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "合格道 Gokaku",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "合格道 Gokaku | 最懂真题的 AI JLPT N1 备考工具",
    description: "基于 30 套真题数据，AI 帮你查语法、查词汇、分析错题。备考不用那么累。",
    url: "https://gokaku.vercel.app",
    siteName: "合格道 Gokaku",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "合格道 Gokaku - 最懂真题的 AI JLPT N1 备考工具",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "合格道 Gokaku | 最懂真题的 AI JLPT N1 备考工具",
    description: "基于 30 套真题数据，AI 帮你查语法、查词汇、分析错题",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#C75B3B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${bebasNeue.variable} ${dmSans.variable} ${notoSansJP.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="合格道" />
      </head>
      <body className="font-dm-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                      console.log('SW registered:', registration);
                    },
                    (error) => {
                      console.log('SW registration failed:', error);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
