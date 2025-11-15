import express from "express";
import { body } from "express-validator";
import { register, login, getCurrentUser } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", authenticate, getCurrentUser);

export default router;






