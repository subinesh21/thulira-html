import { CinematicHero } from "@/components/ui/cinematic-landing-hero";

export default function CinematicHeroDemo() {
  return (
    <div className="overflow-x-hidden w-[100%] min-h-screen">
      <CinematicHero 
        tagline1="A Sustainable Journey" 
        tagline2="Thulira"
        brandName="Thulira"
        cardHeading="Sustainability, redefined."
        cardDescription={<><span className="text-white font-semibold">Thulira</span> provides 100% food-safe, eco-friendly drinkware and essentials crafted from sustainable rice husk, coffee husk, and bamboo waste.</>}
        metricValue={20}
        metricLabel="Years Experience"
        ctaHeading="Shop Sustainably."
        ctaDescription="Join thousands of others making a positive impact. Switch to sustainable alternatives for your daily home essentials today."
      />
    </div>
  );
}
