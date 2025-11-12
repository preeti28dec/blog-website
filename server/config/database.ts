import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

let isConnected = false;

export const connectDatabase = async () => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }

    console.log("🔌 Connecting to MongoDB...");
    console.log("📍 Database URL:", process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")); // Hide credentials in logs

    // Connect to database
    await prisma.$connect();
    console.log("✅ Prisma Client connected");

    // Test connection with ping
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("✅ MongoDB connection verified");
    
    isConnected = true;
    return true;
  } catch (error: any) {
    isConnected = false;
    console.error("❌ MongoDB connection error:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Provide helpful error messages
    if (error.code === "P1001") {
      console.error("💡 Cannot reach database server. Check if:");
      console.error("   - MongoDB Atlas cluster is running");
      console.error("   - Your IP address is whitelisted in MongoDB Atlas");
      console.error("   - Network connection is stable");
    } else if (error.code === "P1017") {
      console.error("💡 Server closed the connection. Check if:");
      console.error("   - Database credentials are correct");
      console.error("   - Database name exists");
    } else if (error.message?.includes("authentication failed")) {
      console.error("💡 Authentication failed. Check if:");
      console.error("   - Username and password in DATABASE_URL are correct");
      console.error("   - Database user has proper permissions");
    }
    
    throw error;
  }
};

// Helper function to check connection status
export const isDatabaseConnected = () => isConnected;

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    isConnected = false;
    console.log("✅ Database disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting from database:", error);
  }
};

export { prisma };

