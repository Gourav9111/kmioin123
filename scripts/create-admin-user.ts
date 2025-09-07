import { db } from "../server/db.js";
import { hashPassword } from "../server/auth.js";
import { users, adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    
    const adminEmail = "admin@kamio.in";
    const adminPassword = "Kamio@9111";
    
    // Check if admin user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingUser.length > 0) {
      console.log("Admin user already exists with email:", adminEmail);
      
      // Check if already has admin privileges
      const adminRecord = await db.select().from(adminUsers).where(eq(adminUsers.userId, existingUser[0].id));
      
      if (adminRecord.length === 0) {
        // Promote existing user to admin
        await db.insert(adminUsers).values({
          userId: existingUser[0].id,
          role: "admin",
          permissions: ["manage_products", "manage_categories", "manage_orders", "view_analytics"],
          isActive: true,
        });
        console.log("✅ Existing user promoted to admin");
      } else {
        console.log("✅ User already has admin privileges");
      }
      return;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(adminPassword);
    
    // Create the admin user
    const newUser = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      mobileNumber: "9000000000",
      username: "admin",
    }).returning();
    
    console.log("✅ Admin user created:", newUser[0].email);
    
    // Promote to admin
    await db.insert(adminUsers).values({
      userId: newUser[0].id,
      role: "admin",
      permissions: ["manage_products", "manage_categories", "manage_orders", "view_analytics"],
      isActive: true,
    });
    
    console.log("✅ Admin privileges granted");
    console.log("Admin credentials:");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser()
  .then(() => {
    console.log("✅ Admin user setup completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to create admin user:", error);
    process.exit(1);
  });