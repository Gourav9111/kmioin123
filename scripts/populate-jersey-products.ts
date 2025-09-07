
import { db } from "../server/db";
import { categories, products } from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const jerseyCategories = [
  { name: "Cricket Jersey", slug: "cricket", description: "High-quality cricket jerseys for teams and individuals" },
  { name: "Football Jersey", slug: "football", description: "Professional football jerseys with premium materials" },
  { name: "Esports Jersey", slug: "esports", description: "Gaming jerseys for esports teams and enthusiasts" },
  { name: "Marathon Jersey", slug: "marathon", description: "Lightweight marathon and running jerseys" },
  { name: "Biker Jersey", slug: "biker", description: "Protective and stylish biker jerseys" }
];

const jerseyProducts = [
  // Cricket Jerseys
  {
    name: "Premium Cricket Team Jersey - Blue",
    slug: "premium-cricket-team-jersey-blue",
    shortDescription: "Professional cricket jersey with moisture-wicking fabric",
    description: "High-quality cricket jersey designed for professional teams. Features moisture-wicking technology, comfortable fit, and durable construction. Perfect for matches and training sessions.",
    price: 1299.00,
    salePrice: 999.00,
    categorySlug: "cricket",
    imageUrl: "/images/cricket/2886288c-fb0d-429d-8f0a-3507c4b0ee10.png",
    stock: 50,
    isFeatured: true
  },
  {
    name: "Classic Cricket Jersey - White",
    slug: "classic-cricket-jersey-white",
    shortDescription: "Traditional white cricket jersey",
    description: "Classic white cricket jersey suitable for all formats of the game. Made with breathable fabric and reinforced stitching.",
    price: 1199.00,
    salePrice: 899.00,
    categorySlug: "cricket",
    imageUrl: "/images/cricket/download (1).jpeg",
    stock: 40,
    isFeatured: false
  },
  {
    name: "Modern Cricket Jersey - Red",
    slug: "modern-cricket-jersey-red",
    shortDescription: "Contemporary red cricket jersey",
    description: "Modern design cricket jersey in vibrant red color. Features advanced fabric technology for comfort during long matches.",
    price: 1399.00,
    salePrice: 1099.00,
    categorySlug: "cricket",
    imageUrl: "/images/cricket/download (2).jpeg",
    stock: 35,
    isFeatured: false
  },

  // Football Jerseys
  {
    name: "Elite Football Jersey - Home Kit",
    slug: "elite-football-jersey-home-kit",
    shortDescription: "Professional football home jersey",
    description: "Premium football jersey designed for professional teams. Features lightweight fabric, moisture management, and ergonomic fit.",
    price: 1599.00,
    salePrice: 1299.00,
    categorySlug: "football",
    imageUrl: "/images/football/imgi_2_default.jpg",
    stock: 60,
    isFeatured: true
  },
  {
    name: "Classic Football Jersey - Away Kit",
    slug: "classic-football-jersey-away-kit",
    shortDescription: "Traditional football away jersey",
    description: "Classic away kit football jersey with traditional design elements. Perfect for team sports and casual wear.",
    price: 1499.00,
    salePrice: 1199.00,
    categorySlug: "football",
    imageUrl: "/images/football/imgi_3_default.jpg",
    stock: 45,
    isFeatured: false
  },
  {
    name: "Modern Football Jersey - Third Kit",
    slug: "modern-football-jersey-third-kit",
    shortDescription: "Contemporary football third jersey",
    description: "Modern third kit jersey with innovative design and advanced fabric technology for optimal performance.",
    price: 1699.00,
    salePrice: 1399.00,
    categorySlug: "football",
    imageUrl: "/images/football/imgi_4_default.jpg",
    stock: 30,
    isFeatured: false
  },

  // Esports Jerseys
  {
    name: "Pro Gaming Jersey - Lightning Design",
    slug: "pro-gaming-jersey-lightning-design",
    shortDescription: "Professional esports gaming jersey",
    description: "High-performance gaming jersey designed for esports professionals. Features cooling technology and ergonomic design for long gaming sessions.",
    price: 1799.00,
    salePrice: 1499.00,
    categorySlug: "esports",
    imageUrl: "/images/esports/08bd8e5f-c4e5-4f02-bd6a-70a072369520.png",
    stock: 25,
    isFeatured: true
  },
  {
    name: "Elite Gaming Jersey - Fire Pattern",
    slug: "elite-gaming-jersey-fire-pattern",
    shortDescription: "Elite esports jersey with fire design",
    description: "Premium gaming jersey with striking fire pattern design. Made with moisture-wicking fabric for comfort during intense gaming.",
    price: 1699.00,
    salePrice: 1399.00,
    categorySlug: "esports",
    imageUrl: "/images/esports/384b3062-2d12-48c0-b609-fcd2a658bdc2.png",
    stock: 20,
    isFeatured: false
  },
  {
    name: "Team Gaming Jersey - Blue Storm",
    slug: "team-gaming-jersey-blue-storm",
    shortDescription: "Team esports jersey with storm design",
    description: "Professional team gaming jersey featuring dynamic blue storm design. Perfect for esports tournaments and team events.",
    price: 1599.00,
    salePrice: 1299.00,
    categorySlug: "esports",
    imageUrl: "/images/esports/4080de9f-8894-4cdf-b4cd-fa5704777efe.png",
    stock: 30,
    isFeatured: false
  },

  // Marathon Jerseys
  {
    name: "Ultra Marathon Jersey - Lightweight",
    slug: "ultra-marathon-jersey-lightweight",
    shortDescription: "Ultra-lightweight marathon running jersey",
    description: "Professional marathon jersey designed for long-distance running. Features ultra-lightweight fabric and superior breathability.",
    price: 1399.00,
    salePrice: 1099.00,
    categorySlug: "marathon",
    imageUrl: "/images/marathon/1dc83684-1a46-4bf4-acab-decf33ab9bc2.png",
    stock: 40,
    isFeatured: true
  },
  {
    name: "Performance Running Jersey - Reflective",
    slug: "performance-running-jersey-reflective",
    shortDescription: "High-performance running jersey with reflective elements",
    description: "Advanced running jersey with reflective strips for safety during night runs. Features moisture-wicking technology.",
    price: 1299.00,
    salePrice: 999.00,
    categorySlug: "marathon",
    imageUrl: "/images/marathon/bb5befd1-f868-46a8-9cde-1780d3985a93.png",
    stock: 35,
    isFeatured: false
  },
  {
    name: "Marathon Elite Jersey - Pro Series",
    slug: "marathon-elite-jersey-pro-series",
    shortDescription: "Elite marathon jersey for professional runners",
    description: "Professional-grade marathon jersey used by elite runners. Features advanced compression and temperature regulation.",
    price: 1599.00,
    salePrice: 1299.00,
    categorySlug: "marathon",
    imageUrl: "/images/marathon/download.jpeg",
    stock: 25,
    isFeatured: false
  }
];

