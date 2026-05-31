"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wallet, ShieldAlert, CheckCircle, Award, Compass, Send, Wifi, Utensils, MessageSquare, Info, ExternalLink } from "lucide-react";

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
    genderPref: "Any",
    preferences: ["wifi", "food", "washroom"],
    notes: "Please check if the PG Mess has north-Indian food options, and run speed test near the window.",
    status: "visiting",
    seekerName: "Amit R.",
    dudeName: "Rahul K.",
    escrowState: "secured",
    createdAt: "2026-05-30T10:30:00Z",
    chat: [
      { sender: "dude", text: "Hi Amit, I've accepted your bounty. Heading to the Indiranagar double-story PG near Metro Station now.", time: "10:35 AM" },
      { sender: "seeker", text: "Thanks Rahul! Please pay extra attention to the room ventilation.", time: "10:38 AM" },
      { sender: "dude", text: "Got it, just reached the PG. Entering the single room on the second floor.", time: "10:55 AM" }
    ],
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
    genderPref: "Any",
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

function DudeDashboardContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  // State
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  // Report fields
  const [wifiSpeed, setWifiSpeed] = useState("");
  const [foodRating, setFoodRating] = useState("5");
  const [roomPhoto, setRoomPhoto] = useState("room_premium.jpg");
  const [mapsLink, setMapsLink] = useState("");
  const [chatMessageInput, setChatMessageInput] = useState("");

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3000);
  };

  // Sync Database
  useEffect(() => {
    const data = localStorage.getItem("tab_db");
    let loaded: Bounty[] = [];
    if (data) {
      try {
        loaded = JSON.parse(data);
        setBounties(loaded);
      } catch (e) {
        loaded = DEFAULT_BOUNTIES;
        setBounties(loaded);
      }
    } else {
      loaded = DEFAULT_BOUNTIES;
      localStorage.setItem("tab_db", JSON.stringify(DEFAULT_BOUNTIES));
      setBounties(DEFAULT_BOUNTIES);
    }

    // Rahul K (the active simulated Dude) gets assigned the visiting jobs
    const active = loaded.find(b => b.status === "visiting" && b.dudeName === "Rahul K.");
    if (active) {
      setActiveJobId(active.id);
      setMapsLink(active.locationName ? `https://maps.google.com/?q=${encodeURIComponent(active.locationName)}` : "");
    }
  }, [idParam]);

  // 1. Accept Task
  const handleAcceptTask = (bountyId: string) => {
    // Cannot accept another if one is in progress
    const alreadyVisiting = bounties.some(b => b.status === "visiting" && b.dudeName === "Rahul K.");
    if (alreadyVisiting) {
      showToast("⚠️ Please finish or submit your current accepted task first!");
      return;
    }

    const updated = bounties.map(b => {
      if (b.id === bountyId) {
        return {
          ...b,
          status: "visiting" as const,
          dudeName: "Rahul K.",
          chat: [
            ...b.chat,
            {
              sender: "dude" as const,
              text: `Hello! I've accepted your PG verification bounty for ${b.locationName || b.area}. Riding over now to audit coordinates.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return b;
    });

    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));
    setActiveJobId(bountyId);
    setMapsLink(`https://maps.google.com/?q=${encodeURIComponent(bounties.find(b => b.id === bountyId)?.locationName || "")}`);
    showToast(`Bounty task accepted. Heading to coordinates.`);
  };

  // 2. Submit Verification Report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;

    const speed = parseInt(wifiSpeed);
    if (isNaN(speed) || speed <= 0) {
      showToast("⚠️ Please enter a valid Wi-Fi speed.");
      return;
    }

    const updated = bounties.map(b => {
      if (b.id === activeJobId) {
        return {
          ...b,
          status: "submitted" as const,
          report: {
            wifiSpeed: speed,
            foodRating,
            photo: roomPhoto,
            location: mapsLink || `https://maps.google.com/?q=${b.lat},${b.lng}`
          },
          chat: [
            ...b.chat,
            {
              sender: "dude" as const,
              text: `📋 Physical Verification Audit Uploaded! Wifi Speed: ${speed} Mbps, Food quality: ${foodRating}/5. Seeker can now approve payout.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return b;
    });

    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));
    setActiveJobId(null);
    setWifiSpeed("");
    showToast("Verification report submitted successfully. Payout is in escrow hold.");
  };

  // 3. Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId || !chatMessageInput.trim()) return;

    const updated = bounties.map(b => {
      if (b.id === activeJobId) {
        return {
          ...b,
          chat: [
            ...b.chat,
            {
              sender: "dude" as const,
              text: chatMessageInput.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return b;
    });

    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));
    setChatMessageInput("");
  };

  // Stats calculation for simulated Dude (Rahul K)
  const completedJobs = bounties.filter(b => b.dudeName === "Rahul K." && b.status === "completed");
  const pendingJobs = bounties.filter(b => b.dudeName === "Rahul K." && b.status === "submitted");
  const availableBounties = bounties.filter(b => b.status === "pending");
  const activeJob = bounties.find(b => b.id === activeJobId);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed bottom-10 right-10 bg-black text-white text-xs font-bold px-4 py-3 rounded-lg border border-zinc-850 shadow-2xl flex items-center gap-2 select-none z-50 animate-bounce">
          🔔 <span>{toastText}</span>
        </div>
      )}

      {/* Left Column: Stats & Rankings (cols 4) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2 select-none">🕵️‍♂️</span>
            <h3 className="font-heading font-black text-lg text-black">Dude Rahul K.</h3>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Online</span>
          </div>

          <div className="border-t border-b border-zinc-100 py-4 flex flex-col gap-3 text-left font-sans text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Unreleased Earnings:</span>
              <strong className="text-black">₹{pendingJobs.length * 400}</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-600">
              <span>Total Withdrawn:</span>
              <strong className="font-black">₹{(completedJobs.length * 400 + 3200).toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 flex flex-col items-center">
              <strong className="font-heading text-lg text-black">{completedJobs.length + pendingJobs.length + 8}</strong>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Jobs Finished</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 flex flex-col items-center">
              <strong className="font-heading text-lg text-black">98%</strong>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Approval Rate</span>
            </div>
          </div>
        </div>

        {/* Leaderboard panel */}
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
          <h4 className="font-heading font-black text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-50 pb-2">Top Dude Rankings</h4>
          <div className="flex flex-col gap-3 font-sans text-xs">
            <div className="flex justify-between items-center text-zinc-800">
              <span className="font-semibold">1. Dude Rahul K. (You)</span>
              <strong>98% Acc</strong>
            </div>
            <div className="flex justify-between items-center text-zinc-500">
              <span>2. Priya L.</span>
              <strong>96% Acc</strong>
            </div>
            <div className="flex justify-between items-center text-zinc-500">
              <span>3. Amit V.</span>
              <strong>95% Acc</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Console & Job logs (cols 8) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Available Tasks list */}
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-black text-xl text-black">Available Tasks</h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-600">{availableBounties.length} Available</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans mb-2">Select an open bounty near you, visit the PG coordinates in person, and run diagnostics to secure the ₹400 payout.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableBounties.length === 0 ? (
              <div className="col-span-2 text-center text-zinc-400 py-12 text-xs font-sans flex flex-col items-center gap-1.5 border border-dashed border-zinc-200 rounded-lg">
                <Compass size={20} className="text-zinc-300 animate-spin-slow" />
                <span>No available tasks in Bengaluru right now. New seekers post bounties daily.</span>
              </div>
            ) : (
              availableBounties.map(b => {
                const budgetStr = `₹${b.budgetMin.toLocaleString()} - ₹${b.budgetMax.toLocaleString()}`;
                const depositStr = `${b.depositMin} - ${b.depositMax} months`;
                return (
                  <div key={b.id} className="p-4 border border-zinc-150 rounded-lg flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-heading font-bold text-xs text-black">📍 {b.area}</h4>
                      <strong className="text-xs text-[#cc5a37]">₹400 Payout</strong>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-sans">{b.roomType} | Budget: {budgetStr} | Deposit: {depositStr}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1 select-none">
                      {b.preferences.map((p, i) => (
                        <span key={i} className="text-[9px] font-bold border border-zinc-100 bg-zinc-50 px-2 py-0.5 rounded text-zinc-600">
                          {p === "wifi" ? "📶 Wi-Fi" : p === "food" ? "🍽️ Food" : p === "washroom" ? "🚿 Washroom" : p}
                        </span>
                      ))}
                    </div>
                    {b.notes && (
                      <p className="text-[10px] bg-zinc-50 text-zinc-500 p-2 rounded italic font-sans">"{b.notes}"</p>
                    )}
                    <button 
                      onClick={() => handleAcceptTask(b.id)}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[10px] rounded transition-colors cursor-pointer select-none"
                    >
                      Accept Verification Task
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active accepted task details workspace */}
        {activeJob ? (
          <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-zinc-50 pb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-black">Active Job: {activeJob.area} PG Audit</h3>
                <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                  Seeker: {activeJob.seekerName} | Budget: ₹{activeJob.budgetMin.toLocaleString()} - ₹{activeJob.budgetMax.toLocaleString()}
                  {activeJob.lat && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${activeJob.lat},${activeJob.lng}`}
                      target="_blank"
                      className="text-[#cc5a37] font-bold hover:underline ml-2 inline-flex items-center gap-0.5"
                    >
                      (📍 Open Navigation <ExternalLink size={10} />)
                    </a>
                  )}
                </p>
              </div>
              <span className="text-[10px] font-black bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded uppercase">In Progress</span>
            </div>

            {/* Verification findings submission form */}
            <div className="border border-zinc-100 rounded-lg p-5 bg-zinc-50/50">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-500 mb-4 select-none">Upload Verification Findings</h3>
              
              <form onSubmit={handleSubmitReport} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Measured Wi-Fi Speed (Mbps)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 95" 
                    required
                    value={wifiSpeed}
                    onChange={(e) => setWifiSpeed(e.target.value)}
                    className="p-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none" 
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Kitchen Food Audit (1-5)</label>
                  <select 
                    value={foodRating}
                    onChange={(e) => setFoodRating(e.target.value)}
                    className="p-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none"
                  >
                    <option value="5">5/5 - Highly Clean & Delicious</option>
                    <option value="4">4/5 - Clean and Decent Taste</option>
                    <option value="3">3/5 - Average Hygiene / Basic Taste</option>
                    <option value="2">2/5 - Poor Hygiene</option>
                    <option value="1">1/5 - Unsatisfactory</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Select Room Walkthrough Mock Video</label>
                  <select 
                    value={roomPhoto}
                    onChange={(e) => setRoomPhoto(e.target.value)}
                    className="p-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none"
                  >
                    <option value="room_premium.jpg">Premium Single Room Walkthrough (Standard Mock)</option>
                    <option value="room_double.jpg">Double Sharing Walkthrough (Standard Mock)</option>
                    <option value="room_messy.jpg">Economy Room Inspection (Standard Mock)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Google Maps Verified Pin Link</label>
                  <input 
                    type="text" 
                    required
                    value={mapsLink}
                    onChange={(e) => setMapsLink(e.target.value)}
                    className="p-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="sm:col-span-2 mt-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors cursor-pointer select-none"
                >
                  Submit Verification Report & Request Payout
                </button>
              </form>
            </div>

            {/* Chat room logs */}
            <div className="border border-zinc-100 rounded-lg p-4 bg-zinc-50/30 flex flex-col gap-3 min-h-[160px] max-h-[250px] overflow-y-auto pr-1">
              {activeJob.chat.length === 0 ? (
                <div className="text-center text-zinc-400 py-12 text-xs font-sans flex flex-col items-center gap-1.5">
                  <MessageSquare size={16} />
                  <span>Send a message to introduce yourself to the PG seeker.</span>
                </div>
              ) : (
                activeJob.chat.map((msg, i) => {
                  const isDude = msg.sender === "dude";
                  return (
                    <div 
                      key={i}
                      className={`max-w-[75%] p-3 rounded-md text-xs leading-relaxed ${
                        isDude ? "bg-[#cc5a37] text-white self-end" : "bg-zinc-100 text-zinc-800 self-start border border-zinc-200"
                      }`}
                    >
                      <div>{msg.text}</div>
                      <span className="text-[9px] opacity-75 float-right mt-1.5 font-mono">{msg.time}</span>
                      <div className="clear-both" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Message the PG seeker..."
                required
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                className="flex-1 p-3 border border-zinc-200 rounded text-xs focus:border-[#cc5a37]/50 focus:outline-none"
              />
              <button 
                type="submit"
                className="px-5 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold text-xs rounded transition-colors flex items-center justify-center cursor-pointer select-none"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 rounded-lg py-24 text-center text-zinc-400 text-xs font-sans flex flex-col items-center justify-center gap-2">
            <Info size={20} className="text-zinc-300" />
            <span>Select and accept an available task above to start ground verification audits.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DudeDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Loading Dude Console...</div>}>
      <DudeDashboardContent />
    </Suspense>
  );
}
