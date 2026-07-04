import { Button } from "@/components/ui/button";
import { Home, Briefcase, Phone } from "lucide-react";
import logo from "@assets/24877df6-f2ec-4847-9055-916197331b0f_1783163476454.png";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center bg-muted/20 px-4">
      <div className="text-center max-w-lg">
        <a href="/">
          <div className="bg-white rounded-lg px-4 py-2 inline-block mb-10 shadow-sm border border-border">
            <img src={logo} alt="Bluestar Alliance" className="h-10 w-auto" />
          </div>
        </a>

        <div className="relative mb-8">
          <span className="text-[9rem] md:text-[12rem] font-serif font-bold text-primary/8 leading-none select-none block">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">Page Not Found</h1>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mb-10 leading-relaxed">
          Try navigating back to our homepage, browsing our open roles, or getting in touch with our team.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2">
            <a href="/">
              <Home className="w-4 h-4" />
              Back to Home
            </a>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href="/jobs">
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </a>
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <a href="/contact">
              <Phone className="w-4 h-4" />
              Contact Us
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