async function populateJerseyProducts() {
  try {
    console.log("Starting to populate jersey products...");

    // First, create categories
    for (const category of jerseyCategories) {
      try {
        const existingCategory = await db.select().from(categories).where(eq(categories.slug, category.slug));
        
        if (existingCategory.length === 0) {
          await db.insert(categories).values({
            id: crypto.randomUUID(),
            name: category.name,
            slug: category.slug,
            description: category.description,
            isActive: true,
            createdAt: new Date()
          });
          console.log(`Created category: ${category.name}`);
        } else {
          console.log(`Category already exists: ${category.name}`);
        }
      } catch (error) {
        console.error(`Error creating category ${category.name}:`, error);
      }
    }

    // Then, create products
    for (const product of jerseyProducts) {
      try {
        // Get category ID
        const categoryResult = await db.select().from(categories).where(eq(categories.slug, product.categorySlug));
        
        if (categoryResult.length === 0) {
          console.error(`Category not found: ${product.categorySlug}`);
          continue;
        }

        const categoryId = categoryResult[0].id;

        // Check if product already exists
        const existingProduct = await db.select().from(products).where(eq(products.slug, product.slug));
        
        if (existingProduct.length === 0) {
          await db.insert(products).values({
            id: crypto.randomUUID(),
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price.toString(),
            salePrice: product.salePrice.toString(),
            categoryId: categoryId,
            imageUrl: product.imageUrl,
            images: [product.imageUrl],
            isActive: true,
            isFeatured: product.isFeatured,
            stock: product.stock,
            availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
            availableColors: [
              {"name": "Red", "hex": "#dc2626"},
              {"name": "Blue", "hex": "#2563eb"},
              {"name": "Black", "hex": "#000000"},
              {"name": "White", "hex": "#ffffff"},
              {"name": "Green", "hex": "#16a34a"}
            ],
            customizationOptions: {
              allowPlayerName: true,
              allowPlayerNumber: true,
              allowTeamLogo: true,
              allowColorChange: true,
              allowSizeSelection: true
            },
            tags: ["jersey", product.categorySlug, "sports", "team", "custom"],
            createdAt: new Date()
          });
          console.log(`Created product: ${product.name}`);
        } else {
          console.log(`Product already exists: ${product.name}`);
        }
      } catch (error) {
        console.error(`Error creating product ${product.name}:`, error);
      }
    }

    console.log("Jersey products population completed!");
    
    // Display summary
    const totalCategories = await db.select().from(categories);
    const totalProducts = await db.select().from(products);
    
    console.log(`\nSummary:`);
    console.log(`Total categories: ${totalCategories.length}`);
    console.log(`Total products: ${totalProducts.length}`);
    
  } catch (error) {
    console.error("Error populating jersey products:", error);
  }
}

// Run the script
populateJerseyProducts()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
