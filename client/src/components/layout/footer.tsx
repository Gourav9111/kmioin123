import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  const sportsCategories = [
    { name: "Cricket Jerseys", href: "/products?category=cricket" },
    { name: "Biker Jerseys", href: "/products?category=biker" },
    { name: "Football Jerseys", href: "/products?category=football" },
    { name: "Badminton Jerseys", href: "/products?category=badminton" },
    { name: "Basketball Jerseys", href: "/products?category=basketball" },
    { name: "Esports Jerseys", href: "/products?category=esports" },
  ];

  const services = [
    { name: "Custom Design", href: "/custom-design" },
    { name: "Bulk Orders", href: "/bulk-orders" },
    { name: "Team Uniforms", href: "/team-uniforms" },
    { name: "Logo Printing", href: "/logo-printing" },
    { name: "Free Customization", href: "/customization" },
  ];

  return (
    <footer className="bg-secondary/50 pt-16 pb-8" data-testid="footer">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-gradient">KAMIO</span>
            </div>
            <p className="text-muted-foreground mb-6" data-testid="text-brand-description">
              Custom sports jerseys for cricket, football, badminton, basketball and esports. 
              Professional quality with logo, name and number customization.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                data-testid="link-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                data-testid="link-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                data-testid="link-linkedin"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Sports Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-6" data-testid="heading-sports-categories">Sports Categories</h4>
            <ul className="space-y-3">
              {sportsCategories.map((category) => (
                <li key={category.name}>
                  <Link
                    href={category.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6" data-testid="heading-services">Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    href={service.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6" data-testid="heading-contact">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-phone text-primary"></i>
                <span className="text-muted-foreground" data-testid="text-phone">095759 90599</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-envelope text-primary"></i>
                <span className="text-muted-foreground" data-testid="text-email">info@kamio.in</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-map-marker-alt text-primary"></i>
                <span className="text-muted-foreground" data-testid="text-location">Shop No1,2,3, 2nd Floor, B-Block, Indus Market Rd, near HDFC ATM, Indus Towne, Ratanpur Sadak, Bhopal, Madhya Pradesh 462043</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0" data-testid="text-copyright">
              © 2025 KAMIO Custom Lifestyle. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-privacy"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-terms"
              >
                Terms of Service
              </a>
              <a
                href="/shipping"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-shipping"
              >
                Shipping Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
