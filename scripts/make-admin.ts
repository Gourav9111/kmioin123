
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

async function makeAdmin() {
  try {
    const email = "admin@admin.com"; // Admin email
    const username = "admin"; // Admin username
    const password = "admin123"; // Admin password
    
    // Check if user already exists
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create the admin user
      const hashedPassword = await hashPassword(password);
      user = await storage.createUser({
        firstName: "Admin",
        lastName: "User",
        email: email,
        password: hashedPassword,
        mobileNumber: "0000000000",
        username: username,
      });
      console.log("Admin user created with username: admin");
    }
    
    // Promote to admin
    await storage.promoteToAdmin(user.id);
    console.log(`User ${email} has been promoted to admin`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

makeAdmin();
