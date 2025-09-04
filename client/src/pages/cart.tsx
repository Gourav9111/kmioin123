import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
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

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
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
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
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
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12" data-testid="loading-cart">
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
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to view your cart.</p>
            <Button onClick={() => window.location.href = "/api/login"} data-testid="button-login">
              Login
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: string) => {
    removeItemMutation.mutate(id);
  };

  const subtotal = cartItems.reduce(
    (total: number, item: any) => 
      total + (parseFloat(item.product.salePrice || item.product.price) * item.quantity),
    0
  );

  const shipping = subtotal > 1000 ? 0 : 99; // Free shipping over ₹1000
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="heading-cart">Shopping Cart</h1>

        {cartLoading ? (
          <div className="flex justify-center py-12" data-testid="loading-cart-items">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-cart">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Start shopping to add items to your cart.</p>
            <Button onClick={() => window.location.href = "/products"} data-testid="button-start-shopping">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item: any) => (
                <Card key={item.id} className="bg-card" data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded"
                        data-testid={`img-cart-item-${item.id}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`title-cart-item-${item.id}`}>
                          {item.product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {item.product.shortDescription || "Custom Sports Jersey"}
                        </p>
                        
                        {/* Customization Details */}
                        {item.customization && (
                          <div className="text-sm text-muted-foreground mb-3">
                            {item.customization.playerName && (
                              <div>Name: {item.customization.playerName}</div>
                            )}
                            {item.customization.playerNumber && (
                              <div>Number: {item.customization.playerNumber}</div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={updateQuantityMutation.isPending}
                              data-testid={`button-decrease-quantity-${item.id}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                              min="1"
                              data-testid={`input-quantity-${item.id}`}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={updateQuantityMutation.isPending}
                              data-testid={`button-increase-quantity-${item.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-lg" data-testid={`price-cart-item-${item.id}`}>
                              ₹{(parseFloat(item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-remove-item-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4" data-testid="heading-order-summary">Order Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span data-testid="subtotal">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span data-testid="shipping">
                        {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span data-testid="total">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-primary text-primary-foreground" data-testid="button-checkout">
                    Proceed to Checkout
                  </Button>

                  {subtotal < 1000 && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Add ₹{(1000 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
