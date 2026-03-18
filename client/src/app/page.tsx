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
    const [packagesResult, projectsResult] = await Promise.allSettled([
      PublicService.getPackages(),
      PublicService.getProjects(),
    ]);

    if (packagesResult.status === "fulfilled") {
      packagesData = packagesResult.value?.data || [];
    } else {
      console.error("Partial Failure: Failed to fetch packages data:", packagesResult.reason);
    }

    if (projectsResult.status === "fulfilled") {
      projectsData = projectsResult.value?.data || [];
    } else {
      console.error("Partial Failure: Failed to fetch projects data:", projectsResult.reason);
    }
  } catch (error) {
    console.error("Unexpected global error during data fetching:", error);
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
        <Testimonials projects={projectsData} />
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
