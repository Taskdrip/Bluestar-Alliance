import { Mail, MapPin, Phone } from "lucide-react";
import contactOffice from "@/assets/contact-office.png";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <div className="w-full pb-24">
      {/* Hero */}
      <div className="relative h-[40vh] min-h-[300px] w-full">
        <img src={contactOffice} alt="Corporate Reception" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-5xl font-bold text-white mb-4">Contact Our Offices</h1>
            <p className="text-lg text-white/90">Connect with our global recruitment teams.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h3 className="font-serif text-2xl font-bold text-primary mb-6">Global Presence</h3>
              <p className="text-muted-foreground mb-8">
                With corporate offices strategically located, we manage recruitment logistics seamlessly across borders. Reach out to the office nearest to your region.
              </p>
            </div>

            <Card className="rounded-sm border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-3 rounded-full h-fit">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">United States Headquarters</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      100 Corporate Center Drive<br />
                      Suite 400<br />
                      Michigan, MI 48000<br />
                      USA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-3 rounded-full h-fit">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Australia Operations</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      St Georges Terrace<br />
                      Level 12<br />
                      Perth, WA 6000<br />
                      Australia
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>+1 (800) 555-BLUE</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span>inquiries@bluestaralliance.com</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-sm border-border shadow-md">
              <CardContent className="p-8 md:p-12">
                <h2 className="font-serif text-3xl font-bold text-primary mb-8">Send an Inquiry</h2>
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully.'); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input placeholder="John Doe" className="bg-background" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input type="email" placeholder="john@example.com" className="bg-background" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="How can we help?" className="bg-background" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea 
                      placeholder="Please provide details about your inquiry..." 
                      className="min-h-[200px] bg-background" 
                      required 
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full md:w-auto px-10">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
