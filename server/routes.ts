import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { authenticateToken, hashPassword, comparePassword, generateToken, validateEmail, validateMobileNumber, validatePassword } from "./auth";
import { insertCartItemSchema, insertWishlistItemSchema, insertCategorySchema, insertProductSchema, loginSchema, registerSchema } from "@shared/schema";
import { products, categories } from "@shared/schema";
import { eq, like } from "drizzle-orm";
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

  // Admin login route - separate from regular user login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Check if user is admin
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: "Admin login successful",
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
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email or username
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.getUserByUsername(email); // Try username if email fails
      }
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

  app.post("/api/admin/create", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const { firstName, lastName, email, password, adminCode } = req.body;

      // Check if current user is admin (only admins can create other admins)
      const isCurrentUserAdmin = await storage.isUserAdmin(user.id);
      if (!isCurrentUserAdmin) {
        return res.status(403).json({ message: "Admin access required to create admin accounts" });
      }

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
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Promote to admin immediately
      await storage.promoteToAdmin(newUser.id);

      res.status(201).json({
        message: "Admin account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          mobileNumber: newUser.mobileNumber,
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

  // Categories route
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await db.select().from(categories);
      console.log('Categories found:', categories.length);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Admin: Create category
  app.post("/api/admin/categories", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Admin: Update category
  app.put("/api/admin/categories/:id", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(req.params.id, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Admin: Delete category
  app.delete("/api/admin/categories/:id", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteCategory(req.params.id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, featured } = req.query;

      let queryBuilder = db.select().from(products).where(eq(products.isActive, true));

      if (categoryId && categoryId !== 'all') {
        queryBuilder = queryBuilder.where(eq(products.categoryId, categoryId as string));
      }

      if (featured === 'true') {
        // Assuming 'isFeatured' is a boolean column in your products table
        // You might need to adjust this based on your actual schema
        queryBuilder = queryBuilder.where(eq(products.isFeatured, true)); // Assuming 'isFeatured' is the column name
      }

      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        queryBuilder = queryBuilder.where(like(products.name, `%${searchTerm}%`)); // Assuming filtering by name
      }

      const result = await queryBuilder;
      console.log("Products found:", result.length);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again", products: [] });
      } else {
        res.status(500).json({ message: "Failed to fetch products", products: [] });
      }
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
      console.error("Error fetching product:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to fetch product" });
      }
    }
  });

  // Get related products
  app.get("/api/products/:slug/related", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const relatedProducts = await storage.getProducts({
        categoryId: product.categoryId,
        isActive: true,
      });

      // Filter out the current product and limit to 3
      const filtered = relatedProducts
        .filter(p => p.id !== product.id)
        .slice(0, 3);

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching related products:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to fetch related products" });
      }
    }
  });

  // Admin: Create product
  app.post("/api/admin/products", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  // Admin: Update product
  app.put("/api/admin/products/:id", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  // Admin: Delete product
  app.delete("/api/admin/products/:id", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to delete product" });
      }
    }
  });

  // Cart
  app.get("/api/cart", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const cartItems = await storage.getCartItems(user.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to fetch cart items" });
      }
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
      console.error("Error adding item to cart:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to add item to cart" });
      }
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
      console.error("Error updating cart item:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to update cart item" });
      }
    }
  });

  app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to remove item from cart" });
      }
    }
  });

  // Wishlist
  app.get("/api/wishlist", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const wishlistItems = await storage.getWishlistItems(user.id);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to fetch wishlist items" });
      }
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
      console.error("Error adding item to wishlist:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to add item to wishlist" });
      }
    }
  });

  app.delete("/api/wishlist/:productId", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const { productId } = req.params;
      await storage.removeFromWishlist(user.id, productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to remove item from wishlist" });
      }
    }
  });

  // Debug endpoint to view all products and categories
  app.get("/api/debug/products", async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const allCategories = await storage.getCategories();
      res.json({
        categories: allCategories,
        products: allProducts,
        productCount: allProducts.length,
        categoryCount: allCategories.length
      });
    } catch (error) {
      console.error("Error fetching debug data:", error);
      res.status(500).json({ message: "Failed to fetch debug data" });
    }
  });

  // Admin routes
  app.get("/api/admin/check", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const isAdmin = await storage.isUserAdmin(user.id);
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to check admin status" });
      }
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
      console.error("Error promoting user:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to promote user" });
      }
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
      console.error("Error fetching admin stats:", error);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        res.status(503).json({ message: "Database temporarily unavailable, please try again" });
      } else {
        res.status(500).json({ message: "Failed to fetch admin stats" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}