import { Router, Response } from "express";
import { prisma } from "../config/database.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Helper - No array serialization/deserialization required since Postgres supports arrays natively
const mapBountyOutput = (bounty: any) => {
  return bounty;
};

// 1. Get all bounties
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const bounties = await prisma.bounty.findMany({
      include: {
        seeker: { select: { name: true, phone: true } },
        dude: { select: { name: true, phone: true } },
        report: true,
        transactions: true,
        dispute: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bounties.map(mapBountyOutput));
  } catch (error) {
    console.error("Error fetching bounties:", error);
    res.status(500).json({ error: "Failed to fetch bounties" });
  }
});

// 2. Get specific bounty details
router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  try {
    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: {
        seeker: { select: { name: true, phone: true } },
        dude: { select: { name: true, phone: true } },
        report: true,
        chat: { orderBy: { createdAt: "asc" } },
        transactions: true,
        dispute: true,
        reviews: true,
      },
    });

    if (!bounty) {
      res.status(404).json({ error: "Bounty not found" });
      return;
    }

    res.json(mapBountyOutput(bounty));
  } catch (error) {
    console.error("Error fetching bounty:", error);
    res.status(500).json({ error: "Failed to fetch bounty details" });
  }
});

// 3. Post a new bounty
router.post(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      id,
      area,
      locationName,
      lat,
      lng,
      budgetMin,
      budgetMax,
      depositMin,
      depositMax,
      roomType,
      genderPref,
      foodPref,
      preferences,
      notes,
      bountyType,
      targetLink,
      payoutAmount,
      escrowAmount,
    } = req.body;

    if (!id || !area || !locationName) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const seekerName = user?.name || "Amit R.";

      const bountyAmount = parseInt(escrowAmount) || 499;

      const bounty = await prisma.bounty.create({
        data: {
          id: id as string,
          area,
          locationName,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          budgetMin: parseInt(budgetMin),
          budgetMax: parseInt(budgetMax),
          depositMin: parseInt(depositMin),
          depositMax: parseInt(depositMax),
          roomType,
          genderPref: genderPref || "Any",
          foodPref,
          preferences: preferences || [],
          notes: notes || "",
          status: "pending",
          seekerId: req.user.id,
          seekerName,
          escrowState: "secured",
          bountyType: bountyType || "scouting",
          targetLink,
          payoutAmount: parseInt(payoutAmount) || 400,
          escrowAmount: bountyAmount,
          transactions: {
            create: {
              userId: req.user.id,
              amount: bountyAmount,
              type: "DEPOSIT",
              status: "SUCCESS",
              razorpayId: `pay_${Math.random().toString(36).substring(2, 11)}`,
            },
          },
        },
        include: {
          seeker: { select: { name: true, phone: true } },
          dude: { select: { name: true, phone: true } },
          report: true,
          chat: true,
          transactions: true,
          dispute: true,
          reviews: true,
        },
      });

      res.status(201).json(mapBountyOutput(bounty));
    } catch (error) {
      console.error("Error creating bounty:", error);
      res.status(500).json({ error: "Failed to post bounty" });
    }
  }
);

