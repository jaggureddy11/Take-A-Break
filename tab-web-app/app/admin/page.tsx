"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Coins, BarChart3, Database, FileText } from "lucide-react";

interface ChatMessage {
  sender: "seeker" | "dude";
  text: string;
  time: string;
}

interface VerificationReport {
  wifiSpeed: number;
  foodRating: string;
  photo: string;
  location: string;
}

interface Bounty {
  id: string;
  area: string;
  locationName: string;
  lat: number;
  lng: number;
  budgetMin: number;
  budgetMax: number;
  depositMin: number;
  depositMax: number;
  roomType: string;
  genderPref: string;
  foodPref?: string | null;
  preferences: string[];
  notes: string;
  status: "pending" | "visiting" | "submitted" | "completed" | "disputed";
  seekerName: string;
  dudeName: string | null;
  escrowState: "secured" | "released" | "disputed";
  createdAt: string;
  chat: ChatMessage[];
  report: VerificationReport | null;
}

const DEFAULT_BOUNTIES: Bounty[] = [
  {
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
    preferences: ["wifi", "food", "washroom"],
    notes: "Please check if the PG Mess has north-Indian food options, and run speed test near the window.",
    status: "visiting",
    seekerName: "Amit R.",
    dudeName: "Rahul K.",
    escrowState: "secured",
    createdAt: "2026-05-30T10:30:00Z",
    chat: [],
    report: null
  },
  {
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
    preferences: ["wifi", "washroom"],
    notes: "Must be walking distance to St. John's Hospital. Power backup is critical.",
    status: "pending",
    seekerName: "Neha S.",
    dudeName: null,
    escrowState: "secured",
    createdAt: "2026-05-30T11:45:00Z",
    chat: [],
    report: null
  }
];

export default function AdminControl() {
  const router = useRouter();
  const [bounties, setBounties] = useState<Bounty[]>([]);

  // Sync Database
  useEffect(() => {
    const data = localStorage.getItem("tab_db");
    if (data) {
      try {
        setBounties(JSON.parse(data));
      } catch (e) {
        setBounties(DEFAULT_BOUNTIES);
      }
    } else {
      localStorage.setItem("tab_db", JSON.stringify(DEFAULT_BOUNTIES));
      setBounties(DEFAULT_BOUNTIES);
    }
  }, []);

  // Compute platform statistics
  let totalEscrow = 0;
  let platformRevenue = 0;

  bounties.forEach(b => {
    if (b.status !== "completed") {
      totalEscrow += 499;
    } else {
      platformRevenue += 99;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Completed</span>;
      case "submitted":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-150 uppercase">Report Ready</span>;
      case "visiting":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-150 uppercase">Dude Visiting</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-150 uppercase">Pending</span>;
    }
  };

  const getEscrowBadge = (state: string) => {
    switch (state) {
      case "released":
        return <span className="text-[10px] font-bold text-zinc-500">₹400 Sent / ₹99 Rev</span>;
      case "disputed":
        return <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">⚠️ Hold / Disputed</span>;
      default:
        return <span className="text-[10px] font-bold text-black">₹499 Secured</span>;
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-8 flex flex-col gap-8 font-sans">
      {/* 1. Admin Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <Shield size={40} className="text-zinc-50 absolute -right-2 -bottom-2" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Bounties Raised</span>
          <strong className="font-heading font-black text-2xl text-black">{bounties.length}</strong>
          <span className="text-[9px] text-zinc-400">Seeker inspection posts</span>
        </div>

        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <Coins size={40} className="text-zinc-50 absolute -right-2 -bottom-2" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Escrow Holds</span>
          <strong className="font-heading font-black text-2xl text-black">₹{totalEscrow.toLocaleString()}</strong>
          <span className="text-[9px] text-zinc-400">Locked in Razorpay split routing</span>
        </div>

        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <BarChart3 size={40} className="text-zinc-50 absolute -right-2 -bottom-2" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Platform Revenue</span>
          <strong className="font-heading font-black text-2xl text-black">₹{platformRevenue.toLocaleString()}</strong>
          <span className="text-[9px] text-zinc-400">Accumulated flat service fees</span>
        </div>

        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <Database size={40} className="text-zinc-50 absolute -right-2 -bottom-2" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Verified PGs Database</span>
          <strong className="font-heading font-black text-2xl text-black">{bounties.filter(b => b.status === "completed").length + 48}</strong>
          <span className="text-[9px] text-zinc-400">Audit logs on-record</span>
        </div>
      </div>

      {/* 2. Global Bounty Transaction Log */}
      <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-black mb-1">Global Bounty Transaction Log</h2>
          <p className="text-[11px] text-zinc-500">Live platform activities tracking coordinates allocations and transaction releases.</p>
        </div>

        <div className="overflow-x-auto border border-zinc-100 rounded-lg mt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold uppercase text-zinc-500 select-none">
                <th className="p-4">Bounty ID</th>
                <th className="p-4">Area</th>
                <th className="p-4">Budget Range</th>
                <th className="p-4">Seeker</th>
                <th className="p-4">Assigned Dude</th>
                <th className="p-4">Status</th>
                <th className="p-4">Razorpay Escrow</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {bounties.map(b => (
                <tr key={b.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-black">{b.id}</td>
                  <td className="p-4">📍 {b.area}</td>
                  <td className="p-4">₹{b.budgetMin.toLocaleString()} - ₹{b.budgetMax.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-zinc-800">{b.seekerName}</td>
                  <td className="p-4 text-zinc-600">{b.dudeName || <span className="text-zinc-300 font-medium">None</span>}</td>
                  <td className="p-4">{getStatusBadge(b.status)}</td>
                  <td className="p-4">{getEscrowBadge(b.escrowState)}</td>
                  <td className="p-4 select-none">
                    <button 
                      onClick={() => router.push(`/seeker?id=${b.id}`)}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 rounded font-semibold text-[10px] text-zinc-800 cursor-pointer transition-all inline-flex items-center gap-1"
                    >
                      <FileText size={11} /> Inspect Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
