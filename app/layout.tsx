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
  title: "合格道 Gokaku | 基于18套完整真题的JLPT N1备考资料",
  description: "基于18套含题目+听力+解析的完整N1真题逐题统计，提供语法频率分析、参考押题预测、AI语法查询工具。2026年7月考前必看。",
  keywords: "JLPT, N1, N2, 日语能力考, 量化N1, 真题统计, 押题预测, 高频词汇",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "合格道",
  },
  icons: {
    apple: "/icons/icon-192.png",
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
      <body className="font-dm-sans antialiased">{children}</body>
    </html>
  );
}