// 4. Accept a bounty (Dude only)
router.post(
  "/:id/accept",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.user.role !== "DUDE") {
      res.status(403).json({ error: "Only Dudes can accept bounties" });
      return;
    }

    const id = req.params.id as string;

    try {
      const bounty = await prisma.bounty.findUnique({ where: { id } });

      if (!bounty) {
        res.status(404).json({ error: "Bounty not found" });
        return;
      }

      if (bounty.status !== "pending") {
        res.status(400).json({ error: "Bounty is not open for assignment" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const dudeName = user?.name || "Rahul K.";

      const updated = await prisma.bounty.update({
        where: { id },
        data: {
          status: "visiting",
          dudeId: req.user.id,
          dudeName,
          chat: {
            create: {
              sender: "dude",
              text: `Hello! I've accepted your PG verification bounty. Riding over now to audit coordinates.`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          },
        },
        include: {
          seeker: { select: { name: true, phone: true } },
          dude: { select: { name: true, phone: true } },
          report: true,
          chat: { orderBy: { createdAt: "asc" } },
        },
      });

      res.json(mapBountyOutput(updated));
    } catch (error) {
      console.error("Error accepting bounty:", error);
      res.status(500).json({ error: "Failed to accept verification task" });
    }
  }
);

// 5. Submit room verification report (Dude only)
router.post(
  "/:id/report",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { wifiSpeed, foodRating, photo, location } = req.body;

    if (!wifiSpeed || !foodRating || !photo || !location) {
      res.status(400).json({ error: "Missing report parameters" });
      return;
    }

    try {
      const bounty = await prisma.bounty.findUnique({ where: { id } });

      if (!bounty) {
        res.status(404).json({ error: "Bounty not found" });
        return;
      }

      if (bounty.dudeId !== req.user.id) {
        res.status(403).json({ error: "You are not assigned to this bounty" });
        return;
      }

      const updated = await prisma.bounty.update({
        where: { id },
        data: {
          status: "submitted",
          report: {
            create: {
              wifiSpeed: parseInt(wifiSpeed),
              foodRating,
              photo,
              location,
            },
          },
          chat: {
            create: {
              sender: "dude",
              text: `📋 Physical Verification Audit Uploaded! Wifi Speed: ${wifiSpeed} Mbps, Food quality: ${foodRating}/5. Seeker can now approve payout.`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          },
        },
        include: {
          seeker: { select: { name: true, phone: true } },
          dude: { select: { name: true, phone: true } },
          report: true,
          chat: { orderBy: { createdAt: "asc" } },
        },
      });

      res.json(mapBountyOutput(updated));
    } catch (error) {
      console.error("Error submitting report:", error);
      res.status(500).json({ error: "Failed to submit report details" });
    }
  }
);

// 6. Release escrow funds (Seeker only)
router.post(
  "/:id/release",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;

    try {
      const bounty = await prisma.bounty.findUnique({ where: { id } });

      if (!bounty) {
        res.status(404).json({ error: "Bounty not found" });
        return;
      }

      if (bounty.seekerId !== req.user.id) {
        res.status(403).json({ error: "Only the seeker can release locked funds" });
        return;
      }

      if (!bounty.dudeId) {
        res.status(400).json({ error: "Cannot release funds for an unassigned bounty" });
        return;
      }

      const updated = await prisma.bounty.update({
        where: { id },
        data: {
          status: "completed",
          escrowState: "released",
          chat: {
            create: {
              sender: "seeker",
              text: `Releasing the bounty payout now! Thank you!`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          },
          transactions: {
            create: [
              {
                userId: bounty.dudeId,
                amount: bounty.payoutAmount || 400,
                type: "PAYOUT",
                status: "SUCCESS",
              },
              {
                userId: req.user.id,
                amount: (bounty.escrowAmount || 499) - (bounty.payoutAmount || 400),
                type: "FEE",
                status: "SUCCESS",
              },
            ],
          },
        },
        include: {
          seeker: { select: { name: true, phone: true } },
          dude: { select: { name: true, phone: true } },
          report: true,
          chat: { orderBy: { createdAt: "asc" } },
          transactions: true,
          dispute: true,
          reviews: true,
        },
      });

      res.json(mapBountyOutput(updated));
    } catch (error) {
      console.error("Error releasing funds:", error);
      res.status(500).json({ error: "Failed to disburse escrow funds" });
    }
  }
);

// 7. Register a dispute
router.post(
  "/:id/dispute",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { reason } = req.body;

    try {
      const bounty = await prisma.bounty.findUnique({ where: { id } });

      if (!bounty) {
        res.status(404).json({ error: "Bounty not found" });
        return;
      }

      const updated = await prisma.bounty.update({
        where: { id },
        data: {
          status: "disputed",
          escrowState: "disputed",
          chat: {
            create: {
              sender: req.user.role === "SEEKER" ? "seeker" : "dude",
              text: `⚠️ Dispute registered for this bounty audit log. Admin review requested. Reason: ${reason || "No description provided"}`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          },
          dispute: {
            create: {
              raisedById: req.user.id,
              reason: reason || "No description provided",
              status: "OPEN",
            },
          },
        },
        include: {
          seeker: { select: { name: true, phone: true } },
          dude: { select: { name: true, phone: true } },
          report: true,
          chat: { orderBy: { createdAt: "asc" } },
          transactions: true,
          dispute: true,
          reviews: true,
        },
      });

      res.json(mapBountyOutput(updated));
    } catch (error) {
      console.error("Error raising dispute:", error);
      res.status(500).json({ error: "Failed to dispute transaction" });
    }
  }
);

// 8. Send a chat message
router.post(
  "/:id/chat",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ error: "Message text is required" });
      return;
    }

    try {
      const bounty = await prisma.bounty.findUnique({ where: { id } });

      if (!bounty) {
        res.status(404).json({ error: "Bounty not found" });
        return;
      }

      // Verify that user is participant (Seeker, Dude, or Admin)
      const isParticipant =
        bounty.seekerId === req.user.id ||
        bounty.dudeId === req.user.id ||
        req.user.role === "ADMIN";

      if (!isParticipant) {
        res.status(403).json({ error: "You are not a participant in this bounty chat" });
        return;
      }

      const chatMessage = await prisma.chatMessage.create({
        data: {
          bountyId: id,
          sender: req.user.role === "SEEKER" ? "seeker" : "dude",
          text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      });

      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ error: "Failed to send chat message" });
    }
  }
);

// 9. Submit a review for a completed bounty (Seeker only)
router.post(
  "/:id/review",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { rating, comment } = req.body;

    if (!rating) {
      res.status(400).json({ error: "Rating is required" });
      return;
    }

    try {
      const bounty = await prisma.bounty.findUnique({ where: { id } });

      if (!bounty) {
        res.status(404).json({ error: "Bounty not found" });
        return;
      }

      if (bounty.status !== "completed") {
        res.status(400).json({ error: "Reviews can only be submitted for completed bounties" });
        return;
      }

      if (!bounty.dudeId) {
        res.status(400).json({ error: "No Dude assigned to this bounty" });
        return;
      }

      if (bounty.seekerId !== req.user.id) {
        res.status(403).json({ error: "Only the seeker can review the dude" });
        return;
      }

      const review = await prisma.review.create({
        data: {
          bountyId: id,
          reviewerId: req.user.id,
          revieweeId: bounty.dudeId,
          rating: parseInt(rating),
          comment: comment || "",
        },
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  }
);

export default router;
