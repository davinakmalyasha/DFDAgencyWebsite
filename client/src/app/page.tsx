import dynamic from "next/dynamic";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TechMarquee } from "@/components/landing/TechMarquee";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { Footer } from "@/components/landing/Footer";
import { PublicService } from "@/services/public.service";

// Lazy load heavy components below the fold
const WorkflowSection = dynamic(() => import("@/components/landing/WorkflowSection").then(m => m.WorkflowSection));
const PortfolioMasonry = dynamic(() => import("@/components/landing/PortfolioMasonry").then(m => m.PortfolioMasonry));
const TeamSection = dynamic(() => import("@/components/landing/TeamSection").then(m => m.TeamSection));
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then(m => m.Testimonials));
const FaqAccordion = dynamic(() => import("@/components/landing/FaqAccordion").then(m => m.FaqAccordion));
const FinalCta = dynamic(() => import("@/components/landing/FinalCta").then(m => m.FinalCta));
const FloatingCTA = dynamic(() => import("@/components/landing/FloatingCTA").then(m => m.FloatingCTA));
const CustomCursor = dynamic(() => import("@/components/landing/CustomCursor").then(m => m.CustomCursor));

export const revalidate = 3600; // Refresh data every hour (ISR)

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
