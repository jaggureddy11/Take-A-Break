import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { prisma } from "./config/database.js";
import authRouter from "./routes/auth.js";
import bountyRouter from "./routes/bounties.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/bounties", bountyRouter);

// Health check status route
app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to TAB Backend (Clean Slate)",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// Automated database seeder on launch
const seedDatabase = async () => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("⚙️  Database is blank. Seeding demo users and bounties...");

      // 1. Create Seeker, Dude, and Admin
      const seeker = await prisma.user.create({
        data: {
          phone: "+919876543210",
          name: "Amit R.",
          role: "SEEKER",
        },
      });

      const dude = await prisma.user.create({
        data: {
          phone: "+918765432109",
          name: "Rahul K.",
          role: "DUDE",
        },
      });

      const admin = await prisma.user.create({
        data: {
          phone: "+917654321098",
          name: "Admin Master",
          role: "ADMIN",
        },
      });

      console.log("✔ Seeded users: Seeker (Amit R.), Dude (Rahul K.), Admin (Admin Master)");

      // 2. Create Bounties
      // B-8831 (visiting, assigned to Rahul K)
      await prisma.bounty.create({
        data: {
          id: "B-8831",
          area: "Indiranagar",
          locationName: "100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038",
          lat: 12.9719,
          lng: 77.6412,
          budgetMin: 10000,
          budgetMax: 15000,
          depositMin: 1,
          depositMax: 3,
          roomType: "Single Room",
          genderPref: "Any",
          preferences: JSON.stringify(["wifi", "food", "washroom"]),
          notes: "Please check if the PG Mess has north-Indian food options, and run speed test near the window.",
          status: "visiting",
          seekerId: seeker.id,
          seekerName: seeker.name || "Amit R.",
          dudeId: dude.id,
          dudeName: dude.name || "Rahul K.",
          escrowState: "secured",
          payoutAmount: 400,
          escrowAmount: 499,
          chat: {
            create: [
              {
                sender: "dude",
                text: "Hi Amit, I've accepted your bounty. Heading to the Indiranagar double-story PG near Metro Station now.",
                time: "10:35 AM",
              },
              {
                sender: "seeker",
                text: "Thanks Rahul! Please pay extra attention to the room ventilation.",
                time: "10:38 AM",
              },
              {
                sender: "dude",
                text: "Got it, just reached the PG. Entering the single room on the second floor.",
                time: "10:55 AM",
              },
            ],
          },
        },
      });

      // B-2144 (pending, unassigned)
      await prisma.bounty.create({
        data: {
          id: "B-2144",
          area: "Koramangala",
          locationName: "Koramangala 4th Block, Bengaluru, Karnataka 560034",
          lat: 12.9352,
          lng: 77.6244,
          budgetMin: 8000,
          budgetMax: 12000,
          depositMin: 2,
          depositMax: 2,
          roomType: "Double Sharing",
          genderPref: "Any",
          preferences: JSON.stringify(["wifi", "washroom"]),
          notes: "Must be walking distance to St. John's Hospital. Power backup is critical.",
          status: "pending",
          seekerId: seeker.id,
          seekerName: seeker.name || "Amit R.",
          escrowState: "secured",
          payoutAmount: 400,
          escrowAmount: 499,
        },
      });

      // B-9982 (submitted, assigned to Rahul K, has report)
      await prisma.bounty.create({
        data: {
          id: "B-9982",
          area: "HSR Layout",
          locationName: "Sector 2, HSR Layout, Bengaluru, Karnataka 560102",
          lat: 12.9105,
          lng: 77.645,
          budgetMin: 12000,
          budgetMax: 18000,
          depositMin: 2,
          depositMax: 4,
          roomType: "Single Room",
          genderPref: "Any",
          preferences: JSON.stringify(["wifi", "food", "washroom", "restriction"]),
          notes: "Looking for premium space in Sector 2. Need food quality check.",
          status: "submitted",
          seekerId: seeker.id,
          seekerName: seeker.name || "Amit R.",
          dudeId: dude.id,
          dudeName: dude.name || "Rahul K.",
          escrowState: "secured",
          payoutAmount: 400,
          escrowAmount: 499,
          chat: {
            create: [
              {
                sender: "dude",
                text: "Hey Vikram, done with the detailed walk. Sending the verification report now.",
                time: "09:40 AM",
              },
              {
                sender: "dude",
                text: "The food is surprisingly good. Daily menu includes paneer, dal, and standard roti.",
                time: "09:42 AM",
              },
            ],
          },
          report: {
            create: {
              wifiSpeed: 105,
              foodRating: "5",
              photo: "room_premium.jpg",
              location: "https://maps.google.com/?q=Sector+2+HSR+Layout+Bengaluru",
            },
          },
        },
      });

      // B-1024 (completed, assigned to Rahul K, has report, escrow released)
      await prisma.bounty.create({
        data: {
          id: "B-1024",
          area: "Whitefield",
          locationName: "Whitefield, Bengaluru, Karnataka 560066",
          lat: 12.9698,
          lng: 77.7499,
          budgetMin: 10000,
          budgetMax: 16000,
          depositMin: 1,
          depositMax: 2,
          roomType: "Single Room",
          genderPref: "Any",
          preferences: JSON.stringify(["wifi"]),
          notes: "Check if the flatmates are quiet, and verify mobile reception inside the room.",
          status: "completed",
          seekerId: seeker.id,
          seekerName: seeker.name || "Amit R.",
          dudeId: dude.id,
          dudeName: dude.name || "Rahul K.",
          escrowState: "released",
          payoutAmount: 400,
          escrowAmount: 499,
          chat: {
            create: [
              {
                sender: "dude",
                text: "Mobile signal is full 5G (Airtel and Jio).",
                time: "02:35 PM",
              },
              {
                sender: "seeker",
                text: "Awesome! Looks perfect. Releasing payment now.",
                time: "02:40 PM",
              },
            ],
          },
          report: {
            create: {
              wifiSpeed: 180,
              foodRating: "4",
              photo: "room_double.jpg",
              location: "https://maps.google.com/?q=Whitefield+Bengaluru",
            },
          },
        },
      });

      console.log("✔ Seeded 4 default Bengaluru verification bounties!");
    } else {
      console.log("ℹ️  Database already contains records. Skipping auto-seeding.");
    }
  } catch (error) {
    console.error("❌ Seeding failure on launch:", error);
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/status`);

  // Seed database
  await seedDatabase();
});
