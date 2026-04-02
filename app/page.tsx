"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ToolShowcase } from "@/components/ToolShowcase";
import { BlessingWidget } from "@/components/BlessingWidget";
import { ResourcePack } from "@/components/ResourcePack";
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
        <ToolShowcase />
        <BlessingWidget />
        <ResourcePack />
        <ContentPreview activeLevel={activeLevel} />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}

