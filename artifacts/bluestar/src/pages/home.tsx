import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldCheck, Globe2, Briefcase, Award, CheckCircle2, Star, HardHat, Building2, Zap, Anchor, Flame, Cog, UtensilsCrossed, ShoppingBag, TrendingUp, GraduationCap } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect } from "react";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";
import img1 from "@assets/WhatsApp_Image_2026-06-26_at_6.21.31_PM_(1)_1782495714036.jpeg";
import img2 from "@assets/WhatsApp_Image_2026-06-26_at_6.21.45_PM_1782495714036.jpeg";
import img3 from "@assets/WhatsApp_Image_2026-06-26_at_6.21.46_PM_1782495687081.jpeg";
import img4 from "@assets/WhatsApp_Image_2026-06-26_at_6.21.48_PM_1782495687081.jpeg";
import img5 from "@assets/WhatsApp_Image_2026-06-26_at_6.21.59_PM_1782495668018.jpeg";
import img6 from "@assets/WhatsApp_Image_2026-06-26_at_6.31.20_PM_(1)_1782495668017.jpeg";
import img7 from "@assets/WhatsApp_Image_2026-06-26_at_6.31.21_PM_(1)_1782495626564.jpeg";
import img8 from "@assets/WhatsApp_Image_2026-06-26_at_6.31.25_PM_1782495610349.jpeg";

const slides = [
  {
    image: hero1,
    title: "18+ Years of Building Global Careers",
    subtitle: "Partner with a long-established, globally trusted corporation for your next major role.",
  },
  {
    image: hero2,
    title: "Excellence in Industrial Recruitment",
    subtitle: "Connecting highly skilled professionals with the world's most demanding projects.",
  },
  {
    image: hero3,
    title: "Commanding Professional Confidence",
    subtitle: "Thousands of successful placements across multiple continents. Your future starts here.",
  }
];

const industries = [
  { name: "Mining", icon: HardHat },
  { name: "Construction", icon: Building2 },
  { name: "Electrical", icon: Zap },
  { name: "Maritime", icon: Anchor },
  { name: "Oil & Gas", icon: Flame },
  { name: "Heavy Machinery", icon: Cog },
  { name: "Hospitality", icon: UtensilsCrossed },
  { name: "Retail", icon: ShoppingBag },
  { name: "Marketing", icon: TrendingUp },
  { name: "Education", icon: GraduationCap },
];

const photoGallery = [img1, img2, img3, img4, img5, img6, img7, img8];

