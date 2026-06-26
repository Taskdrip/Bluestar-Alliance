import { useListTestimonials, getListTestimonialsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Quote } from "lucide-react";
import nurseAvatar from "@/assets/avatars/nurse.png";
import engineerAvatar from "@/assets/avatars/engineer.png";
import machinistAvatar from "@/assets/avatars/machinist.png";
import oilrigAvatar from "@/assets/avatars/oil-rig.png";
import electricianAvatar from "@/assets/avatars/electrician.png";

const AVATAR_MAP: Record<string, string> = {
  "Nurse": nurseAvatar,
  "Civil Engineer": engineerAvatar,
  "CNC Machinist": machinistAvatar,
  "Oil Rig Worker": oilrigAvatar,
  "Electrician": electricianAvatar,
};

export default function Testimonials() {
  const { data: testimonials, isLoading } = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() }
  });

  return (
    <div className="w-full bg-muted/20 pb-24">
      <div className="bg-primary py-20 text-center px-4 mb-16">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">Success Stories</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Discover how Bluestar Alliance has transformed careers globally over our 18+ year history of excellence.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-sm border-border shadow-sm">
                <CardContent className="p-8">
                  <Skeleton className="w-10 h-10 mb-6 rounded-full" />
                  <Skeleton className="w-full h-24 mb-6" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="w-24 h-4 mb-2" />
                      <Skeleton className="w-32 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials?.map((testimonial) => (
              <Card key={testimonial.id} className="rounded-sm border-border shadow-sm bg-card hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8">
                  <Quote className="w-10 h-10 text-primary/10 mb-6 rotate-180" />
                  <p className="text-foreground/80 leading-relaxed mb-8 italic min-h-[100px]">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                      <img 
                        src={AVATAR_MAP[testimonial.role] || testimonial.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=0D8ABC&color=fff`} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=0D8ABC&color=fff`;
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-primary">{testimonial.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                        {testimonial.role} &bull; {testimonial.country}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
