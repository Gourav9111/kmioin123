import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart, ShoppingCart, Star, Truck, Shield, RefreshCw } from "lucide-react";
import type { Product } from "@shared/schema";
import { useState } from "react";

interface ProductDetailPageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${params.slug}`],
    queryFn: () => apiRequest("GET", `/api/products/${params.slug}`),
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: [`/api/products/${params.slug}/related`],
    queryFn: () => apiRequest("GET", `/api/products/${params.slug}/related`),
    enabled: !!product,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
        selectedSize,
        selectedColor,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login Required",
          description: "Please login to add items to cart",
          variant: "destructive",
        });
        setLocation("/login");
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
    mutationFn: async () => {
      await apiRequest("POST", "/api/wishlist", {
        productId: product.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login Required",
          description: "Please login to add items to wishlist",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product to wishlist",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 aspect-square rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation("/products")}>Browse Products</Button>
      </div>
    );
  }

  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const regularPrice = parseFloat(product.price);
  const discount = salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  // Handle both asset paths and external URLs
  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;

    // If it's an asset path, return as is (Vite will handle it)
    return imageUrl;
  };

  const displayImage = getImageUrl(product.imageUrl);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative">
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground z-10">
                -{discount}%
              </Badge>
            )}
            <img
              src={displayImage}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg"
              onError={(e) => {
                // If the image fails to load, use the absolute fallback
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";
              }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category?.name || "Custom Jersey"}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground">{product.shortDescription}</p>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-3">
            {salePrice ? (
              <>
                <span className="text-3xl font-bold text-primary">₹{salePrice.toFixed(2)}</span>
                <span className="text-xl text-muted-foreground line-through">₹{regularPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-primary">₹{regularPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Sizes */}
          {product.availableSizes && product.availableSizes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Available Sizes:</h3>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.availableColors && product.availableColors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Available Colors:</h3>
              <div className="flex flex-wrap gap-2">
                {product.availableColors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Stock:</span>
            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
              {product.stock > 0 ? `${product.stock} available` : "Out of Stock"}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending || product.stock === 0}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
            </Button>
            <Button
              variant="outline"
              onClick={() => addToWishlistMutation.mutate()}
              disabled={addToWishlistMutation.isPending}
              size="lg"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-3 pt-6 border-t">
            <div className="flex items-center space-x-3">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-sm">Free shipping on orders over ₹1000</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">1 year warranty</span>
            </div>
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-primary" />
              <span className="text-sm">30-day return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customization Options */}
      {product.customizationOptions && product.customizationOptions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Customization Options</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.customizationOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">You might also like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="card-hover bg-card border border-border rounded-xl overflow-hidden group">
                <div className="relative">
                  <img
                    src={getImageUrl(relatedProduct.imageUrl)}
                    alt={relatedProduct.name}
                    className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <span className="text-primary text-sm font-medium">{relatedProduct.category?.name}</span>
                  <h3 className="font-semibold text-lg mb-2">{relatedProduct.name}</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    {relatedProduct.salePrice ? (
                      <>
                        <span className="text-muted-foreground line-through">₹{parseFloat(relatedProduct.price).toFixed(2)}</span>
                        <span className="text-primary font-bold">₹{parseFloat(relatedProduct.salePrice).toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-primary font-bold">₹{parseFloat(relatedProduct.price).toFixed(2)}</span>
                    )}
                  </div>
                  <Button
                    onClick={() => setLocation(`/products/${relatedProduct.slug}`)}
                    variant="outline"
                    className="w-full"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}