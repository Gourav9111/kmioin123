import { users, categories, products, cartItems, wishlistItems, adminUsers, type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type CartItem, type InsertCartItem, type WishlistItem, type InsertWishlistItem } from "@shared/schema";
import { db, withRetry } from "./db";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Product methods
  getProducts(filters?: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Cart methods
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Wishlist methods
  getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

  // Admin methods
  isUserAdmin(userId: string): Promise<boolean>;
  promoteToAdmin(userId: string): Promise<void>;
  getAdminStats(): Promise<{ totalUsers: number; totalProducts: number; totalCategories: number }>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  constructor(private db: any) {} // Inject db instance

  async getUser(id: string): Promise<User | undefined> {
    const result = await withRetry(() => this.db.select().from(users).where(eq(users.id, id)));
    return result[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await withRetry(() => this.db.select().from(users).where(eq(users.email, email)));
    return result[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await withRetry(() => this.db.select().from(users).where(eq(users.username, username)));
    return result[0] || undefined;
  }

  async createUser(userData: Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const newUser = {
      ...userData,
      password: hashedPassword,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(), // Added missing field
      isAdmin: false,
    };

    const result = await withRetry(() =>
      this.db.insert(users).values(newUser).returning()
    );
    const createdUser = result[0];

    // Return user without password
    const { password, ...userWithoutPassword } = createdUser;
    return userWithoutPassword as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await withRetry(() =>
      this.db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
    );
    const user = result[0];
    return user || undefined;
  }

  async getCategories(): Promise<Category[]> {
    return await withRetry(() =>
      this.db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.name))
    );
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await withRetry(() =>
      this.db
        .select()
        .from(categories)
        .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    );
    const category = result[0];
    return category || undefined;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await withRetry(() =>
      this.db
        .insert(categories)
        .values(categoryData)
        .returning()
    );
    const category = result[0];
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const result = await withRetry(() =>
      this.db
        .update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .returning()
    );
    const category = result[0];
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await withRetry(() =>
      this.db
        .update(categories)
        .set({ isActive: false })
        .where(eq(categories.id, id))
    );
  }

  async getProducts(filters: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  } = {}): Promise<Product[]> {
    try {
      const result = await withRetry(() => {
        let query = this.db.select().from(products);
        
        const conditions = [];

        if (filters?.isActive !== undefined) {
          conditions.push(eq(products.isActive, filters.isActive));
        } else {
          conditions.push(eq(products.isActive, true));
        }

        if (filters?.categoryId) {
          conditions.push(eq(products.categoryId, filters.categoryId));
        }

        if (filters?.isFeatured !== undefined) {
          conditions.push(eq(products.isFeatured, filters.isFeatured));
        }

        if (filters?.search) {
          conditions.push(
            sql`(${ilike(products.name, `%${filters.search}%`)} OR ${ilike(products.description, `%${filters.search}%`)})`
          );
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        return query.orderBy(desc(products.createdAt));
      });
      
      return result as Product[];
    } catch (error) {
      console.error("Error in getProducts:", error);
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await withRetry(() =>
      this.db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.isActive, true)))
    );
    return result[0] || undefined;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const result = await this.db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      salePrice: products.salePrice,
      imageUrl: products.imageUrl,
      slug: products.slug,
      categoryId: products.categoryId,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      stock: products.stock,
      createdAt: products.createdAt,

      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      }
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug))
      .limit(1);
    return result[0] || null;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const result = await withRetry(() =>
      this.db
        .insert(products)
        .values(productData)
        .returning()
    );
    const product = result[0];
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await withRetry(() =>
      this.db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning()
    );
    const product = result[0];
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<void> {
    await withRetry(() =>
      this.db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, id))
    );
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await withRetry(() =>
      this.db
        .select({
          id: cartItems.id,
          userId: cartItems.userId,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          customization: cartItems.customization,
          createdAt: cartItems.createdAt,
          product: products,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId))
        .orderBy(desc(cartItems.createdAt))
    );
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingResult = await withRetry(() =>
      this.db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, cartItem.userId),
            eq(cartItems.productId, cartItem.productId)
          )
        )
    );
    const existingItem = existingResult[0];

    if (existingItem) {
      // Update existing item quantity
      const updateResult = await withRetry(() =>
        this.db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + cartItem.quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning()
      );
      const updatedItem = updateResult[0];
      return updatedItem;
    } else {
      // Add new item
      const newResult = await withRetry(() =>
        this.db
          .insert(cartItems)
          .values(cartItem)
          .returning()
      );
      const newItem = newResult[0];
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const result = await withRetry(() =>
      this.db
        .update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, id))
        .returning()
    );
    const updatedItem = result[0];
    return updatedItem || undefined;
  }

  async removeFromCart(id: string): Promise<void> {
    await withRetry(() => this.db.delete(cartItems).where(eq(cartItems.id, id)));
  }

  async clearCart(userId: string): Promise<void> {
    await withRetry(() => this.db.delete(cartItems).where(eq(cartItems.userId, userId)));
  }

  async getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]> {
    return await withRetry(() =>
      this.db
        .select({
          id: wishlistItems.id,
          userId: wishlistItems.userId,
          productId: wishlistItems.productId,
          createdAt: wishlistItems.createdAt,
          product: products,
        })
        .from(wishlistItems)
        .innerJoin(products, eq(wishlistItems.productId, products.id))
        .where(eq(wishlistItems.userId, userId))
        .orderBy(desc(wishlistItems.createdAt))
    );
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    const result = await withRetry(() =>
      this.db
        .insert(wishlistItems)
        .values(wishlistItem)
        .returning()
    );
    const newItem = result[0];
    return newItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await withRetry(() =>
      this.db
        .delete(wishlistItems)
        .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
    );
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const result = await withRetry(() =>
      this.db
        .select()
        .from(adminUsers)
        .where(and(eq(adminUsers.userId, userId), eq(adminUsers.isActive, true)))
    );
    const adminUser = result[0];
    return !!adminUser;
  }

  async promoteToAdmin(userId: string): Promise<void> {
    await withRetry(() =>
      this.db
        .insert(adminUsers)
        .values({ userId })
        .onConflictDoUpdate({
          target: adminUsers.userId,
          set: { isActive: true }
        })
    );
  }

  async getAdminStats(): Promise<{ totalUsers: number; totalProducts: number; totalCategories: number }> {
    const [usersResult, productsResult, categoriesResult] = await Promise.all([
      withRetry(() => this.db.select({ count: sql<number>`count(*)` }).from(users)),
      withRetry(() => this.db.select({ count: sql<number>`count(*)` }).from(products)),
      withRetry(() => this.db.select({ count: sql<number>`count(*)` }).from(categories)),
    ]);

    return {
      totalUsers: usersResult[0].count,
      totalProducts: productsResult[0].count,
      totalCategories: categoriesResult[0].count,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return withRetry(() => this.db.select().from(users));
  }
}

export const storage = new DatabaseStorage(db);