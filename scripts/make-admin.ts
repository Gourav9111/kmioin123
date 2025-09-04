
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

async function makeAdmin() {
  try {
    const email = "admin@example.com"; // Change this to your desired admin email
    const password = "admin123456"; // Change this to your desired admin password
    
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
      });
      console.log("Admin user created");
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
