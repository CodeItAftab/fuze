import { AnnouncementBanner } from "@/components/landing/AnnouncementBanner";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { DriveMockup } from "@/components/landing/DriveMockup";
import { StorageCalculator } from "@/components/landing/StorageCalculator";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { OpenSourceSection } from "@/components/landing/OpenSourceSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FaqSection, FAQ_ITEMS } from "@/components/landing/FaqSection";
import { BottomCtaSection } from "@/components/landing/BottomCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Fuze Drive",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      url: "https://fuzedrive.tech",
      author: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      creator: {
        "@type": "Person",
        name: "Aftab Alam",
        url: "https://aftabalam.me",
      },
      sameAs: "https://github.com/CodeItAftab/fuze",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
