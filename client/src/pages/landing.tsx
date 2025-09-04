import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ShoppingCart, Heart, Award, Truck, Users, Scissors } from "lucide-react";
import jersey1 from "@/assets/jerseys/jersey-1.jpg";
import jersey2 from "@/assets/jerseys/jersey-2.jpg";
import jersey3 from "@/assets/jerseys/jersey-3.jpg";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const categories = [
    {
      name: "Cricket",
      slug: "cricket",
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      description: "Professional cricket jerseys with moisture-wicking fabric"
    },
    {
      name: "Football", 
      slug: "football",
      image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      description: "Durable football jerseys for peak performance"
    },
    {
      name: "Badminton",
      slug: "badminton", 
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      description: "Lightweight badminton apparel for agility"
    },
    {
      name: "Basketball",
      slug: "basketball",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      description: "Breathable basketball uniforms for intense games"
    },
    {
      name: "Esports",
      slug: "esports",
      image: jersey2,
      description: "Gaming jerseys for professional esports teams"
    }
  ];

  const features = [
    {
      icon: Scissors,
      title: "Custom Made",
      description: "Personalized designs tailored to your team"
    },
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On all orders across India"
    },
    {
      icon: Users,
      title: "No Minimum Order",
      description: "Order any quantity you need"
    },
    {
      icon: Award,
      title: "Free Customization",
      description: "Design your jersey without extra cost"
    }
  ];

  const esportsJerseys = [
    {
      id: "esports-1",
      name: "Blue Inox Esports Jersey",
      image: jersey1,
      originalPrice: 1499,
      salePrice: 849,
      discount: 43
    },
    {
      id: "esports-2", 
      name: "KAMIO Gaming Pro Jersey",
      image: jersey2,
      originalPrice: 1599,
      salePrice: 999,
      discount: 38
    },
    {
      id: "esports-3",
      name: "Geometric Pattern Esports Tee",
      image: jersey3,
      originalPrice: 1299,
      salePrice: 799,
      discount: 38
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-primary/5 py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium" data-testid="badge-quality">
                  HIGH QUALITY SUBLIMATION PRINTING
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight" data-testid="heading-hero">
                  <span className="text-gradient">CUSTOMIZED</span><br/>
                  <span className="text-foreground">JERSEY</span><br/>
                  <span className="text-foreground">LOWER</span><br/>
                  <span className="text-foreground">SHORTS</span>
                </h1>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl lg:text-2xl font-semibold text-muted-foreground" data-testid="subheading-sports">
                  WIDE RANGE OF BREATHABLE FABRIC
                </h2>
                <div className="text-lg lg:text-xl space-y-1 font-medium">
                  <p>FOOTBALL</p>
                  <p>CRICKET</p> 
                  <p>BADMINTON</p>
                  <p>ESPORTS</p>
                </div>
              </div>

              <Link href="/products">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold" data-testid="button-shop-now">
                  SHOP NOW
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img 
                  src={jersey1}
                  alt="Custom Jersey Model"
                  className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
                  data-testid="img-hero-jersey"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center space-y-4" data-testid={`feature-${index}`}>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg" data-testid={`feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-muted-foreground text-sm" data-testid={`feature-description-${index}`}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16" data-testid="heading-choose-sports">
            Choose Your Sports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.slice(0, 3).map((category) => (
              <Card key={category.id} className="card-hover bg-card border border-border rounded-xl overflow-hidden group cursor-pointer" data-testid={`category-card-${category.slug}`}>
                <div className="relative">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                    data-testid={`img-category-${category.slug}`}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-2xl font-bold mb-2" data-testid={`title-category-${category.slug}`}>
                        {category.name}
                      </h3>
                      <p className="text-white/90 mb-4" data-testid={`description-category-${category.slug}`}>
                        {category.description}
                      </p>
                      <Link href={`/products?category=${category.id}`}>
                        <Button variant="secondary" className="bg-white text-primary hover:bg-white/90" data-testid={`button-shop-${category.slug}`}>
                          Shop Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Esports Jerseys Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16" data-testid="heading-esports-jerseys">
            Customized Esports Jersey
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {esportsJerseys.map((jersey) => (
              <Card key={jersey.id} className="card-hover bg-card border border-border rounded-xl overflow-hidden group" data-testid={`esports-card-${jersey.id}`}>
                <div className="relative">
                  <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground z-10" data-testid={`badge-discount-${jersey.id}`}>
                    -{jersey.discount}%
                  </Badge>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-card text-card-foreground shadow-lg mb-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={handleLogin}
                      data-testid={`button-wishlist-${jersey.id}`}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={jersey.image}
                    alt={jersey.name}
                    className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-300"
                    data-testid={`img-jersey-${jersey.id}`}
                  />
                </div>
                <CardContent className="p-4">
                  <span className="text-primary text-sm font-medium">Esports Jersey</span>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors" data-testid={`title-jersey-${jersey.id}`}>
                    {jersey.name}
                  </h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-muted-foreground line-through" data-testid={`price-original-${jersey.id}`}>
                      ₹{jersey.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-primary font-bold text-lg" data-testid={`price-sale-${jersey.id}`}>
                      ₹{jersey.salePrice.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    onClick={handleLogin}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
                    data-testid={`button-add-to-cart-${jersey.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6" data-testid="heading-cta">
            Ready to Create Your Custom Jersey?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90" data-testid="text-cta-description">
            Join thousands of teams who trust KAMIO for their custom sports apparel
          </p>
          <Link href="/products">
            <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold" data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}