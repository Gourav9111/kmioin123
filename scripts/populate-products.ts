
import { db } from "../server/db";
import { categories, products } from "../shared/schema";
import { eq } from "drizzle-orm";

// Sample product data for each category
const productData = {
  cricket: [
    {
      name: "Classic Cricket Team Jersey - Blue",
      description: "Professional cricket team jersey in royal blue with moisture-wicking fabric. Perfect for team matches and practice sessions. Features breathable mesh panels and reinforced stitching for durability.",
      price: "1299.00",
      salePrice: "999.00",
      imageUrl: "/src/assets/products/cricket/download (1).jpeg",
      slug: "classic-cricket-blue-jersey"
    },
    {
      name: "Premium Cricket Jersey - White & Blue",
      description: "Premium quality cricket jersey with white base and blue accents. Made from high-performance polyester blend with UV protection. Ideal for professional cricket teams and academies.",
      price: "1499.00",
      salePrice: "1199.00",
      imageUrl: "/src/assets/products/cricket/download (2).jpeg",
      slug: "premium-cricket-white-blue-jersey"
    },
    {
      name: "Team India Style Cricket Jersey",
      description: "Inspired by Team India colors, this jersey features orange and blue combination with tricolor elements. Made with advanced fabric technology for maximum comfort during long matches.",
      price: "1599.00",
      salePrice: "1299.00",
      imageUrl: "/src/assets/products/cricket/download (3).jpeg",
      slug: "team-india-style-cricket-jersey"
    },
    {
      name: "Elite Cricket Training Jersey",
      description: "Professional training jersey with ergonomic fit and superior breathability. Features quick-dry technology and anti-bacterial treatment. Perfect for daily practice and training sessions.",
      price: "1199.00",
      salePrice: "899.00",
      imageUrl: "/src/assets/products/cricket/download (4).jpeg",
      slug: "elite-cricket-training-jersey"
    },
    {
      name: "Royal Cricket Team Jersey - Green",
      description: "Stunning green cricket jersey with golden accents. Made from lightweight, moisture-wicking fabric. Ideal for teams looking for a premium and distinctive appearance.",
      price: "1399.00",
      salePrice: "1099.00",
      imageUrl: "/src/assets/products/cricket/download (5).jpeg",
      slug: "royal-cricket-green-jersey"
    }
  ],
  esports: [
    {
      name: "Pro Gaming Jersey - Neon Blue",
      description: "Professional esports jersey with vibrant neon blue design. Features ergonomic cut for extended gaming sessions and breathable fabric technology. Perfect for tournaments and streaming.",
      price: "999.00",
      salePrice: "799.00",
      imageUrl: "/src/assets/products/esports/08bd8e5f-c4e5-4f02-bd6a-70a072369520.png",
      slug: "pro-gaming-neon-blue-jersey"
    },
    {
      name: "Elite Esports Team Jersey - Black & Red",
      description: "Premium esports team jersey with aggressive black and red design. Made with moisture-wicking polyester blend for comfort during intense gaming sessions. Customizable with team logos.",
      price: "1199.00",
      salePrice: "949.00",
      imageUrl: "/src/assets/products/esports/384b3062-2d12-48c0-b609-fcd2a658bdc2.png",
      slug: "elite-esports-black-red-jersey"
    },
    {
      name: "Gaming Championship Jersey - Purple",
      description: "Championship-grade gaming jersey with striking purple and black color scheme. Features anti-odor technology and quick-dry fabric. Designed for professional esports athletes.",
      price: "1099.00",
      salePrice: "849.00",
      imageUrl: "/src/assets/products/esports/4080de9f-8894-4cdf-b4cd-fa5704777efe.png",
      slug: "gaming-championship-purple-jersey"
    },
    {
      name: "Streamer Pro Jersey - Orange Flame",
      description: "Eye-catching orange flame design perfect for streamers and content creators. Made with lightweight, breathable fabric for all-day comfort. Includes customization options for personal branding.",
      price: "899.00",
      salePrice: "699.00",
      imageUrl: "/src/assets/products/esports/425cc7e3-7984-4e75-9d76-4008deaf672e.png",
      slug: "streamer-pro-orange-flame-jersey"
    },
    {
      name: "Cyber Gaming Jersey - Electric Blue",
      description: "Futuristic electric blue gaming jersey with cyber-inspired graphics. Features moisture management technology and reinforced seams. Perfect for competitive gaming and esports events.",
      price: "1299.00",
      salePrice: "999.00",
      imageUrl: "/src/assets/products/esports/429271c0-ad45-4f55-8b52-173ba92fa7a2.png",
      slug: "cyber-gaming-electric-blue-jersey"
    }
  ],
  marathon: [
    {
      name: "Marathon Elite Runner Jersey - Red",
      description: "Professional marathon running jersey designed for long-distance performance. Features advanced moisture-wicking technology and reflective elements for safety. Ultra-lightweight construction.",
      price: "1599.00",
      salePrice: "1299.00",
      imageUrl: "/src/assets/products/marathon/1dc83684-1a46-4bf4-acab-decf33ab9bc2.png",
      slug: "marathon-elite-red-jersey"
    },
    {
      name: "Ultra Marathon Training Jersey",
      description: "Specialized training jersey for ultra-marathon runners. Made with premium technical fabric that provides superior breathability and chafe-free comfort for extended runs.",
      price: "1399.00",
      salePrice: "1099.00",
      imageUrl: "/src/assets/products/marathon/bb5befd1-f868-46a8-9cde-1780d3985a93.png",
      slug: "ultra-marathon-training-jersey"
    },
    {
      name: "Marathon Club Jersey - Blue & White",
      description: "Classic marathon club jersey with timeless blue and white design. Features quick-dry technology and ergonomic fit. Perfect for running clubs and marathon events.",
      price: "1199.00",
      salePrice: "899.00",
      imageUrl: "/src/assets/products/marathon/download.jpeg",
      slug: "marathon-club-blue-white-jersey"
    },
    {
      name: "Performance Marathon Jersey - Black",
      description: "High-performance black marathon jersey with sleek design. Made with compression technology for muscle support and enhanced circulation during long runs.",
      price: "1299.00",
      salePrice: "999.00",
      imageUrl: "/src/assets/products/marathon/download (1).jpeg",
      slug: "performance-marathon-black-jersey"
    },
    {
      name: "Marathon Pro Jersey - Gradient Blue",
      description: "Professional marathon jersey with stunning gradient blue design. Features advanced temperature regulation and UV protection. Ideal for competitive marathon runners.",
      price: "1699.00",
      salePrice: "1399.00",
      imageUrl: "/src/assets/products/marathon/e96aac39-751e-4f76-9415-02e6629744b6.png",
      slug: "marathon-pro-gradient-blue-jersey"
    }
  ]
};

