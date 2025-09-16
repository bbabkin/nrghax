import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, {
  schema: { ...schema, ...relations },
  logger: process.env.NODE_ENV === 'development'
});

// For migrations (requires max 1 connection)
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient);

// Export schema for easy access
export * from './schema';
export * from './relations';