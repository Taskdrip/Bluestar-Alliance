import { Link } from "wouter";
import { Facebook } from "lucide-react";
import logo from "@assets/24877df6-f2ec-4847-9055-916197331b0f_1783163476454.png";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <div className="bg-white rounded-md px-3 py-2 inline-block">
                <img src={logo} alt="Bluestar Alliance Company Limited" className="h-12 w-auto" />
              </div>
            </Link>
            <p className="text-primary-foreground/80 max-w-md mt-4 text-sm leading-relaxed">
              A premium multinational recruitment agency radiating over 18 years of proven trust, global scale, and professional excellence. The foundation for your global career.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link href="/jobs" className="hover:text-accent transition-colors">View Job Openings</Link></li>
              <li><Link href="/apply" className="hover:text-accent transition-colors">Apply Now</Link></li>
              <li><Link href="/testimonials" className="hover:text-accent transition-colors">Testimonials</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-white">Connect</h4>
            <div className="flex flex-col space-y-4 text-sm text-primary-foreground/80">
              <a 
                href="https://www.facebook.com/share/1H4b18diUW/" 
                target="_blank" 
                rel="norenoopener noreferrer"
                className="flex items-center gap-2 hover:text-accent transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span>Follow us on Facebook</span>
              </a>
              <div className="pt-4 border-t border-primary-foreground/20">
                <p>Michigan, USA</p>
                <p>Perth, Australia</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Bluestar Alliance Company Limited &ndash; 18+ Years of Excellence. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
