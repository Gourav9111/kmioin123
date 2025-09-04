
import { db } from "../server/db";
import { adminUsers, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function makeAdmin() {
  try {
    // Get all users to see who to promote
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log("No users found. Please log in to the application first.");
      process.exit(1);
    }

    console.log("Available users:");
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // For now, let's promote the first user
    const userToPromote = allUsers[0];
    
    await db
      .insert(adminUsers)
      .values({ userId: userToPromote.id })
      .onConflictDoUpdate({
        target: adminUsers.userId,
        set: { isActive: true }
      });

    console.log(`✅ Successfully promoted ${userToPromote.firstName} ${userToPromote.lastName} to admin!`);
    console.log(`They can now access the admin panel at /admin`);
    
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

makeAdmin();
