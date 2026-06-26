import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldCheck, Globe2, Briefcase, Award } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect } from "react";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";

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
  "Mining", "Construction", "Electrical", "Maritime", "Oil & Gas", 
  "Heavy Machinery", "Hospitality", "Retail", "Marketing", "Education"
];

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
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">10k+</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Global Placements</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Globe2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">5</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Continents Served</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-serif text-3xl font-bold text-primary mb-2">100%</h3>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Client Satisfaction</p>
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
                Whether you're stepping onto an offshore rig, managing a multinational retail operation, or engineering the infrastructure of tomorrow, we are your trusted partner in career advancement.
              </p>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5">
                  Learn About Our History
                </Button>
              </Link>
            </div>
            <div className="relative h-[500px] rounded-sm overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10" />
              <img src={hero3} alt="Corporate Team" className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur p-6 rounded-sm shadow-lg z-20 border-l-4 border-accent">
                <p className="font-serif italic text-primary text-lg">
                  "Excellence is not an act, but a habit cultivated over decades of unwavering commitment to our professionals and clients."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-white">Industries We Serve</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
              Specialized recruitment across critical global sectors. Our expertise ensures you're matched with opportunities that demand your caliber.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            {industries.map((ind, i) => (
              <div key={i} className="bg-primary-foreground/5 border border-primary-foreground/10 p-6 flex items-center justify-center text-center rounded-sm hover:bg-primary-foreground/10 transition-colors">
                <span className="font-medium text-white tracking-wide">{ind}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
