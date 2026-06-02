import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Templates } from "@/components/site/Templates";
import { Demo } from "@/components/site/Demo";
import { Pricing } from "@/components/site/Pricing";
import { Testimonials } from "@/components/site/Testimonials";
import { Faq } from "@/components/site/Faq";
import { CtaBanner } from "@/components/site/CtaBanner";
import { Footer } from "@/components/site/Footer";

export function LegacyHome() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Templates />
        <Demo />
        <Pricing />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
