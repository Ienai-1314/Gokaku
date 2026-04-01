"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ContentPreview } from "@/components/ContentPreview";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [activeLevel, setActiveLevel] = useState<"N1" | "N2">("N1");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeLevel={activeLevel} onLevelChange={setActiveLevel} />
      <main className="flex-1">
        <Hero activeLevel={activeLevel} />
        <ContentPreview activeLevel={activeLevel} />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
