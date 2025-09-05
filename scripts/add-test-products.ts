
import { db } from "../server/db";
import { categories, products } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Creating test data...");
    
    // Create categories first
    const categoriesData = [
      { id: "cat-1", name: "Cricket Jersey", slug: "cricket", isActive: true },
      { id: "cat-2", name: "Esports Jersey", slug: "esports", isActive: true },
      { id: "cat-3", name: "Marathon Jersey", slug: "marathon", isActive: true }
    ];

    for (const cat of categoriesData) {
      try {
        await db.insert(categories).values(cat).onConflictDoNothing();
        console.log(`Created/verified category: ${cat.name}`);
      } catch (error) {
        console.log(`Category ${cat.name} might already exist`);
      }
    }

    // Create test products
    const testProducts = [
      {
        id: "prod-1",
        name: "Professional Cricket Jersey Blue",
        slug: "cricket-jersey-blue",
        description: "High-quality cricket jersey in blue with professional design",
        price: "1299.00",
        salePrice: "999.00",
        categoryId: "cat-1",
        imageUrl: "/src/assets/products/cricket/download (1).jpeg",
        isActive: true,
        isFeatured: true,
        stock: 25
      },
      {
        id: "prod-2", 
        name: "Esports Gaming Jersey Red",
        slug: "esports-jersey-red",
        description: "Comfortable esports jersey perfect for gaming tournaments",
        price: "899.00",
        salePrice: "699.00", 
        categoryId: "cat-2",
        imageUrl: "/src/assets/products/esports/08bd8e5f-c4e5-4f02-bd6a-70a072369520.png",
        isActive: true,
        isFeatured: true,
        stock: 30
      },
      {
        id: "prod-3",
        name: "Marathon Running Jersey Black", 
        slug: "marathon-jersey-black",
        description: "Lightweight marathon jersey designed for long-distance running",
        price: "1199.00",
        salePrice: "899.00",
        categoryId: "cat-3", 
        imageUrl: "/src/assets/products/marathon/download (1).jpeg",
        isActive: true,
        isFeatured: false,
        stock: 20
      }
    ];

    for (const product of testProducts) {
      try {
        await db.insert(products).values(product).onConflictDoNothing();
        console.log(`Created/verified product: ${product.name}`);
      } catch (error) {
        console.log(`Product ${product.name} might already exist`);
      }
    }

    console.log("Test data creation completed!");
    
    // Verify the data
    const allCategories = await db.select().from(categories);
    const allProducts = await db.select().from(products);
    
    console.log(`Total categories: ${allCategories.length}`);
    console.log(`Total products: ${allProducts.length}`);
    
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

main();
