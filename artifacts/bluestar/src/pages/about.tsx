import aboutHq from "@/assets/about-hq.png";
import hero1 from "@/assets/hero-1.png";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Globe2, Target, History } from "lucide-react";

export default function About() {
  return (
    <div className="w-full pb-24">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] w-full">
        <img src={aboutHq} alt="Bluestar Headquarters" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6">Our Legacy of Excellence</h1>
            <p className="text-xl text-white/90">Over 18 years of bridging global talent with world-class opportunities.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-24">
        {/* History & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <div>
            <div className="flex items-center gap-3 mb-6 text-accent">
              <History className="w-6 h-6" />
              <h2 className="font-serif text-3xl font-bold text-primary">Our Journey</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed text-lg">
              <p>
                Founded nearly two decades ago, Bluestar Alliance Company Limited began with a singular vision: to elevate the standard of international industrial recruitment. From our early days placing technical specialists in localized projects, we have grown into a multinational powerhouse.
              </p>
              <p>
                Today, our global footprint spans five continents. We are the trusted partners for Fortune 500 companies, massive infrastructure consortiums, and premier maritime operations who demand nothing less than absolute reliability in their workforce.
              </p>
              <p>
                18+ years of excellence isn't just a tagline—it is a proven track record built on stringent vetting, uncompromising ethical standards, and a deep understanding of the industries we serve.
              </p>
            </div>
          </div>
          
          <div className="bg-card border border-border p-10 rounded-sm shadow-sm relative">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/10 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 text-accent">
                <Target className="w-6 h-6" />
                <h2 className="font-serif text-3xl font-bold text-primary">Mission & Vision</h2>
              </div>
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-foreground mb-3 text-xl">Our Mission</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To meticulously source, vet, and deploy premier professional talent across the globe, ensuring the success of complex industrial and corporate initiatives while advancing the careers of exceptional individuals.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-3 text-xl">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To remain the world's most trusted recruitment authority in the sectors that build, power, and sustain the modern world—recognized universally for integrity, precision, and longevity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-primary">The Pillars of Our Trust</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="rounded-sm border-border bg-card">
              <CardContent className="p-8 text-center">
                <ShieldIcon className="w-12 h-12 text-primary mx-auto mb-6" />
                <h3 className="font-serif text-xl font-bold mb-4 text-primary">Uncompromising Integrity</h3>
                <p className="text-muted-foreground">Every candidate presented has passed rigorous, multi-tier background and competency evaluations.</p>
              </CardContent>
            </Card>
            <Card className="rounded-sm border-border bg-card">
              <CardContent className="p-8 text-center">
                <Globe2 className="w-12 h-12 text-primary mx-auto mb-6" />
                <h3 className="font-serif text-xl font-bold mb-4 text-primary">Global Perspective</h3>
                <p className="text-muted-foreground">With teams spanning multiple time zones, we navigate international placement logistics flawlessly.</p>
              </CardContent>
            </Card>
            <Card className="rounded-sm border-border bg-card">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-6" />
                <h3 className="font-serif text-xl font-bold mb-4 text-primary">Enduring Commitment</h3>
                <p className="text-muted-foreground">We don't just fill vacancies; we forge long-term strategic partnerships with clients and candidates alike.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Banner */}
      <div className="relative py-24 w-full">
        <img src={hero1} alt="Industrial Background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/90 mix-blend-multiply" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-6">Build Your Future With Us</h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Join the thousands of professionals who have trusted Bluestar Alliance with their global career trajectory.
          </p>
          <a href="/jobs" className="inline-block bg-accent text-accent-foreground font-medium px-8 py-4 rounded-sm hover:bg-accent/90 transition-colors text-lg">
            View Current Opportunities
          </a>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
