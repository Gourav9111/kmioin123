import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket with better error handling for development
neonConfig.webSocketConstructor = ws;
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = true;
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with improved connection handling
const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({ 
  connectionString: connectionString,
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 5000,
});
export const db = drizzle({ client: pool, schema });

// Retry function for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 500
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