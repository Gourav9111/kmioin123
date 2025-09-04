import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCartItemSchema, insertWishlistItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Get user info
  app.get("/api/user", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userInfo = await storage.getUser(user.claims.sub);
    if (!userInfo) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userInfo);
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, featured } = req.query;
      const products = await storage.getProducts({
        categoryId: categoryId as string,
        search: search as string,
        isFeatured: featured === 'true' ? true : undefined,
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart
  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const cartItems = await storage.getCartItems(user.claims.sub);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const cartItem = insertCartItemSchema.parse({
        ...req.body,
        userId: user.claims.sub,
      });
      const newItem = await storage.addToCart(cartItem);
      res.json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const updatedItem = await storage.updateCartItem(id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Wishlist
  app.get("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const wishlistItems = await storage.getWishlistItems(user.claims.sub);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist items" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const wishlistItem = insertWishlistItemSchema.parse({
        ...req.body,
        userId: user.claims.sub,
      });
      const newItem = await storage.addToWishlist(wishlistItem);
      res.json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid wishlist item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { productId } = req.params;
      await storage.removeFromWishlist(user.claims.sub, productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from wishlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
