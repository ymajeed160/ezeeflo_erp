import React from 'react';
import Navbar from '../components/Landing/Navbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import ModulesSection from '../components/Landing/ModulesSection';
import RoadmapSection from '../components/Landing/RoadmapSection';
import ProductTourSection from '../components/Landing/ProductTourSection';
import ScreenshotsSection from '../components/Landing/ScreenshotsSection';
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
      <ProductTourSection />
      <ScreenshotsSection />
      <StatsSection />
      <FAQ />
      <CTA />
      <DemoRequestSection />
      <Footer />
    </>
  );
};

export default LandingPage;
