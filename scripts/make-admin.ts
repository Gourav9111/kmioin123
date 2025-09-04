
import { storage } from "../server/storage.js";

async function makeAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log("Usage: npm run make-admin <username> <password>");
    console.log("Example: npm run make-admin admin admin123");
    process.exit(1);
  }

  try {
    // Check if we have any users first
    const users = await storage.getAllUsers();
    
    if (!users || users.length === 0) {
      console.log("No users found. Please log in to the application first.");
      process.exit(1);
    }

    // Find user by username (assuming username is stored in firstName, lastName, or email)
    const user = users.find(u => 
      u.email?.toLowerCase().includes(username.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(username.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(username.toLowerCase())
    );

    if (!user) {
      console.log(`User '${username}' not found. Available users:`);
      users.forEach(u => {
        console.log(`- ${u.firstName} ${u.lastName} (${u.email})`);
      });
      process.exit(1);
    }

    // For now, we'll just make the first matching user an admin
    // In a real app, you'd want proper password verification
    await storage.promoteToAdmin(user.id);
    console.log(`User '${user.firstName} ${user.lastName}' (${user.email}) has been promoted to admin.`);
    
  } catch (error) {
    console.error("Error making user admin:", error);
    process.exit(1);
  }
}

makeAdmin();
