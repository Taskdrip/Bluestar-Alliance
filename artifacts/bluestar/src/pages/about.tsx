import aboutHq from "@/assets/about-hq.png";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2, Globe2, Target, History, ShieldCheck,
  Users, TrendingUp, Award, MapPin, Briefcase, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const milestones = [
  { year: "2006", title: "Founded", desc: "Bluestar Alliance Company Limited established in Michigan, USA, with a founding team of specialist recruiters in industrial and maritime sectors." },
  { year: "2009", title: "First 500 Placements", desc: "Reached 500 successful international placements across the Middle East and Southeast Asia, cementing our reputation for reliability." },
  { year: "2012", title: "Australia Office Opens", desc: "Strategic expansion into Perth, Western Australia to serve the booming Pilbara mining and LNG sectors." },
  { year: "2015", title: "Healthcare Division Launched", desc: "Dedicated medical staffing division established to address global nursing and allied health shortages, beginning with UK NHS partnerships." },
  { year: "2018", title: "2,000+ Active Placements", desc: "Surpassed 2,000 active international placements simultaneously across five continents for the first time." },
  { year: "2021", title: "Digital Platform", desc: "Launched integrated online application and candidate tracking platform, accelerating placement timelines by 40%." },
  { year: "2024", title: "18+ Years & Growing", desc: "Over 4,000 successful placements on record. Recognised as a top-tier international recruitment partner by major industry associations." },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Uncompromising Integrity",
    desc: "Every candidate presented has cleared a rigorous, multi-tier vetting process. We stake our 18-year reputation on every referral.",
  },
  {
    icon: Globe2,
    title: "Global Reach",
    desc: "With operational teams across North America, Australia, the Middle East, and Asia, we navigate international logistics seamlessly.",
  },
  {
    icon: Heart,
    title: "Candidate-First",
    desc: "We advocate for fair contracts, transparent fees, and genuine welfare — because placed professionals who thrive become our best advocates.",
  },
  {
    icon: Target,
    title: "Precision Matching",
    desc: "We read every CV. Our sector-specialist consultants match technical competency, cultural fit, and career trajectory — not just keywords.",
  },
  {
    icon: TrendingUp,
    title: "Long-Term Partnership",
    desc: "We don't disappear after placement. Dedicated account managers support both client and candidate throughout the contract and beyond.",
  },
  {
    icon: Award,
    title: "Industry Authority",
    desc: "18+ years of sector depth means our consultants understand your discipline — from NORSOK standards to STCW certification requirements.",
  },
];

const offices = [
  {
    city: "Michigan, USA",
    role: "Global Headquarters",
    address: "150, West Jefferson Avenue, Detroit, Michigan 48201, United States",
    focus: "Corporate governance, North & South America recruitment, finance",
  },
  {
    city: "Perth, Australia",
    role: "Asia-Pacific Operations",
    address: "Level 12, St Georges Terrace, Perth WA 6000, Australia",
    focus: "Mining, LNG, engineering — Australasia & Southeast Asia",
  },
  {
    city: "Sydney, Australia",
    role: "Australia East Coast Branch",
    address: "Suite 18.01, 1 Market Street, Sydney NSW 2000, Australia",
    focus: "Engineering, healthcare, logistics — East Australia & New Zealand",
  },
  {
    city: "Dubai, UAE",
    role: "Middle East Hub",
    address: "Suite 801, Business Bay Tower, Dubai, UAE",
    focus: "Oil & gas, construction, hospitality — GCC & North Africa",
  },
];

const leadershipStats = [
  { value: "18+", label: "Years in Operation" },
  { value: "4,000+", label: "Professionals Placed" },
  { value: "50+", label: "Countries of Origin" },
  { value: "94%", label: "Placement Success Rate" },
  { value: "3", label: "Global Offices" },
  { value: "5", label: "Continents Served" },
];

