
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, hashPassword, comparePassword, generateToken, validateEmail, validateMobileNumber, validatePassword } from "./auth";
import { insertCartItemSchema, insertWishlistItemSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/create", async (req, res) => {
    try {
      const { firstName, lastName, email, password, adminCode } = req.body;
      
      // Check admin creation code (you can change this to your preferred code)
      const ADMIN_CREATION_CODE = process.env.ADMIN_CREATION_CODE || "ADMIN2024";
      if (adminCode !== ADMIN_CREATION_CODE) {
        return res.status(401).json({ message: "Invalid admin creation code" });
      }

      // Validate user data
      const userData = registerSchema.parse({
        firstName,
        lastName,
        email,
        password,
        mobileNumber: "0000000000", // Default value for admin
      });
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Promote to admin immediately
      await storage.promoteToAdmin(user.id);

      res.status(201).json({
        message: "Admin account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Admin creation error:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  // Get user info
  app.get("/api/user", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
    });
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
  app.get("/api/cart", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const cartItems = await storage.getCartItems(user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const cartItem = insertCartItemSchema.parse({
        ...req.body,
        userId: user.id,
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

  app.patch("/api/cart/:id", authenticateToken, async (req, res) => {
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

  app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Wishlist
  app.get("/api/wishlist", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const wishlistItems = await storage.getWishlistItems(user.id);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist items" });
    }
  });

  app.post("/api/wishlist", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const wishlistItem = insertWishlistItemSchema.parse({
        ...req.body,
        userId: user.id,
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

  app.delete("/api/wishlist/:productId", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const { productId } = req.params;
      await storage.removeFromWishlist(user.id, productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from wishlist" });
    }
  });

  // Admin routes
  app.get("/api/admin/check", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      res.json({ isAdmin });
    } catch (error) {
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  app.post("/api/admin/promote", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const { userId } = req.body;
      
      // Check if current user is admin
      const isCurrentUserAdmin = await storage.isUserAdmin(user.id);
      if (!isCurrentUserAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.promoteToAdmin(userId);
      res.json({ message: "User promoted to admin" });
    } catch (error) {
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
