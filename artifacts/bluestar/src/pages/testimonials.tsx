import { useListTestimonials, getListTestimonialsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Quote, Star, Globe2, Users, Award, TrendingUp } from "lucide-react";

// Local portrait imports — used by name key so seeded data gets real photos
import imgJamesMwangi from "@/assets/avatars/james-mwangi.jpg";
import imgMariaSantos from "@/assets/avatars/maria-santos.jpg";
import imgAleksandrPetrenko from "@/assets/avatars/aleksandr-petrenko.jpg";
import imgFatimaAlRashidi from "@/assets/avatars/fatima-al-rashidi.jpg";
import imgKwekuAsante from "@/assets/avatars/kweku-asante.jpg";
import imgNguyenThiLan from "@/assets/avatars/nguyen-thi-lan.jpg";
import imgRobertoDelgado from "@/assets/avatars/roberto-delgado.jpg";
import imgPriyaKrishnaswamy from "@/assets/avatars/priya-krishnaswamy.jpg";
import imgThomasOseiBonsu from "@/assets/avatars/thomas-osei-bonsu.jpg";
import imgElenaMarchetti from "@/assets/avatars/elena-marchetti.jpg";
import imgSamuelChirwa from "@/assets/avatars/samuel-chirwa.jpg";
import imgAikoTanaka from "@/assets/avatars/aiko-tanaka.jpg";

const avatarMap: Record<string, string> = {
  "James Mwangi": imgJamesMwangi,
  "Maria Santos": imgMariaSantos,
  "Aleksandr Petrenko": imgAleksandrPetrenko,
  "Fatima Al-Rashidi": imgFatimaAlRashidi,
  "Kweku Asante": imgKwekuAsante,
  "Nguyen Thi Lan": imgNguyenThiLan,
  "Roberto Delgado": imgRobertoDelgado,
  "Priya Krishnaswamy": imgPriyaKrishnaswamy,
  "Thomas Osei-Bonsu": imgThomasOseiBonsu,
  "Elena Marchetti": imgElenaMarchetti,
  "Samuel Chirwa": imgSamuelChirwa,
  "Aiko Tanaka": imgAikoTanaka,
};

const stats = [
  { icon: Users, value: "4,000+", label: "Professionals Placed" },
  { icon: Globe2, value: "5", label: "Continents Served" },
  { icon: Award, value: "18+", label: "Years of Excellence" },
  { icon: TrendingUp, value: "94%", label: "Placement Success Rate" },
];

function StarRow() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { data: testimonials, isLoading } = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });

  const featured = testimonials?.[0];
  const rest = testimonials?.slice(1) ?? [];

  return (
    <div className="w-full pb-24">
      {/* Hero */}
      <div className="bg-primary py-24 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative container mx-auto max-w-4xl">
          <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-4">Real People. Real Results.</span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6">
            Success Stories
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Over 18 years, Bluestar Alliance has placed thousands of professionals in life-changing roles across six continents. These are their stories.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-accent text-accent-foreground py-6 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 mb-1 opacity-80" />
                <span className="text-2xl font-bold font-serif">{value}</span>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-16">

        {/* Featured Testimonial */}
        {isLoading ? (
          <div className="mb-16 rounded-2xl bg-primary/5 border border-primary/10 p-10">
            <Skeleton className="w-full h-48" />
          </div>
        ) : featured ? (
          <div className="mb-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white p-10 md:p-14 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <Quote className="w-14 h-14 text-accent/60 mb-6 rotate-180" />
              <blockquote className="text-xl md:text-2xl leading-relaxed font-light mb-8 max-w-4xl">
                "{featured.quote}"
              </blockquote>
              <div className="flex items-center gap-5">
                <img
                  src={avatarMap[featured.name] ?? featured.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(featured.name)}&background=fff&color=1e3a8a&size=128`}
                  alt={featured.name}
                  className="w-20 h-20 rounded-full border-2 border-accent object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(featured.name)}&background=fff&color=1e3a8a&size=128`;
                  }}
                />
                <div>
                  <StarRow />
                  <p className="font-serif font-bold text-lg mt-1">{featured.name}</p>
                  <p className="text-white/70 text-sm mt-0.5">{featured.role} &bull; {featured.country}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="rounded-xl border-border shadow-sm">
                <CardContent className="p-8">
                  <Skeleton className="w-10 h-10 mb-6 rounded-full" />
                  <Skeleton className="w-full h-28 mb-6 rounded" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="w-3/4 h-4 mb-2 rounded" />
                      <Skeleton className="w-full h-3 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((t) => (
              <Card
                key={t.id}
                className="rounded-xl border-border shadow-sm bg-card hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="mb-4">
                    <StarRow />
                  </div>
                  <Quote className="w-8 h-8 text-primary/10 mb-4" />
                  <p className="text-foreground/75 leading-relaxed italic flex-1 mb-6">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <img
                      src={avatarMap[t.name] ?? t.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1e3a8a&color=fff&size=128`}
                      alt={t.name}
                      className="w-12 h-12 rounded-full border-2 border-border object-cover object-top flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1e3a8a&color=fff&size=128`;
                      }}
                    />
                    <div>
                      <p className="font-serif font-bold text-primary text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                        {t.role} &bull; {t.country}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!testimonials || testimonials.length === 0) && (
          <div className="text-center py-24 text-muted-foreground">
            <Quote className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Success stories coming soon.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-muted/50 border border-border px-8 py-12 text-center">
          <h2 className="font-serif text-3xl font-bold text-primary mb-4">Ready to Write Your Own Story?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of professionals who have transformed their careers with Bluestar Alliance. Browse live opportunities or submit your application today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <a href="/jobs">Browse Open Roles</a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/apply">Apply Now</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
