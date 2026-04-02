import type { Metadata } from "next";
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
  title: "量化 N1 · 合格道 Gokaku | 基于59套真题数据的考点预测系统",
  description: "像量化股票一样分析 JLPT 真题。基于59套真题数据建立考点频率模型和轮空周期预测。2026年7月考前必看。",
  keywords: "JLPT, N1, N2, 日语能力考, 量化N1, 真题统计, 押题预测, 高频词汇",
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
