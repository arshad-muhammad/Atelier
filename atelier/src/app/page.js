import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import StatsGrid from "../components/StatsGrid";
import CompanyLogos from "../components/CompanyLogos";
import Impact from "../components/Impact";
import Courses from "../components/Courses";
import Testimonials from "../components/Testimonials";
import Community from "../components/Community";
import Comparison from "../components/Comparison";
import SphereHive from "../components/SphereHive";
import Faq from "../components/Faq";
import TransformCTA from "../components/TransformCTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsGrid />
        <CompanyLogos />
        <Impact />
        <Courses />
        <Testimonials />
        <Comparison />
        <SphereHive />
        <Community />
        <Faq />
        <TransformCTA />
      </main>
      <Footer />
    </>
  );
}
