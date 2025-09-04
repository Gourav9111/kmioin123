import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
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
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
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
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product to wishlist",
        variant: "destructive",
      });
    },
  });

  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const regularPrice = parseFloat(product.price);
  const discount = salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
    addToCartMutation.mutate();
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to wishlist",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
    addToWishlistMutation.mutate();
  };

  return (
    <Card className="card-hover bg-card border border-border rounded-xl overflow-hidden group" data-testid={`card-product-${product.id}`}>
      <div className="relative">
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground z-10" data-testid="badge-discount">
            -{discount}%
          </Badge>
        )}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="secondary"
            size="icon"
            className="bg-card text-card-foreground shadow-lg mb-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={handleAddToWishlist}
            disabled={addToWishlistMutation.isPending}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <Link href={`/products/${product.slug}`}>
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500"}
            alt={product.name}
            className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-product-${product.id}`}
          />
        </Link>
      </div>
      <CardContent className="p-4">
        <span className="text-primary text-sm font-medium" data-testid={`category-${product.id}`}>
          Custom Jersey
        </span>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors" data-testid={`title-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center space-x-2 mb-3">
          {salePrice ? (
            <>
              <span className="text-muted-foreground line-through" data-testid={`price-original-${product.id}`}>
                ₹{regularPrice.toFixed(2)}
              </span>
              <span className="text-primary font-bold text-lg" data-testid={`price-sale-${product.id}`}>
                ₹{salePrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-primary font-bold text-lg" data-testid={`price-${product.id}`}>
              ₹{regularPrice.toFixed(2)}
            </span>
          )}
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