export default function About() {
  return (
    <div className="w-full pb-24">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
        <img src={aboutHq} alt="Bluestar Alliance Headquarters" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/60 to-primary/90" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-4">About Us</span>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Our Legacy of Excellence</h1>
            <p className="text-xl text-white/85 max-w-2xl mx-auto">
              Nearly two decades of bridging exceptional global talent with world-class industrial and corporate opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-accent text-accent-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
            {leadershipStats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl md:text-3xl font-bold font-serif">{value}</div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">

        {/* History & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-24 mb-24">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <History className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary">Our Journey</h2>
            </div>
            <div className="space-y-5 text-foreground/75 leading-relaxed text-base">
              <p>
                Founded in 2006 with a singular vision — to elevate the standard of international industrial recruitment — Bluestar Alliance Company Limited began by placing technical specialists into demanding localized projects. Within three years we had earned a reputation for reliability that no competitor could match.
              </p>
              <p>
                Today our global footprint spans five continents. We are the trusted partner for Fortune 500 corporations, major infrastructure consortiums, NHS trusts, and premier maritime operators who demand absolute reliability in their international workforce.
              </p>
              <p>
                Eighteen-plus years of excellence is not a tagline. It is a proven track record built on stringent vetting, uncompromising ethical standards, and a deep, specialist understanding of every industry we serve — from NORSOK-regulated offshore platforms to Joint Commission-accredited hospital systems.
              </p>
              <p>
                Our consultants are sector specialists, not generalists. Many hold engineering, nursing, or maritime qualifications themselves. When we assess a candidate, we understand the role from the inside.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground rounded-xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <Target className="w-6 h-6 text-accent" />
                  <h3 className="font-serif text-xl font-bold text-white">Our Mission</h3>
                </div>
                <p className="text-primary-foreground/85 leading-relaxed">
                  To meticulously source, vet, and deploy premier professional talent across the globe — ensuring the success of complex industrial and corporate initiatives while advancing the careers of exceptional individuals.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <Globe2 className="w-6 h-6 text-primary" />
                <h3 className="font-serif text-xl font-bold text-primary">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To remain the world's most trusted recruitment authority in the sectors that build, power, and sustain the modern world — universally recognised for integrity, precision, and longevity.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <h3 className="font-serif text-xl font-bold text-primary">What Sets Us Apart</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "End-to-end documentation support: visa, work permit, relocation",
                  "Sector-specialist consultants — not generalist recruiters",
                  "Average placement timeline under 8 weeks from first contact",
                  "Active aftercare for all placed candidates throughout contract",
                  "Transparent, no-surprise fee structures for candidates",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-24">
          <div className="text-center mb-14">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-3">What We Stand For</span>
            <h2 className="font-serif text-4xl font-bold text-primary">The Pillars of Our Trust</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="rounded-xl border-border bg-card hover:shadow-md transition-shadow group">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-accent/15 transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-serif text-lg font-bold mb-3 text-primary">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-24">
          <div className="text-center mb-14">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-3">Our History</span>
            <h2 className="font-serif text-4xl font-bold text-primary">18 Years in the Making</h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={m.year} className={`relative md:grid md:grid-cols-2 md:gap-16 items-center ${i % 2 === 0 ? "" : "md:direction-rtl"}`}>
                  <div className={`${i % 2 === 0 ? "md:text-right" : "md:col-start-2"}`}>
                    <div className={`bg-card border border-border rounded-xl p-6 shadow-sm ${i % 2 !== 0 ? "md:col-start-2" : ""}`}>
                      <div className="inline-block bg-accent text-accent-foreground font-bold text-sm px-3 py-1 rounded-full mb-3">{m.year}</div>
                      <h3 className="font-serif font-bold text-primary text-lg mb-2">{m.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent border-4 border-background shadow-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Offices */}
        <div className="mb-24">
          <div className="text-center mb-14">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-3">Where We Operate</span>
            <h2 className="font-serif text-4xl font-bold text-primary">Our Global Offices</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offices.map((o) => (
              <Card key={o.city} className="rounded-xl border-border">
                <CardContent className="p-8">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-primary mb-1">{o.city}</h3>
                  <p className="text-accent text-sm font-semibold mb-3">{o.role}</p>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{o.address}</p>
                  <p className="text-xs text-muted-foreground border-t border-border pt-4 leading-relaxed italic">{o.focus}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="relative py-28 w-full overflow-hidden">
        <img src={hero2} alt="Industrial site" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Build Your Global Career With Bluestar
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
              Join the 4,000+ professionals who have trusted Bluestar Alliance to place them in the roles that define their careers. Browse live opportunities or talk to one of our specialist consultants today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 h-12">
                <a href="/jobs">View Current Opportunities</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-base px-8 h-12">
                <a href="/contact">Talk to a Consultant</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
