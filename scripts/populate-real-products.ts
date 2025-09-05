
import { db } from "../server/db";
import { categories, products } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Creating categories and products from real assets...");
    
    // Create categories first
    const categoriesData = [
      { 
        id: "cricket", 
        name: "Cricket Jersey", 
        slug: "cricket", 
        description: "Professional cricket jerseys for teams and individuals",
        isActive: true 
      },
      { 
        id: "esports", 
        name: "Esports Jersey", 
        slug: "esports", 
        description: "Gaming jerseys for esports enthusiasts",
        isActive: true 
      },
      { 
        id: "football", 
        name: "Football Jersey", 
        slug: "football", 
        description: "Football team jerseys and sportswear",
        isActive: true 
      },
      { 
        id: "marathon", 
        name: "Marathon Jersey", 
        slug: "marathon", 
        description: "Lightweight jerseys for long-distance running",
        isActive: true 
      },
      { 
        id: "biker", 
        name: "Biker Jersey", 
        slug: "biker", 
        description: "Protective and stylish biker gear",
        isActive: true 
      }
    ];

    // Insert categories
    for (const cat of categoriesData) {
      try {
        await db.insert(categories).values(cat).onConflictDoNothing();
        console.log(`Created category: ${cat.name}`);
      } catch (error) {
        console.log(`Category ${cat.name} already exists`);
      }
    }

    // Create cricket products
    const cricketProducts = [
      {
        id: "cricket-1",
        name: "Professional Cricket Jersey Blue",
        slug: "cricket-jersey-blue",
        description: "High-quality cricket jersey in blue with professional design",
        price: "1299.00",
        salePrice: "999.00",
        categoryId: "cricket",
        imageUrl: "/src/assets/products/cricket/download (1).jpeg",
        isActive: true,
        isFeatured: true,
        stock: 25
      },
      {
        id: "cricket-2",
        name: "Classic Cricket Team Jersey",
        slug: "cricket-jersey-classic",
        description: "Traditional cricket jersey with modern comfort",
        price: "1199.00",
        salePrice: "899.00",
        categoryId: "cricket",
        imageUrl: "/src/assets/products/cricket/download (2).jpeg",
        isActive: true,
        isFeatured: false,
        stock: 30
      },
      {
        id: "cricket-3",
        name: "Premium Cricket Jersey White",
        slug: "cricket-jersey-white",
        description: "Premium white cricket jersey for professional play",
        price: "1499.00",
        salePrice: "1199.00",
        categoryId: "cricket",
        imageUrl: "/src/assets/products/cricket/download (3).jpeg",
        isActive: true,
        isFeatured: true,
        stock: 20
      }
    ];

    // Create esports products
    const esportsProducts = [
      {
        id: "esports-1",
        name: "Gaming Esports Jersey Red",
        slug: "esports-jersey-red",
        description: "Comfortable esports jersey perfect for gaming tournaments",
        price: "899.00",
        salePrice: "699.00",
        categoryId: "esports",
        imageUrl: "/src/assets/products/esports/08bd8e5f-c4e5-4f02-bd6a-70a072369520.png",
        isActive: true,
        isFeatured: true,
        stock: 35
      },
      {
        id: "esports-2",
        name: "Pro Gamer Jersey Blue",
        slug: "esports-jersey-blue",
        description: "Professional gaming jersey with moisture-wicking fabric",
        price: "999.00",
        salePrice: "799.00",
        categoryId: "esports",
        imageUrl: "/src/assets/products/esports/384b3062-2d12-48c0-b609-fcd2a658bdc2.png",
        isActive: true,
        isFeatured: false,
        stock: 25
      }
    ];

    // Create football products
    const footballProducts = [
      {
        id: "football-1",
        name: "Elite Football Jersey",
        slug: "football-jersey-elite",
        description: "Premium football jersey for professional teams",
        price: "1399.00",
        salePrice: "1099.00",
        categoryId: "football",
        imageUrl: "/src/assets/products/football/imgi_2_default.jpg",
        isActive: true,
        isFeatured: true,
        stock: 40
      },
      {
        id: "football-2",
        name: "Team Football Jersey",
        slug: "football-jersey-team",
        description: "Durable football jersey for team matches",
        price: "1199.00",
        salePrice: "949.00",
        categoryId: "football",
        imageUrl: "/src/assets/products/football/imgi_3_default.jpg",
        isActive: true,
        isFeatured: false,
        stock: 30
      }
    ];

    // Create marathon products
    const marathonProducts = [
      {
        id: "marathon-1",
        name: "Marathon Running Jersey Black",
        slug: "marathon-jersey-black",
        description: "Lightweight marathon jersey designed for long-distance running",
        price: "1199.00",
        salePrice: "899.00",
        categoryId: "marathon",
        imageUrl: "/src/assets/products/marathon/download (1).jpeg",
        isActive: true,
        isFeatured: true,
        stock: 20
      },
      {
        id: "marathon-2",
        name: "Pro Marathon Jersey",
        slug: "marathon-jersey-pro",
        description: "Professional marathon jersey with advanced fabric technology",
        price: "1299.00",
        salePrice: "999.00",
        categoryId: "marathon",
        imageUrl: "/src/assets/products/marathon/download (2).jpeg",
        isActive: true,
        isFeatured: false,
        stock: 25
      }
    ];

    // Combine all products
    const allProducts = [...cricketProducts, ...esportsProducts, ...footballProducts, ...marathonProducts];

    // Insert products
    for (const product of allProducts) {
      try {
        await db.insert(products).values(product).onConflictDoNothing();
        console.log(`Created product: ${product.name}`);
      } catch (error) {
        console.log(`Product ${product.name} might already exist`);
      }
    }

    console.log("Real products creation completed!");
    
    // Verify the data
    const allCategories = await db.select().from(categories);
    const allProductsCount = await db.select().from(products);
    
    console.log(`Total categories: ${allCategories.length}`);
    console.log(`Total products: ${allProductsCount.length}`);
    
  } catch (error) {
    console.error("Error creating real products:", error);
  }
}

main();
