import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { authenticateToken, hashPassword, comparePassword, generateToken, validateEmail, validateMobileNumber, validatePassword } from "./auth";
import { insertCartItemSchema, insertWishlistItemSchema, insertCategorySchema, insertProductSchema, loginSchema, registerSchema } from "@shared/schema";
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

  // Categories - Temporary mock data while database is configured
  app.get("/api/categories", async (req, res) => {
    try {
      const mockCategories = [
        {
          id: "cricket",
          name: "Cricket Jersey",
          slug: "cricket",
          description: "Professional cricket jerseys for teams and individuals",
          imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "esports",
          name: "Esports Jersey",
          slug: "esports",
          description: "Gaming jerseys for esports teams and streamers",
          imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600", 
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "marathon",
          name: "Marathon Jersey",
          slug: "marathon",
          description: "Running jerseys for marathons and long distance events",
          imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "football",
          name: "Football Jersey",
          slug: "football",
          description: "Football jerseys for teams and leagues",
          imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      res.json(mockCategories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
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

  // Products - Temporary mock data while database is configured
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, featured } = req.query;
      
      // Temporary product data - your actual products with real images from asset folders
      const mockProducts = [
        // Cricket Products
        {
          id: "cricket-1",
          name: "Classic Cricket Team Jersey - Blue",
          slug: "classic-cricket-blue-jersey",
          shortDescription: "Professional cricket team jersey in royal blue",
          description: "Professional cricket team jersey in royal blue with moisture-wicking fabric. Perfect for team matches and practice sessions.",
          price: "1299.00",
          salePrice: "999.00",
          categoryId: "cricket",
          imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 25,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Blue", "White", "Navy"],
          customizationOptions: ["Player Name", "Team Logo", "Number"],
          createdAt: new Date()
        },
        {
          id: "cricket-2", 
          name: "Premium Cricket Jersey - White & Blue",
          slug: "premium-cricket-white-blue",
          shortDescription: "Premium quality cricket jersey with breathable fabric",
          description: "Premium quality cricket jersey in white and blue combination with advanced moisture-wicking technology and comfortable fit.",
          price: "1499.00",
          salePrice: "1199.00",
          categoryId: "cricket",
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 18,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["White", "Blue", "Sky Blue"],
          customizationOptions: ["Player Name", "Team Logo", "Number"],
          createdAt: new Date()
        },
        {
          id: "cricket-3",
          name: "Team India Style Cricket Jersey",
          slug: "team-india-style-jersey",
          shortDescription: "India team inspired cricket jersey design",
          description: "Team India inspired cricket jersey with authentic styling, premium fabric quality, and official team colors.",
          price: "1599.00",
          salePrice: "1299.00",
          categoryId: "cricket",
          imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 22,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Blue", "Orange", "White"],
          customizationOptions: ["Player Name", "Team Logo", "Number"],
          createdAt: new Date()
        },
        {
          id: "cricket-4",
          name: "Elite Cricket Training Jersey",
          slug: "elite-cricket-training",
          shortDescription: "High-performance training jersey for cricket",
          description: "Elite cricket training jersey designed for optimal performance during practice sessions and warm-ups.",
          price: "1199.00",
          salePrice: "899.00",
          categoryId: "cricket",
          imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 30,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Green", "Yellow", "White"],
          customizationOptions: ["Player Name", "Team Logo", "Number"],
          createdAt: new Date()
        },
        {
          id: "cricket-5",
          name: "Royal Cricket Team Jersey - Green",
          slug: "royal-cricket-green",
          shortDescription: "Royal green cricket jersey for professional teams",
          description: "Royal green cricket team jersey with gold accents, premium fabric, and professional team styling.",
          price: "1399.00",
          salePrice: "1099.00",
          categoryId: "cricket",
          imageUrl: "https://images.unsplash.com/photo-1578763725469-6ddc04f9b438?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 15,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Green", "Gold", "White"],
          customizationOptions: ["Player Name", "Team Logo", "Number"],
          createdAt: new Date()
        },
        // Esports Products
        {
          id: "esports-1",
          name: "Pro Gaming Jersey - Neon Blue",
          slug: "pro-gaming-neon-blue",
          shortDescription: "Professional esports jersey with neon blue design",
          description: "Professional esports gaming jersey with vibrant neon blue design, lightweight fabric, and ergonomic fit for long gaming sessions.",
          price: "999.00",
          salePrice: "799.00",
          categoryId: "esports",
          imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 20,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Neon Blue", "Black", "White"],
          customizationOptions: ["Gamer Tag", "Team Logo", "Sponsor Logo"],
          createdAt: new Date()
        },
        {
          id: "esports-2",
          name: "Elite Esports Team Jersey - Black & Red",
          slug: "elite-esports-black-red",
          shortDescription: "Elite esports team jersey in black and red",
          description: "Elite esports team jersey featuring sleek black and red design with premium materials for competitive gaming.",
          price: "1199.00",
          salePrice: "899.00",
          categoryId: "esports",
          imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 25,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Black", "Red", "Dark Gray"],
          customizationOptions: ["Gamer Tag", "Team Logo", "Sponsor Logo"],
          createdAt: new Date()
        },
        {
          id: "esports-3",
          name: "Gaming Championship Jersey - Purple",
          slug: "gaming-championship-purple",
          shortDescription: "Championship-grade purple gaming jersey",
          description: "Championship-grade gaming jersey in striking purple design, engineered for comfort during intense gaming tournaments.",
          price: "1099.00",
          salePrice: "849.00",
          categoryId: "esports",
          imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 18,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Purple", "Black", "Silver"],
          customizationOptions: ["Gamer Tag", "Team Logo", "Sponsor Logo"],
          createdAt: new Date()
        },
        {
          id: "esports-4",
          name: "Streamer Pro Jersey - Orange Flame",
          slug: "streamer-pro-orange-flame",
          shortDescription: "Professional streamer jersey with flame design",
          description: "Professional streamer jersey featuring dynamic orange flame graphics, perfect for content creators and streamers.",
          price: "899.00",
          salePrice: "699.00",
          categoryId: "esports",
          imageUrl: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 28,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Orange", "Black", "Yellow"],
          customizationOptions: ["Gamer Tag", "Team Logo", "Sponsor Logo"],
          createdAt: new Date()
        },
        {
          id: "esports-5",
          name: "Cyber Gaming Jersey - Electric Blue",
          slug: "cyber-gaming-electric-blue",
          shortDescription: "Futuristic cyber gaming jersey in electric blue",
          description: "Futuristic cyber gaming jersey with electric blue accents and high-tech design elements for modern esports teams.",
          price: "1299.00",
          salePrice: "999.00",
          categoryId: "esports",
          imageUrl: "https://images.unsplash.com/photo-1519311965067-36d3e5f33d39?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 16,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Electric Blue", "Black", "Silver"],
          customizationOptions: ["Gamer Tag", "Team Logo", "Sponsor Logo"],
          createdAt: new Date()
        },
        // Marathon Products
        {
          id: "marathon-1",
          name: "Ultra Marathon Running Jersey - Lightweight",
          slug: "ultra-marathon-lightweight",
          shortDescription: "Ultra-lightweight marathon running jersey",
          description: "Ultra-lightweight marathon running jersey designed for long-distance running with superior breathability and moisture management.",
          price: "899.00",
          salePrice: "699.00",
          categoryId: "marathon",
          imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 35,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["White", "Blue", "Gray"],
          customizationOptions: ["Runner Name", "Race Number", "Personal Message"],
          createdAt: new Date()
        },
        {
          id: "marathon-2",
          name: "Professional Runner Jersey - High-Performance",
          slug: "professional-runner-high-performance",
          shortDescription: "High-performance jersey for professional runners",
          description: "High-performance running jersey engineered for professional marathon runners with advanced fabric technology.",
          price: "1199.00",
          salePrice: "899.00",
          categoryId: "marathon",
          imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 20,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Red", "White", "Black"],
          customizationOptions: ["Runner Name", "Race Number", "Personal Message"],
          createdAt: new Date()
        },
        {
          id: "marathon-3",
          name: "City Marathon Team Jersey - Official",
          slug: "city-marathon-team-official",
          shortDescription: "Official city marathon team jersey",
          description: "Official city marathon team jersey with authentic branding and premium materials for official race participants.",
          price: "1399.00",
          salePrice: "1099.00",
          categoryId: "marathon",
          imageUrl: "https://images.unsplash.com/photo-1594736797933-d0f02d04eb6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 25,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Green", "Yellow", "White"],
          customizationOptions: ["Runner Name", "Race Number", "Personal Message"],
          createdAt: new Date()
        },
        {
          id: "marathon-4",
          name: "Long Distance Runner Jersey - Comfort Fit",
          slug: "long-distance-comfort-fit",
          shortDescription: "Comfort fit jersey for long distance runners",
          description: "Comfort fit jersey specially designed for long distance runners with ergonomic cut and sweat-wicking properties.",
          price: "999.00",
          salePrice: "749.00",
          categoryId: "marathon",
          imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 30,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Navy", "Orange", "White"],
          customizationOptions: ["Runner Name", "Race Number", "Personal Message"],
          createdAt: new Date()
        },
        {
          id: "marathon-5",
          name: "Elite Marathon Championship Jersey",
          slug: "elite-marathon-championship",
          shortDescription: "Elite championship jersey for marathon events",
          description: "Elite championship jersey designed for marathon events with premium materials and professional finish.",
          price: "1299.00",
          salePrice: "999.00",
          categoryId: "marathon",
          imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 12,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Purple", "Gold", "White"],
          customizationOptions: ["Runner Name", "Race Number", "Personal Message"],
          createdAt: new Date()
        },
        // Football Products  
        {
          id: "football-1",
          name: "Classic Football Team Jersey - Home",
          slug: "classic-football-home",
          shortDescription: "Classic home football team jersey",
          description: "Classic home football team jersey with traditional styling and modern fabric technology for optimal performance on the field.",
          price: "999.00",
          salePrice: "799.00",
          categoryId: "football",
          imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 40,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Red", "White", "Blue"],
          customizationOptions: ["Player Name", "Jersey Number", "Team Badge"],
          createdAt: new Date()
        },
        {
          id: "football-2",
          name: "Premier League Style Jersey - Away",
          slug: "premier-league-away",
          shortDescription: "Premier league inspired away jersey",
          description: "Premier league inspired away jersey with authentic styling and professional-grade materials.",
          price: "1199.00",
          salePrice: "899.00",
          categoryId: "football",
          imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 35,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["White", "Black", "Gray"],
          customizationOptions: ["Player Name", "Jersey Number", "Team Badge"],
          createdAt: new Date()
        },
        {
          id: "football-3",
          name: "World Cup Edition Football Jersey",
          slug: "world-cup-edition",
          shortDescription: "World Cup edition football jersey",
          description: "World Cup edition football jersey featuring official styling and premium construction for international tournament feel.",
          price: "1499.00",
          salePrice: "1199.00",
          categoryId: "football",
          imageUrl: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 28,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Blue", "Yellow", "White"],
          customizationOptions: ["Player Name", "Jersey Number", "Team Badge"],
          createdAt: new Date()
        },
        {
          id: "football-4",
          name: "Training Football Jersey - Practice",
          slug: "training-football-practice",
          shortDescription: "Football training jersey for practice",
          description: "Football training jersey designed for practice sessions with durable construction and comfortable fit.",
          price: "799.00",
          salePrice: "599.00",
          categoryId: "football",
          imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: false,
          stock: 45,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Green", "Black", "White"],
          customizationOptions: ["Player Name", "Jersey Number", "Team Badge"],
          createdAt: new Date()
        },
        {
          id: "football-5",
          name: "Champions League Style Jersey - Special Edition",
          slug: "champions-league-special",
          shortDescription: "Champions League inspired special edition",
          description: "Champions League inspired special edition jersey with premium materials and exclusive design elements.",
          price: "1399.00",
          salePrice: "1099.00",
          categoryId: "football",
          imageUrl: "https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          isActive: true,
          isFeatured: true,
          stock: 20,
          availableSizes: ["S", "M", "L", "XL", "XXL"],
          availableColors: ["Purple", "Gold", "Black"],
          customizationOptions: ["Player Name", "Jersey Number", "Team Badge"],
          createdAt: new Date()
        }
      ];
      
      // Apply filters
      let filteredProducts = mockProducts;
      
      if (categoryId) {
        filteredProducts = filteredProducts.filter(p => p.categoryId === categoryId);
      }
      
      if (featured === 'true') {
        filteredProducts = filteredProducts.filter(p => p.isFeatured);
      }
      
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm) || 
          p.description.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json(filteredProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error);
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