import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TechMarquee } from "@/components/landing/TechMarquee";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { PortfolioMasonry } from "@/components/landing/PortfolioMasonry";
import { TeamSection } from "@/components/landing/TeamSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { FloatingCTA } from "@/components/landing/FloatingCTA";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { PublicService } from "@/services/public.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  let packagesData = [];
  let projectsData = [];

  try {
    const [packages, projects] = await Promise.all([
      PublicService.getPackages(),
      PublicService.getProjects(),
    ]);
    packagesData = packages?.data || [];
    projectsData = projects?.data || [];
  } catch (error) {
    console.error("Failed to fetch public data:", error);
  }

  return (
    <main className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-950 selection:text-white">
      <Navbar />
      <HeroSection />
      <div id="tech">
        <TechMarquee />
      </div>
      <div id="services">
        <FeaturesSection />
      </div>
      <div id="pricing">
        <PricingSection packages={packagesData} />
      </div>
      <ComparisonTable />
      <div id="workflow">
        <WorkflowSection />
      </div>
      <div id="portfolio">
        <PortfolioMasonry projects={projectsData} />
      </div>
      <div id="team">
        <TeamSection />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="faq">
        <FaqAccordion />
      </div>
      <FinalCta />
      <Footer />
      <FloatingCTA />
      <CustomCursor />
    </main>
  );
}
