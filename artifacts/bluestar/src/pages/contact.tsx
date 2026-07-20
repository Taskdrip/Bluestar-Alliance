import { Mail, MapPin, Phone, Clock, Facebook, Send } from "lucide-react";
import contactOffice from "@/assets/contact-office.png";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const offices = [
  {
    city: "Michigan, USA",
    badge: "Global Headquarters",
    address: "150, West Jefferson Avenue\nDetroit, Michigan 48201\nUnited States",
    phone: "+1 (800) 555-BLUE",
    email: "info@bluestaralliance.site",
    hours: "Mon – Fri: 8:00 am – 6:00 pm EST",
    focus: "Corporate governance, North & South America recruitment",
  },
  {
    city: "Perth, Australia",
    badge: "Asia-Pacific Operations",
    address: "Level 12, St Georges Terrace\nPerth WA 6000\nAustralia",
    phone: "+61 (8) 9000 0000",
    email: "info@bluestaralliance.site",
    hours: "Mon – Fri: 8:00 am – 5:30 pm AWST",
    focus: "Mining, LNG, engineering — Australasia & Southeast Asia",
  },
  {
    city: "Sydney, Australia",
    badge: "Australia East Coast Branch",
    address: "Suite 18.01, 1 Market Street\nSydney NSW 2000\nAustralia",
    phone: "+61 (2) 8000 0000",
    email: "info@bluestaralliance.site",
    hours: "Mon – Fri: 8:00 am – 5:30 pm AEST",
    focus: "Engineering, healthcare, logistics — East Australia & New Zealand",
  },
  {
    city: "Dubai, UAE",
    badge: "Middle East Hub",
    address: "Suite 801, Business Bay Tower\nDubai, UAE",
    phone: "+971 4 000 0000",
    email: "info@bluestaralliance.site",
    hours: "Sun – Thu: 8:00 am – 5:00 pm GST",
    focus: "Oil & gas, construction, hospitality — GCC & North Africa",
  },
];

const inquiryTypes = [
  "General Enquiry",
  "Job Seeker — I'm looking for work",
  "Employer — I'm looking to hire",
  "Visa / Work Permit Support",
  "Application Status",
  "Partnership Enquiry",
  "Media / Press",
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full pb-24">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden">
        <img src={contactOffice} alt="Bluestar Alliance Corporate Office" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/55 to-primary/85" />
        <div className="absolute inset-0 flex items-end pb-14 justify-center text-center px-4">
          <div className="max-w-2xl">
            <span className="inline-block text-accent font-semibold tracking-widest uppercase text-sm mb-3">Get in Touch</span>
            <h1 className="font-serif text-5xl font-bold text-white mb-3">Contact Our Offices</h1>
            <p className="text-lg text-white/85">Our specialist consultants are ready to help — whether you're seeking a role or building a team.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-16">

        {/* Offices */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-primary mb-2">Our Global Offices</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Reach out directly to the office closest to your region or use the contact form below.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offices.map((o) => (
              <Card key={o.city} className="rounded-xl border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-accent uppercase tracking-widest">{o.badge}</span>
                    <h3 className="font-serif font-bold text-xl text-primary mt-1">{o.city}</h3>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span className="whitespace-pre-line leading-relaxed">{o.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                      <a href={`tel:${o.phone}`} className="hover:text-primary transition-colors">{o.phone}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                      <a href={`mailto:${o.email}`} className="hover:text-primary transition-colors">{o.email}</a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{o.hours}</span>
                    </div>
                    <div className="pt-3 border-t border-border text-xs italic">{o.focus}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Sidebar */}
          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-2xl font-bold text-primary mb-3">General Enquiries</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                For enquiries not specific to a regional office, our central team responds within one business day.
              </p>
              <div className="space-y-3">
                <a href="mailto:info@bluestaralliance.site" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                  info@bluestaralliance.site
                </a>
                <a href="tel:+18005550000" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                  +1 (800) 555-BLUE
                </a>
                <a
                  href="https://www.facebook.com/share/1H4b18diUW/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="w-5 h-5 text-primary" />
                  Follow us on Facebook
                </a>
              </div>
            </div>

            <Card className="rounded-xl border-border bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h4 className="font-serif font-bold text-lg mb-2">Looking for Work?</h4>
                <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4">
                  Skip the form — browse our live vacancies and apply directly. Our consultants review every application personally.
                </p>
                <a href="/jobs" className="inline-block bg-accent text-accent-foreground font-semibold text-sm px-5 py-2.5 rounded-sm hover:bg-accent/90 transition-colors">
                  Browse Open Roles →
                </a>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border">
              <CardContent className="p-6">
                <h4 className="font-serif font-bold text-primary text-lg mb-2">Hiring a Team?</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Tell us your requirements and a senior consultant will reach out to discuss a tailored recruitment strategy within 24 hours.
                </p>
                <a href="mailto:info@bluestaralliance.site" className="inline-block bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-sm hover:bg-primary/90 transition-colors">
                  Employer Enquiry →
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-xl border-border shadow-md">
              <CardContent className="p-8 md:p-12">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-primary mb-3">Message Received</h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Thank you for reaching out. A member of our team will respond to your enquiry within one business day.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-8 text-sm text-primary underline hover:no-underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-serif text-3xl font-bold text-primary mb-2">Send an Enquiry</h2>
                    <p className="text-muted-foreground mb-8 text-sm">All fields marked * are required. We respond within one business day.</p>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="contact-name" className="text-sm font-medium">Full Name *</label>
                          <Input id="contact-name" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="contact-email" className="text-sm font-medium">Email Address *</label>
                          <Input id="contact-email" type="email" placeholder="john@example.com" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="contact-phone" className="text-sm font-medium">Phone Number</label>
                          <Input id="contact-phone" type="tel" placeholder="+1 555 000 0000" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="contact-type" className="text-sm font-medium">Nature of Enquiry *</label>
                          <select
                            id="contact-type"
                            required
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Select enquiry type…</option>
                            {inquiryTypes.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="contact-subject" className="text-sm font-medium">Subject *</label>
                        <Input id="contact-subject" placeholder="Brief subject line" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="contact-message" className="text-sm font-medium">Message *</label>
                        <Textarea
                          id="contact-message"
                          placeholder="Please give us as much context as possible so we can connect you with the right consultant…"
                          className="min-h-[180px]"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" id="consent" required className="rounded" />
                        <label htmlFor="consent">
                          I consent to Bluestar Alliance storing my details in order to respond to this enquiry. View our privacy policy.
                        </label>
                      </div>
                      <Button type="submit" size="lg" className="w-full md:w-auto px-10">
                        Send Enquiry
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