export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (emblaApi) {
      const autoplay = setInterval(() => {
        emblaApi.scrollNext();
      }, 5000);
      return () => clearInterval(autoplay);
    }
  }, [emblaApi]);

  return (
    <div className="w-full">
      {/* Hero Slider */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full w-full">
          {slides.map((slide, index) => (
            <div key={index} className="relative flex-[0_0_100%] h-full min-w-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 z-10" />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl leading-tight mb-6 drop-shadow-md">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-10 drop-shadow">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/apply">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto text-lg px-8 h-14">
                      Apply Now
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 w-full sm:w-auto text-lg px-8 h-14 bg-transparent">
                      View Job Openings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col items-center p-4">
              <ShieldCheck className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">18+</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Years Excellence</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Briefcase className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">4,000+</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Active Job Openings</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Globe2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">5</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Continents Served</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">94%</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Successful Employment Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Identity Banner */}
      <section className="py-10 bg-accent text-accent-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold tracking-wide">
            🌍 Specialised International Recruitment Agency &mdash; Connecting Skilled Professionals (Ages 21–55) with Global Employers Since 2006
          </p>
          <p className="text-sm mt-2 opacity-80">94% Successful Employment Rate &bull; Mining &bull; Construction &bull; Oil &amp; Gas &bull; Maritime &bull; Healthcare &bull; Hospitality &amp; More</p>
        </div>
      </section>

      {/* Candidate Support Banner */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-foreground/70 uppercase tracking-widest text-sm font-medium mb-4">WE PROVIDE THE FOLLOWING</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-10">Candidates Support Program</h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10">
            {[
              { label: "Visa Sponsorship", icon: "✅" },
              { label: "Flight Ticket", icon: "✅" },
              { label: "Work Permit", icon: "✅" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-sm">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-semibold text-lg tracking-wide">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-4">
            Apply with us today. <strong>Skilled and experienced only.</strong>
          </p>
          <p className="text-primary-foreground/70 text-sm max-w-xl mx-auto mb-8">
            Open to applicants aged <strong>21 to 55 years</strong>. All nationalities welcome. Our 94% placement success rate means your career change is in expert hands.
          </p>
          <Link href="/apply">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 h-14">
              Start Your Application
            </Button>
          </Link>
        </div>
      </section>

      {/* Hiring Now Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-4">🚨 Hiring Now</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-6">The Opportunity Is Real If You're Ready</h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Welcome to the next step with Bluestar Alliance Company Limited. Your skills stood out and we're looking for people who take ownership and deliver. Because we believe we grow by hiring people who are better than yesterday.
              </p>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Come ready to show us how you think, work, and win. Whether you join us now or later, keep building your edge. This is your chance to build something meaningful with us — let's make it count.
              </p>
              <div className="space-y-3 mb-8">
                {["Construction & Skilled Trades", "Healthcare & Nursing", "Oil & Gas Engineering", "Maritime & Offshore", "Hospitality & Management"].map(role => (
                  <div key={role} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-foreground">{role}</span>
                  </div>
                ))}
              </div>
              <Link href="/jobs">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14">
                  View All Openings
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[img1, img2, img3, img4].map((img, i) => (
                <div key={i} className="relative h-52 rounded-sm overflow-hidden shadow-lg">
                  <img src={img} alt="Team at work" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Flexible Deferred Option */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-4">Candidate Support Program</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-6">Flexible Deferred Option Available</h2>
              <p className="text-muted-foreground text-lg">
                Candidates Support for your Immigration & Employment Documents
              </p>
            </div>

            <div className="bg-white rounded-sm shadow-lg border border-border p-8 md:p-12">
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                We understand that obtaining all required employment and immigration documents can be difficult, time-consuming, and financially burdensome. To prevent these challenges from delaying your employment with us, we strongly recommend our <strong>FLEXIBLE DEFERRED OPTION</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  {
                    title: "Premium Processing",
                    desc: "All documents processed on priority basis and completed within 15 BUSINESS DAYS.",
                    icon: "⚡"
                  },
                  {
                    title: "Reduced Financial Burden",
                    desc: "Pay only an initial administrative amount. The company covers the rest with a 12-month installment plan.",
                    icon: "💰"
                  },
                  {
                    title: "Full Transparency",
                    desc: "All immigration documents issued directly in your name through official, verifiable channels.",
                    icon: "🔒"
                  },
                  {
                    title: "Dedicated HR Support",
                    desc: "Our HR team guides you personally through every step of the immigration and employment process.",
                    icon: "🤝"
                  }
                ].map(item => (
                  <div key={item.title} className="flex gap-4">
                    <span className="text-3xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-primary mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-sm p-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6 text-accent" />
                  <h4 className="font-bold text-primary text-lg">74+ Applicants Already Enrolled</h4>
                </div>
                <p className="text-muted-foreground">
                  Over 74 applicants have already chosen the Flexible Deferred Option and are progressing confidently toward their start dates with us.
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground mb-2">To apply or ask questions, contact our HR team:</p>
                <p className="font-semibold text-primary">bluestaralliancecompanyltd@gmail.com</p>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  — Sharon Healey MacKinnon, Human Resources Department, Bluestar Alliance Company Limited
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section Teaser */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-6">A Legacy of Global Industrial Excellence</h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Since our founding, Bluestar Alliance Company Limited has been the quiet force behind some of the world's most monumental industrial achievements. We provide the exceptional talent that powers global progress.
              </p>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                To meet the demand for construction and skilled trade workers globally, we're modernizing our workforce programs — focused on industry-driven training that turns job seekers into experts building an amazing future.
              </p>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5">
                  Learn About Our History
                </Button>
              </Link>
            </div>
            <div className="relative h-[500px] rounded-sm overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10" />
              <img src={img5} alt="Corporate Team" className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur p-6 rounded-sm shadow-lg z-20 border-l-4 border-accent">
                <p className="font-serif italic text-primary text-lg">
                  "Excellence is not an act, but a habit cultivated over decades of unwavering commitment to our professionals and clients."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-4">Real Stories</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">Success Stories From the Field</h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full" />
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Thousands of professionals have trusted Bluestar Alliance to transform their careers. Here's what some of them say.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                name: "James Mwangi", role: "Civil Engineer", country: "Kenya → Australia",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                quote: "Bluestar placed me with a major infrastructure consortium in Perth within six weeks. Three years on, I'm a senior site engineer leading a $240 million bridge project. This agency genuinely changed my life.",
              },
              {
                name: "Maria Santos", role: "Registered Nurse", country: "Philippines → UK",
                avatar: "https://randomuser.me/api/portraits/women/45.jpg",
                quote: "Bluestar's healthcare division matched me with an NHS trust in Manchester. They arranged my NMC registration support and relocation. I'm now a charge nurse in the ICU earning four times my previous salary.",
              },
              {
                name: "Roberto Delgado", role: "Offshore Drilling Supervisor", country: "Mexico → Norway",
                avatar: "https://randomuser.me/api/portraits/men/22.jpg",
                quote: "Bluestar's oil and gas team knew exactly which operators were hiring, coached me on the interviews, and had me on a rig in the North Sea within four months. I couldn't be happier.",
              },
            ].map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-xl p-7 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}
                </div>
                <p className="text-foreground/75 italic leading-relaxed mb-6 text-sm">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover object-top flex-shrink-0 border-2 border-border"
                  />
                  <div>
                    <p className="font-serif font-bold text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.role} &bull; {t.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 px-10">
              <a href="/testimonials">Read All Success Stories</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-primary text-center mb-10">Our Work Around the World</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {photoGallery.map((img, i) => (
              <div key={i} className="relative h-48 md:h-64 rounded-sm overflow-hidden shadow-md group">
                <img
                  src={img}
                  alt={`Bluestar Alliance work ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="relative py-28 overflow-hidden">
        {/* Dark background image */}
        <img
          src={hero2}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        {/* Deep gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-4">What We Cover</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">Industries We Serve</h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full" />
            <p className="text-white/75 max-w-2xl mx-auto text-lg leading-relaxed">
              Specialized recruitment across critical global sectors. Our expertise ensures you're matched with opportunities that demand your caliber.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {industries.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <div
                  key={i}
                  className="group flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-accent/20 hover:border-accent/50 transition-all duration-300 cursor-default"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="font-semibold text-white text-sm tracking-wide text-center leading-snug">{ind.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
