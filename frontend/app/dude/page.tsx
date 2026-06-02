"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, Compass, Send, Wifi, Utensils, MessageSquare, Info, ExternalLink } from "lucide-react";

interface ChatMessage {
  id?: string;
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
  genderPref?: string;
  foodPref?: string | null;
  preferences: string[];
  notes: string;
  status: "pending" | "visiting" | "submitted" | "completed" | "disputed";
  seekerName: string;
  dudeName: string | null;
  dudeId?: string | null;
  escrowState: "secured" | "released" | "disputed";
  createdAt: string;
  chat: ChatMessage[];
  report: VerificationReport | null;
  bountyType?: "scouting" | "verification";
  targetLink?: string;
  payoutAmount?: number;
  escrowAmount?: number;
}

function DudeDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const BACKEND_URL = "http://localhost:5001";

  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data State
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<Bounty | null>(null);
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

  // 1. Verify Authentication & Load Tasks
  useEffect(() => {
    const savedToken = localStorage.getItem("tab_token");
    const savedUser = localStorage.getItem("tab_user");

    if (!savedToken || !savedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== "DUDE") {
      router.push("/seeker"); // Seekers should go to Seeker dashboard
      return;
    }

    setToken(savedToken);
    setCurrentUser(parsedUser);

    fetchJobs(savedToken, parsedUser.id);
  }, [idParam]);

  // Load all jobs
  const fetchJobs = async (authToken: string, dudeId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/bounties`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data: Bounty[] = await res.json();
        setBounties(data);

        // Check if there is an active visiting job assigned to me
        const assigned = data.find(b => b.status === "visiting" && b.dudeId === dudeId);
        if (assigned) {
          setActiveJobId(assigned.id);
          setMapsLink(assigned.locationName ? `https://maps.google.com/?q=${encodeURIComponent(assigned.locationName)}` : "");
        } else {
          setActiveJobId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Poll Active Job Details for real-time messages
  useEffect(() => {
    if (!token || !activeJobId) {
      setActiveJob(null);
      return;
    }

    fetchActiveJobDetail();

    const interval = setInterval(fetchActiveJobDetail, 3000);
    return () => clearInterval(interval);
  }, [activeJobId, token]);

  const fetchActiveJobDetail = async () => {
    if (!token || !activeJobId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/bounties/${activeJobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJob(data);
      }
    } catch (err) {
      console.error("Failed to load active job details:", err);
    }
  };

  // 3. Accept Task
  const handleAcceptTask = async (bountyId: string) => {
    if (!token || !currentUser) return;

    // Check if Dude already has a job in progress
    const inProgress = bounties.some(b => b.status === "visiting" && b.dudeId === currentUser.id);
    if (inProgress) {
      showToast("⚠️ Please complete your current active verification task first!");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/bounties/${bountyId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Refresh jobs list
      fetchJobs(token, currentUser.id);
      setActiveJobId(bountyId);
      setMapsLink(data.locationName ? `https://maps.google.com/?q=${encodeURIComponent(data.locationName)}` : "");

      showToast("Bounty accepted. Head over to the coordinates.");
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  // 4. Submit Verification Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeJobId || !currentUser) return;

    const speed = parseInt(wifiSpeed);
    if (isNaN(speed) || speed <= 0) {
      showToast("⚠️ Please enter a valid Wi-Fi speed.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/bounties/${activeJobId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          wifiSpeed: speed,
          foodRating,
          photo: roomPhoto,
          location: mapsLink || `https://maps.google.com/?q=${activeJob?.lat},${activeJob?.lng}`
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed.");
      }

      showToast("Verification report submitted. Awaiting Seeker payout disbursal.");
      setActiveJobId(null);
      setWifiSpeed("");
      fetchJobs(token, currentUser.id);
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  // 5. Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeJobId || !chatMessageInput.trim()) return;

    const textMsg = chatMessageInput.trim();
    setChatMessageInput("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/bounties/${activeJobId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: textMsg })
      });

      if (res.ok) {
        fetchActiveJobDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const completedJobs = bounties.filter(b => b.dudeId === currentUser?.id && b.status === "completed");
  const pendingJobs = bounties.filter(b => b.dudeId === currentUser?.id && b.status === "submitted");
  const unreleasedSum = pendingJobs.reduce((sum, b) => sum + (b.payoutAmount || 400), 0);
  const completedSum = completedJobs.reduce((sum, b) => sum + (b.payoutAmount || 400), 0);
  const availableBounties = bounties.filter(b => b.status === "pending");

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed bottom-10 right-10 bg-black text-white text-xs font-bold px-4 py-3 rounded-lg border border-zinc-800 shadow-2xl flex items-center gap-2 select-none z-50 animate-bounce">
          🔔 <span>{toastText}</span>
        </div>
      )}

      {/* Left Column: Stats */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2 select-none">🕵️‍♂️</span>
            <h3 className="font-heading font-black text-lg text-black">Dude {currentUser?.name || "Rahul K."}</h3>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Online</span>
          </div>

          <div className="border-t border-b border-zinc-100 py-4 flex flex-col gap-3 text-left font-sans text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Unreleased Escrow:</span>
              <strong className="text-black">₹{unreleasedSum}</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-600">
              <span>Total Withdrawn:</span>
              <strong className="font-black">₹{(completedSum).toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 flex flex-col items-center">
              <strong className="font-heading text-lg text-black">{completedJobs.length + pendingJobs.length}</strong>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Jobs Finished</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 flex flex-col items-center">
              <strong className="font-heading text-lg text-black">100%</strong>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Approval Rate</span>
            </div>
          </div>
        </div>

        {/* Leaderboard panel */}
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
          <h4 className="font-heading font-black text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-50 pb-2">Top Dude Rankings</h4>
          <div className="flex flex-col gap-3 font-sans text-xs">
            <div className="flex justify-between items-center text-zinc-800">
              <span className="font-semibold">1. Dude {currentUser?.name || "Rahul K."} (You)</span>
              <strong>100% Acc</strong>
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

      {/* Right Column: Console Workspace */}
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
                  <div key={b.id} className="p-4 border border-zinc-150 rounded-lg flex flex-col gap-3 font-sans">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-heading font-bold text-xs text-black">📍 {b.area}</h4>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase w-max select-none ${
                          b.bountyType === "verification" ? "bg-indigo-50 text-indigo-600 border-indigo-150" : "bg-orange-50 text-[#cc5a37] border-orange-150"
                        }`}>{b.bountyType === "verification" ? "Verification" : "Scouting"}</span>
                      </div>
                      <strong className="text-xs text-[#cc5a37]">₹{b.payoutAmount || 400} Payout</strong>
                    </div>
                    {b.bountyType === "verification" && b.targetLink && (
                      <div className="text-[9px] bg-indigo-50/50 border border-indigo-100/50 rounded px-2 py-1 text-indigo-700 select-all truncate">
                        🔗 {b.targetLink}
                      </div>
                    )}
                    <span className="text-[10px] text-zinc-500">{b.roomType} | Budget: {budgetStr} | Deposit: {depositStr}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1 select-none">
                      {b.preferences.map((p, i) => (
                        <span key={i} className="text-[9px] font-bold border border-zinc-100 bg-zinc-50 px-2 py-0.5 rounded text-zinc-600">
                          {p === "wifi" ? "📶 Wi-Fi" : p === "food" ? "🍽️ Food" : p === "washroom" ? "🚿 Washroom" : p}
                        </span>
                      ))}
                    </div>
                    {b.notes && (
                      <p className="text-[10px] bg-zinc-50 text-zinc-500 p-2 rounded italic">"{b.notes}"</p>
                    )}
                    <button 
                      onClick={() => handleAcceptTask(b.id)}
                      className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-[10px] rounded transition-colors cursor-pointer select-none"
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
        {activeJobId && activeJob ? (
          <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-zinc-50 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-black">Active Job: {activeJob.area} PG Audit</h3>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase select-none ${
                    activeJob.bountyType === "verification" ? "bg-indigo-50 text-indigo-600 border-indigo-150" : "bg-orange-50 text-[#cc5a37] border-orange-150"
                  }`}>{activeJob.bountyType === "verification" ? "Verification" : "Scouting"}</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                  Seeker: {activeJob.seekerName} | Budget: ₹{activeJob.budgetMin.toLocaleString()} - ₹{activeJob.budgetMax.toLocaleString()} | Payout: <strong className="text-[#cc5a37]">₹{activeJob.payoutAmount || 400}</strong>
                  {activeJob.lat && (
                    <a 
                      href={activeJob.bountyType === "verification" && activeJob.targetLink?.startsWith("http") ? activeJob.targetLink : `https://www.google.com/maps/search/?api=1&query=${activeJob.lat},${activeJob.lng}`}
                      target="_blank"
                      className="text-[#cc5a37] font-bold hover:underline ml-2 inline-flex items-center gap-0.5"
                    >
                      (📍 Open Navigation <ExternalLink size={10} />)
                    </a>
                  )}
                </p>
                {activeJob.bountyType === "verification" && activeJob.targetLink && (
                  <div className="mt-1.5 text-[9px] bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 text-indigo-700 flex items-center gap-1 w-max font-sans">
                    <span className="font-semibold">PG Target:</span>
                    <a 
                      href={activeJob.targetLink.startsWith("http") ? activeJob.targetLink : `https://www.google.com/search?q=${encodeURIComponent(activeJob.targetLink)}`}
                      target="_blank"
                      className="font-bold underline hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      {activeJob.targetLink.length > 50 ? `${activeJob.targetLink.substring(0, 50)}...` : activeJob.targetLink} <ExternalLink size={8} />
                    </a>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase ${activeJob.status === "visiting" ? "bg-yellow-50 text-yellow-600" : "bg-emerald-50 text-emerald-600"}`}>{activeJob.status}</span>
            </div>

            {activeJob.status === "visiting" ? (
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
                    <label className="font-bold text-zinc-700">Select Room Walkthrough Video</label>
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
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 font-bold rounded text-xs text-center font-sans">
                ✓ Report uploaded successfully. Payout ₹{activeJob.payoutAmount || 400} is currently in escrow hold awaiting Seeker release.
              </div>
            )}

            {/* Chat room logs */}
            <div className="border border-zinc-100 rounded-lg p-4 bg-zinc-50/30 flex flex-col gap-3 min-h-[160px] max-h-[250px] overflow-y-auto pr-1">
              {activeJob.chat.length === 0 ? (
                <div className="text-center text-zinc-400 py-12 text-xs font-sans flex flex-col items-center gap-1.5">
                  <MessageSquare size={16} />
                  <span>Send a message to coordinate with the Seeker.</span>
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
