import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-tab";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone?: string;
    email?: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  // 1. Try to verify as custom developer/demo JWT first
  if (token.split(".").length === 3) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        phone: string;
        role: string;
      };
      req.user = decoded;
      next();
      return;
    } catch (error) {
      res.status(401).json({ error: "Unauthorized: Invalid JWT token" });
      return;
    }
  }

  // 2. Fallback to Neon Auth session token verification in the database
  try {
    const sessions = await prisma.$queryRaw<any[]>`
      SELECT s.id as "sessionId", s."userId", s."expiresAt", u.email, u.name, u.role
      FROM "neon_auth"."session" s
      JOIN "neon_auth"."user" u ON s."userId" = u.id
      WHERE s.token = ${token}
    `;

    if (!sessions || sessions.length === 0) {
      res.status(401).json({ error: "Unauthorized: Invalid session token" });
      return;
    }

    const session = sessions[0];

    // Check if session has expired
    if (new Date(session.expiresAt) < new Date()) {
      res.status(401).json({ error: "Unauthorized: Session expired" });
      return;
    }

    // Now, query the user in our public.User table to get their synced role and phone if it exists
    const publicUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    req.user = {
      id: session.userId,
      email: session.email,
      role: publicUser?.role || session.role || "SEEKER",
      phone: publicUser?.phone || undefined,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized: Session verification failed" });
  }
};
