import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw } from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:slug");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState<{name: string, hex: string} | null>(null);
  const [customization, setCustomization] = useState({
    playerName: "",
    playerNumber: "",
    teamLogo: "",
    specialInstructions: "",
  });

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params?.slug],
    enabled: !!params?.slug,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/cart", data);
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      toast({
        title: "Added to Wishlist",
        description: "Product has been added to your wishlist!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product to wishlist",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    if (!product) return;

    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      selectedSize,
      selectedColor,
      customization,
    });
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    addToWishlistMutation.mutate(product.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12" data-testid="loading-product">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12" data-testid="product-not-found">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
            <Button onClick={() => window.location.href = "/products"} data-testid="button-back-to-products">
              Back to Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const regularPrice = parseFloat(product.price);
  const discount = salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-red-600 text-white z-10" data-testid="badge-discount">
                  -{discount}%
                </Badge>
              )}
              <img
                src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                data-testid="img-product-main"
              />
            </div>
            
            {/* Thumbnail images */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-primary"
                    data-testid={`img-product-thumb-${index}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-product-name">{product.name}</h1>
              <p className="text-muted-foreground" data-testid="text-product-category">
                {product.shortDescription || "Custom Sports Jersey"}
              </p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(4.8) 127 reviews</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {salePrice ? (
                  <>
                    <span className="text-2xl font-bold text-primary" data-testid="text-sale-price">
                      ₹{salePrice.toFixed(2)}
                    </span>
                    <span className="text-lg text-muted-foreground line-through" data-testid="text-regular-price">
                      ₹{regularPrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-primary" data-testid="text-price">
                    ₹{regularPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
            </div>

            {/* Size and Color Selection */}
            <div className="space-y-4">
              {/* Size Selection */}
              <div>
                <Label>Size</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full" data-testid="select-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product?.availableSizes?.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    )) || ['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Selection */}
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(product?.availableColors || [
                    {name: 'Red', hex: '#dc2626'},
                    {name: 'Blue', hex: '#2563eb'},
                    {name: 'Black', hex: '#000000'},
                    {name: 'White', hex: '#ffffff'}
                  ]).map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor?.name === color.name ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      data-testid={`color-${color.name.toLowerCase()}`}
                    />
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedColor.name}
                  </p>
                )}
              </div>
            </div>

            {/* Customization Options */}
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4" data-testid="text-customization-title">Jersey Customization</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="playerName">Player Name</Label>
                      <Input
                        id="playerName"
                        placeholder="Enter name"
                        value={customization.playerName}
                        onChange={(e) => setCustomization(prev => ({ ...prev, playerName: e.target.value }))}
                        data-testid="input-player-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerNumber">Player Number</Label>
                      <Input
                        id="playerNumber"
                        placeholder="Enter number"
                        value={customization.playerNumber}
                        onChange={(e) => setCustomization(prev => ({ ...prev, playerNumber: e.target.value }))}
                        data-testid="input-player-number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="teamLogo">Team Logo URL (optional)</Label>
                    <Input
                      id="teamLogo"
                      placeholder="Enter logo URL"
                      value={customization.teamLogo}
                      onChange={(e) => setCustomization(prev => ({ ...prev, teamLogo: e.target.value }))}
                      data-testid="input-team-logo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="instructions">Special Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Any special requirements..."
                      value={customization.specialInstructions}
                      onChange={(e) => setCustomization(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      data-testid="textarea-instructions"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    data-testid="button-quantity-decrease"
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    data-testid="input-quantity"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="button-quantity-increase"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleAddToWishlist}
                  disabled={addToWishlistMutation.isPending}
                  data-testid="button-add-to-wishlist"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                className="w-full bg-primary text-primary-foreground"
                onClick={() => {
                  handleAddToCart();
                  setTimeout(() => window.location.href = "/cart", 1000);
                }}
                data-testid="button-buy-now"
              >
                Buy Now
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="h-4 w-4 text-primary" />
                <span>Free shipping on all orders</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Quality guarantee</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>Easy returns within 30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <Separator className="my-12" />
        
        <div className="space-y-6">
          <h2 className="text-2xl font-bold" data-testid="text-description-title">Product Description</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
              {product.description || `
                Elevate your game with this premium custom sports jersey. Crafted from high-performance 
                moisture-wicking fabric, this jersey ensures maximum comfort and durability during intense 
                gameplay. The lightweight design allows for unrestricted movement while the breathable 
                material keeps you cool and dry.

                Features:
                • Premium polyester blend fabric
                • Moisture-wicking technology
                • Lightweight and breathable
                • Professional-grade printing
                • Customizable with names, numbers, and logos
                • Available in multiple sizes
                • Machine washable
                • Fade-resistant colors

                Perfect for teams, tournaments, or casual gaming sessions. Each jersey is made to order 
                with attention to detail and quality craftsmanship.
              `}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
