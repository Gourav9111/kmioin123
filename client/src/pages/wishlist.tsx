import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function Wishlist() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
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
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
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
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart", {
        productId,
        quantity: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart!",
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
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12" data-testid="loading-wishlist">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12" data-testid="login-required">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to view your wishlist.</p>
            <Button onClick={() => window.location.href = "/api/login"} data-testid="button-login">
              Login
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlistMutation.mutate(productId);
  };

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate(productId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="heading-wishlist">My Wishlist</h1>

        {wishlistLoading ? (
          <div className="flex justify-center py-12" data-testid="loading-wishlist-items">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-wishlist">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items to your wishlist.</p>
            <Button onClick={() => window.location.href = "/products"} data-testid="button-start-shopping">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item: any) => {
              const salePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
              const regularPrice = parseFloat(item.product.price);
              const discount = salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

              return (
                <Card key={item.id} className="card-hover bg-card border border-border rounded-xl overflow-hidden group" data-testid={`wishlist-item-${item.id}`}>
                  <div className="relative">
                    {discount > 0 && (
                      <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground z-10">
                        -{discount}%
                      </Badge>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-3 right-3 bg-card text-card-foreground shadow-lg z-10 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => handleRemoveFromWishlist(item.product.id)}
                      disabled={removeFromWishlistMutation.isPending}
                      data-testid={`button-remove-wishlist-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link href={`/products/${item.product.slug}`}>
                      <img
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500"}
                        alt={item.product.name}
                        className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-300"
                        data-testid={`img-wishlist-item-${item.id}`}
                      />
                    </Link>
                  </div>
                  <CardContent className="p-4">
                    <span className="text-primary text-sm font-medium">Custom Jersey</span>
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors" data-testid={`title-wishlist-item-${item.id}`}>
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center space-x-2 mb-3">
                      {salePrice ? (
                        <>
                          <span className="text-muted-foreground line-through" data-testid={`price-original-${item.id}`}>
                            ₹{regularPrice.toFixed(2)}
                          </span>
                          <span className="text-primary font-bold text-lg" data-testid={`price-sale-${item.id}`}>
                            ₹{salePrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-primary font-bold text-lg" data-testid={`price-${item.id}`}>
                          ₹{regularPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(item.product.id)}
                      disabled={addToCartMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
                      data-testid={`button-add-to-cart-${item.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
