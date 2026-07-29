import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const signToken = (id: number, role: string, name: string) => {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign({ id, role, name }, process.env.JWT_SECRET as string, options);
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: "A user with that email already exists" });
    }

    // Only allow self-registration as cashier by default; admin/manager accounts
    // should be created directly (e.g. via the seed script or an admin tool).
    const safeRole = role === "admin" ? "cashier" : role || "cashier";
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, role: safeRole },
    });

    const token = signToken(user.id, user.role, user.name);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user.id, user.role, user.name);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: (err as Error).message });
  }
};

export const me = async (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
};