async function main() {
  try {
    console.log("Creating categories...");
    
    // Create categories
    const categories_to_create = [
      { name: "Cricket Jersey", slug: "cricket" },
      { name: "Esports Jersey", slug: "esports" },
      { name: "Marathon Jersey", slug: "marathon" }
    ];

    const createdCategories: { [key: string]: string } = {};

    for (const categoryData of categories_to_create) {
      // Check if category already exists
      const existingCategory = await db.select().from(categories).where(eq(categories.slug, categoryData.slug)).limit(1);
      
      let categoryId: string;
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
        console.log(`Category ${categoryData.name} already exists with ID: ${categoryId}`);
      } else {
        const [newCategory] = await db.insert(categories).values(categoryData).returning();
        categoryId = newCategory.id;
        console.log(`Created category ${categoryData.name} with ID: ${categoryId}`);
      }
      
      createdCategories[categoryData.slug] = categoryId;
    }

    console.log("Adding products...");

    // Add products for each category
    for (const [categorySlug, products_list] of Object.entries(productData)) {
      const categoryId = createdCategories[categorySlug];
      
      for (const productInfo of products_list) {
        // Check if product already exists
        const existingProduct = await db.select().from(products).where(eq(products.slug, productInfo.slug)).limit(1);
        
        if (existingProduct.length > 0) {
          console.log(`Product ${productInfo.name} already exists`);
          continue;
        }

        const [newProduct] = await db.insert(products).values({
          ...productInfo,
          categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.7, // Randomly feature some products
          stock: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
        }).returning();
        
        console.log(`Created product: ${newProduct.name}`);
      }
    }

    console.log("Successfully populated database with products!");
    
  } catch (error) {
    console.error("Error populating products:", error);
  }
}

main();
