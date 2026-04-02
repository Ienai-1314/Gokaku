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
  title: "合格道 Gokaku | JLPT N1/N2 真题统计备考资料库",
  description: "基于59套真题数据人工整理统计，精准定位高频考点。2026年7月 JLPT 考前必看资料，含押题预测 + 高频词汇表。",
  keywords: "JLPT, N1, N2, 日语能力考, 真题统计, 押题预测, 高频词汇",
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
