import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-tab";

// 1. Send OTP
router.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  const { phone, role } = req.body;

  if (!phone || !role) {
    res.status(400).json({ error: "Phone number and role are required" });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validation

  try {
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    let finalRole = role;

    if (existingUser) {
      // Role is immutable once created to prevent privilege escalation
      finalRole = existingUser.role;
    } else if (role === "ADMIN") {
      // Prevent signing up as ADMIN from the public API route
      res.status(400).json({ error: "Admin registration is not allowed" });
      return;
    }

    // Upsert user safely
    const user = await prisma.user.upsert({
      where: { phone },
      update: { otp, otpExpiry }, // Do NOT update role on existing users
      create: { phone, role: finalRole, otp, otpExpiry },
    });

    console.log(`\n==============================================`);
    console.log(`[SMS MOCK GATEWAY]`);
    console.log(`Sent verification OTP code to user: ${phone}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`Role: ${role}`);
    console.log(`==============================================\n`);

    res.json({
      success: true,
      message: `OTP sent successfully. (Mock code printed to backend terminal: ${otp})`,
    });
  } catch (error) {
    console.error("Error in /send-otp:", error);
    res.status(500).json({ error: "Failed to issue OTP" });
  }
});

// 2. Verify OTP
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400).json({ error: "Phone number and OTP are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Developer override '123456' for ease of testing in development
    const isValidOtp = user.otp === otp || otp === "123456";
    const isExpired = user.otpExpiry && user.otpExpiry < new Date();

    if (!isValidOtp) {
      res.status(400).json({ error: "Invalid verification code" });
      return;
    }

    if (isExpired && otp !== "123456") {
      res.status(400).json({ error: "Verification code has expired" });
      return;
    }

    // Clear OTP details upon validation
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name || (user.role === "SEEKER" ? "Amit R." : "Rahul K."),
      },
    });
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    res.status(500).json({ error: "Validation failure" });
  }
});

// 3. User Profile
router.get(
  "/profile",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { bankDetails: true },
      });

      if (!user) {
        // User exists in Neon Auth but has not completed onboarding in public schema
        res.json({
          onboardingCompleted: false,
          user: {
            id: req.user.id,
            email: req.user.email || "",
            name: "",
            role: "",
          },
        });
        return;
      }

      res.json({
        onboardingCompleted: true,
        user,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ error: "Profile fetch failure" });
    }
  }
);

// 3.5. Register/Onboard Profile
router.post(
  "/register-profile",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, phone, role } = req.body;

    if (!name || !phone || !role) {
      res.status(400).json({ error: "Name, phone, and role are required" });
      return;
    }

    if (role !== "SEEKER" && role !== "DUDE") {
      res.status(400).json({ error: "Role must be SEEKER or DUDE" });
      return;
    }

    try {
      // Check if phone number is already registered by another user
      const existingUserByPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUserByPhone && existingUserByPhone.id !== req.user.id) {
        res.status(400).json({ error: "Phone number is already in use by another user" });
        return;
      }

      // Create or update user in public.User table
      const user = await prisma.user.upsert({
        where: { id: req.user.id },
        update: { name, phone, role },
        create: {
          id: req.user.id,
          phone,
          name,
          role,
        },
        include: { bankDetails: true },
      });

      // Sync role and name back to neon_auth.user table in database
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE "neon_auth"."user" SET role = $1, name = $2 WHERE id = $3',
          role.toLowerCase(),
          name,
          req.user.id
        );
      } catch (dbErr) {
        console.warn("Could not sync role directly to neon_auth.user schema:", dbErr);
      }

      res.json({
        success: true,
        onboardingCompleted: true,
        user,
      });
    } catch (error) {
      console.error("Error registering profile:", error);
      res.status(500).json({ error: "Profile registration failure" });
    }
  }
);

// 4. Update Profile
router.put(
  "/profile",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name } = req.body;

    try {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
        include: { bankDetails: true },
      });

      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: "Profile update failure" });
    }
  }
);

// 5. Get Bank Details
router.get(
  "/profile/bank",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const bankDetails = await prisma.bankDetails.findUnique({
        where: { userId: req.user.id },
      });

      res.json(bankDetails || null);
    } catch (error) {
      console.error("Error fetching bank details:", error);
      res.status(500).json({ error: "Failed to fetch bank details" });
    }
  }
);

// 6. Update Bank Details
router.post(
  "/profile/bank",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { upiId, accountNo, ifscCode, bankName } = req.body;

    try {
      const bankDetails = await prisma.bankDetails.upsert({
        where: { userId: req.user.id },
        update: { upiId, accountNo, ifscCode, bankName },
        create: { userId: req.user.id, upiId, accountNo, ifscCode, bankName },
      });

      res.json({ success: true, bankDetails });
    } catch (error) {
      console.error("Error updating bank details:", error);
      res.status(500).json({ error: "Failed to update bank details" });
    }
  }
);

export default router;
