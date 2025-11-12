import { Request, Response } from "express";
import { prisma } from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key";

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ 
        error: "Database configuration error: DATABASE_URL is not set. Please add it to your .env file." 
      });
    }

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Check if DATABASE_URL is not set
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ 
        error: "Database configuration error: DATABASE_URL is not set. Please add it to your .env file." 
      });
    }
    
    // Check if it's a database connection error
    if (error.code === "P1001" || // Prisma connection error - cannot reach database
        error.code === "P1017" || // Prisma server closed connection
        error.message?.includes("connect") || 
        error.message?.includes("MongoDB") || 
        error.message?.includes("timeout") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("authentication failed") ||
        error.message?.includes("ENOTFOUND")) {
      return res.status(503).json({ 
        error: "Database connection failed. Please check if MongoDB is running and DATABASE_URL is correct.",
        hint: process.env.NODE_ENV === "development" ? 
          "Check your .env file, ensure MongoDB Atlas is running, and your IP is whitelisted." : undefined
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create user",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Check if DATABASE_URL is not set
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ 
        error: "Database configuration error: DATABASE_URL is not set. Please add it to your .env file." 
      });
    }
    
    // Check if it's a database connection error
    if (error.code === "P1001" || // Prisma connection error - cannot reach database
        error.code === "P1017" || // Prisma server closed connection
        error.message?.includes("connect") || 
        error.message?.includes("MongoDB") || 
        error.message?.includes("timeout") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("authentication failed") ||
        error.message?.includes("ENOTFOUND")) {
      return res.status(503).json({ 
        error: "Database connection failed. Please check if MongoDB is running and DATABASE_URL is correct.",
        hint: process.env.NODE_ENV === "development" ? 
          "Check your .env file, ensure MongoDB Atlas is running, and your IP is whitelisted." : undefined
      });
    }
    
    res.status(500).json({ 
      error: "Failed to login",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
};

