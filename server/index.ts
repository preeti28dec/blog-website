import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { connectDatabase, prisma } from "./config/database";
import authRoutes from "./routes/auth";

// Load environment variables from root directory
// process.cwd() returns the root directory when server is started from root
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Blog API Server is running!",
    status: "connected",
    database: "MongoDB"
  });
});

app.get("/health", async (req, res) => {
  try {
    // Test database connection by running a simple query
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ 
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: "unhealthy",
      database: "disconnected",
      error: "Database connection failed",
      errorCode: error.code,
      errorMessage: error.message,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  }
});

// Diagnostic endpoint to check configuration
app.get("/api/diagnostics", (req, res) => {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const databaseUrlPreview = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    : "Not set";
  
  res.json({
    environment: {
      nodeEnv: process.env.NODE_ENV || "not set",
      port: process.env.PORT || "5000 (default)",
      frontendUrl: process.env.FRONTEND_URL || "not set",
    },
    database: {
      hasDatabaseUrl,
      databaseUrlPreview,
      connectionStringFormat: hasDatabaseUrl 
        ? (process.env.DATABASE_URL?.startsWith("mongodb+srv://") ? "MongoDB Atlas" : "MongoDB Local")
        : "Not configured"
    },
    recommendations: !hasDatabaseUrl ? [
      "Create a .env file in the root directory",
      "Add DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname"
    ] : [
      "If connection fails, check MongoDB Atlas Network Access (whitelist your IP)",
      "Verify database credentials are correct",
      "Ensure MongoDB Atlas cluster is running",
      "Try running: npm run db:generate (stop server first)"
    ]
  });
});

app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Connect to MongoDB and start server
const startServer = async () => {
  // Check if DATABASE_URL is set before starting
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL is not set in environment variables!");
    console.error("💡 Please create a .env file in the root directory with:");
    console.error("   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname");
    console.error("   PORT=5000");
    console.error("   FRONTEND_URL=http://localhost:3000");
    console.error("   JWT_SECRET=your-secret-key");
    process.exit(1);
  }

  // Start server even if MongoDB connection fails
  // This allows API to return proper error messages
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
    console.log(`📡 Frontend should connect to: http://localhost:${PORT}`);
    console.log(`💾 Attempting to connect to MongoDB...`);
  });

  // Try to connect to MongoDB (non-blocking)
  try {
    await connectDatabase();
    console.log("🎉 Server is ready to handle requests!");
  } catch (error: any) {
    console.error("\n⚠️  MongoDB connection failed, but server is running.");
    console.error("⚠️  API endpoints will return database errors until MongoDB is connected.");
    console.error("\n💡 Troubleshooting steps:");
    console.error("   1. Verify DATABASE_URL in .env file is correct");
    console.error("   2. Check if MongoDB Atlas cluster is running");
    console.error("   3. Ensure your IP address is whitelisted in MongoDB Atlas Network Access");
    console.error("   4. Verify database user credentials are correct");
    console.error("   5. Try running: npm run db:generate");
    console.error("   6. Try running: npm run db:push");
  }
};

startServer();

