import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket with SSL disabled for development
neonConfig.webSocketConstructor = ws;
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineTLS = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with SSL disabled for development
const connectionString = process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=disable');
export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: false
});
export const db = drizzle({ client: pool, schema });

// Retry function for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain types of errors
      if (error instanceof Error && (
        error.message.includes('duplicate key') ||
        error.message.includes('foreign key constraint') ||
        error.message.includes('check constraint')
      )) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError!;
}