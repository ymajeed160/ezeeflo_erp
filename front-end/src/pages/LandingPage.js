import React from 'react';
import Navbar from '../components/Landing/Navbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import ModulesSection from '../components/Landing/ModulesSection';
import RoadmapSection from '../components/Landing/RoadmapSection';
import HRPayrollFeaturesSection from '../components/Landing/HRPayrollFeaturesSection';
import LoyaltyFeaturesSection from '../components/Landing/LoyaltyFeaturesSection';
import StatsSection from '../components/Landing/StatsSection';
import FAQ from '../components/Landing/FAQ';
import CTA from '../components/Landing/CTA';
import DemoRequestSection from '../components/Landing/DemoRequestSection';
import Footer from '../components/Landing/Footer';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ModulesSection />
      <RoadmapSection />
      <HRPayrollFeaturesSection />
      <LoyaltyFeaturesSection />
      <StatsSection />
      <FAQ />
      <CTA />
      <DemoRequestSection />
      <Footer />
    </>
  );
};

export default LandingPage;
