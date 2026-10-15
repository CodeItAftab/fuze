import { AnnouncementBanner } from "@/components/landing/AnnouncementBanner";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { DriveMockup } from "@/components/landing/DriveMockup";
import { StorageCalculator } from "@/components/landing/StorageCalculator";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { OpenSourceSection } from "@/components/landing/OpenSourceSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { BottomCtaSection } from "@/components/landing/BottomCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <AnnouncementBanner />
      <LandingNavbar />
      <HeroSection />
      <DriveMockup />
      <StorageCalculator />
      <ArchitectureSection />
      <OpenSourceSection />
      <AboutSection />
      <ComparisonSection />
      <FaqSection />
      <BottomCtaSection />
      <LandingFooter />
    </div>
  );
}
