"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";



const SIM_CHAT_MESSAGES = [
  { sender: "dude", text: "Hey! Just reached the Indiranagar PG. Sending my live coordinates.", delay: 1000 },
  { sender: "dude", type: "loc", text: "📍 Location: Indiranagar 100 Feet Rd PG", delay: 1800 },
  { sender: "seeker", text: "Awesome, please check the room on the 3rd floor. How is the bathroom condition?", delay: 2000 },
  { sender: "dude", text: "Checking. Ventilation is good, geyser is working. Here is a photo of the single room layout.", delay: 2500 },
  { sender: "dude", type: "img", src: "room_premium.jpg", delay: 1500 },
  { sender: "seeker", text: "Looks clean! Did you run a speed test on the Wi-Fi?", delay: 1800 },
  { sender: "dude", type: "speed", text: "📶 Wi-Fi Speed Test Completed:", speed: "94 Mbps", delay: 2000 },
  { sender: "seeker", text: "Perfect, 90+ Mbps is plenty for my remote job. Releasing the bounty payout now! Thank you!", delay: 2500 },
  { sender: "dude", text: "Bounty payout received! Thank you for using TAB. Have a safe move to Bengaluru! 🙌", delay: 2000 }
];

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [simMessages, setSimMessages] = useState<any[]>([]);
  const [simIndex, setSimIndex] = useState(0);
  const simTimer = useRef<NodeJS.Timeout | null>(null);

  // Run chat simulation loop
  useEffect(() => {
    if (simIndex < SIM_CHAT_MESSAGES.length) {
      const msg = SIM_CHAT_MESSAGES[simIndex];
      simTimer.current = setTimeout(() => {
        setSimMessages((prev) => [...prev, msg]);
        setSimIndex((prev) => prev + 1);
      }, msg.delay);
    } else {
      simTimer.current = setTimeout(() => {
        setSimMessages([]);
        setSimIndex(0);
      }, 7000);
    }

    return () => {
      if (simTimer.current) {
        clearTimeout(simTimer.current);
      }
    };
  }, [simIndex]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-24 px-8 border-b border-zinc-100 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/40 via-transparent to-transparent -z-10" />
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#cc5a37]/5 text-[#cc5a37] border border-[#cc5a37]/10 mb-8 select-none">
            ⚡ Get a Dude. Find a Home.
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-6xl text-black leading-tight tracking-tight mb-6">
            Find Your Perfect Bengaluru PG <br />
            <span className="text-[#cc5a37]">Without Moving a Muscle</span>
          </h1>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-2xl mb-10">
            Can't visit PGs in person due to work or college? Take a breath. Raise a bounty, let a local <strong>Dude</strong> physically inspect rooms, record raw video walkthroughs, and run diagnostics for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link 
              href="/seeker" 
              className="px-8 py-4 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold text-sm rounded shadow-sm hover:shadow transition-all"
            >
              Post a Bounty (Start for ₹499)
            </Link>
          </div>

        </div>
      </section>



      {/* 3. Features Bento Grid */}
      <section id="features" className="py-24 px-8 border-b border-zinc-100 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-black text-3xl text-black tracking-tight mb-3">Need a PG? Ask a Dude.</h2>
          <p className="text-sm text-zinc-500">Dudes Know the City Better. No fake reviews, just objective ground truth.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-zinc-100 rounded-lg p-8 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
            <span className="text-3xl mb-4 block select-none">🏍️</span>
            <h3 className="font-heading font-bold text-base text-black mb-2">On-Ground scouting</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Your assigned Dude travels to the exact PG coordinates to inspect room quality, locks, safety, and surroundings.</p>
          </div>
          <div className="border border-zinc-100 rounded-lg p-8 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
            <span className="text-3xl mb-4 block select-none">📶</span>
            <h3 className="font-heading font-bold text-base text-black mb-2">Wi-Fi Diagnostics</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Dudes run direct bandwidth speed tests inside the specific room so you're guaranteed a seamless work setup.</p>
          </div>
          <div className="border border-zinc-100 rounded-lg p-8 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
            <span className="text-3xl mb-4 block select-none">🍲</span>
            <h3 className="font-heading font-bold text-base text-black mb-2">Mess Food Audits</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Dudes verify kitchen hygiene, document daily menu lists, and capture raw food photos first-hand.</p>
          </div>
          <div className="border border-zinc-100 rounded-lg p-8 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
            <span className="text-3xl mb-4 block select-none">🔒</span>
            <h3 className="font-heading font-bold text-base text-black mb-2">Razorpay Escrow Holds</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Your ₹499 rests secure. Dudes are paid only after you inspect their uploaded verification findings and approve the payout.</p>
          </div>
        </div>
      </section>

      {/* 4. Chat Phone Simulator */}
      <section className="py-24 px-8 border-b border-zinc-100 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-black tracking-tight leading-tight">
              Real-Time Ground Updates <br />
              Direct to Your Screen
            </h2>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Watch how Dudes communicate with seekers directly. High-resolution videos, room details, and maps are shared dynamically, helping seekers make decisions in minutes.
            </p>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-[#cc5a37] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">1</span>
                <div>
                  <strong className="text-xs text-black block mb-0.5">Dude Arrives</strong>
                  <span className="text-[11px] text-zinc-500 leading-relaxed">Share live GPS coordinate details and room entries dynamically.</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-[#cc5a37] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">2</span>
                <div>
                  <strong className="text-xs text-black block mb-0.5">Diagnostics Upload</strong>
                  <span className="text-[11px] text-zinc-500 leading-relaxed">Verify router speeds, food checks, and bathroom condition walkthroughs.</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-[#cc5a37] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">3</span>
                <div>
                  <strong className="text-xs text-black block mb-0.5">Disbursal Approved</strong>
                  <span className="text-[11px] text-zinc-500 leading-relaxed">If satisfied, release the payment with a click. Secure split routing triggers immediately.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Mock Screen */}
          <div className="flex justify-center select-none">
            <div className="w-[320px] h-[600px] border-[10px] border-zinc-950 rounded-[40px] bg-zinc-900 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-zinc-950 rounded-full z-20 flex justify-center items-center">
                <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800"></div>
              </div>
              
              {/* Header */}
              <div className="bg-zinc-950 p-4 pt-8 text-white flex items-center gap-3 border-b border-zinc-900 shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#cc5a37]/15 text-[#cc5a37] flex items-center justify-center text-sm font-bold border border-[#cc5a37]/35">
                  🕵️‍♂️
                </div>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-xs font-semibold">Rahul (Your Dude)</strong>
                  <span className="text-[9px] text-[#cc5a37] flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cc5a37] animate-pulse"></span> VISITING PG INDIRANAGAR
                  </span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none bg-zinc-950">
                {simMessages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`max-w-[80%] p-3 rounded-md text-[11px] leading-relaxed ${
                      msg.sender === "dude" 
                        ? "bg-zinc-900 text-zinc-100 self-start border border-zinc-800" 
                        : "bg-[#cc5a37] text-white self-end"
                    }`}
                  >
                    {msg.type === "loc" && (
                      <div className="font-bold flex items-center gap-1">📍 {msg.text}</div>
                    )}
                    {msg.type === "img" && (
                      <div className="flex flex-col gap-1.5">
                        <span>Room Walkthrough View:</span>
                        <div className="aspect-video bg-zinc-800 rounded overflow-hidden flex items-center justify-center border border-zinc-700 relative text-2xl">
                          🏨
                        </div>
                      </div>
                    )}
                    {msg.type === "speed" && (
                      <div className="flex flex-col gap-1 font-bold">
                        <span>{msg.text}</span>
                        <span className="text-[#cc5a37] text-xs font-black">⚡ Speed: {msg.speed}</span>
                      </div>
                    )}
                    {!msg.type && msg.text}
                  </div>
                ))}
              </div>

              {/* Footer Input */}
              <div className="bg-zinc-950 p-4 border-t border-zinc-900 shrink-0 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Message Rahul..." 
                  disabled
                  className="bg-zinc-900 border border-zinc-850 rounded-md flex-1 text-[11px] px-3 py-2 text-zinc-500"
                />
                <button disabled className="bg-zinc-850 text-zinc-500 w-8 h-8 rounded-md flex items-center justify-center text-xs">
                  ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works split card */}
      <section id="how-it-works" className="py-24 px-8 border-b border-zinc-100 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-black text-3xl text-black tracking-tight mb-3">How TAB Operates</h2>
          <p className="text-sm text-zinc-500">A transparent, escrow-protected ecosystem for seekers and dudes.</p>
        </div>
        <div className="max-w-3xl mx-auto w-full">
          <div className="border border-zinc-100 rounded-lg p-8 bg-zinc-50/20 relative">
            <span className="absolute top-6 right-8 text-xs font-bold text-[#cc5a37] uppercase select-none tracking-wider">For Seekers</span>
            <h3 className="font-heading font-extrabold text-xl text-black mb-6">Find Your PG Room</h3>
            <ol className="flex flex-col gap-4 text-xs leading-relaxed text-zinc-600">
              <li className="flex gap-3">
                <strong className="text-[#cc5a37] shrink-0 font-heading">01.</strong>
                <span><strong>Post Bounty Preferences:</strong> Detail room occupancy, budget ranges, and key audit tasks.</span>
              </li>
              <li className="flex gap-3">
                <strong className="text-[#cc5a37] shrink-0 font-heading">02.</strong>
                <span><strong>Lock Escrow Amount:</strong> Secure ₹499 via Razorpay. Held safely on platform rules.</span>
              </li>
              <li className="flex gap-3">
                <strong className="text-[#cc5a37] shrink-0 font-heading">03.</strong>
                <span><strong>Inspect On-Ground:</strong> Chat live, view speed diagnostic tests, and check drainage walkthroughs.</span>
              </li>
              <li className="flex gap-3">
                <strong className="text-[#cc5a37] shrink-0 font-heading">04.</strong>
                <span><strong>Release or Revise:</strong> Approve and routing releases ₹400. If details don't match, ask for revision.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-24 px-8 max-w-4xl mx-auto w-full select-none">
        <div className="text-center mb-16">
          <h2 className="font-heading font-black text-3xl text-black tracking-tight mb-3">Frequently Asked Questions</h2>
          <p className="text-sm text-zinc-500 font-sans">Everything you need to know about the TAB dude ecosystem.</p>
        </div>
        <div className="flex flex-col gap-4">
          {[
            {
              q: "How does the escrow payment system work?",
              a: "When you post a bounty, your ₹499 payment is securely held in escrow via Razorpay Route. It is only released to the Dude's bank account after they upload the verification report and you explicitly click 'Release Funds'. If the PG details do not match or the Dude fails to deliver, you can raise a dispute or claim a refund."
            },
            {
              q: "Who are the Dudes?",
              a: "Dudes are local freelancers, college students, or young professionals living in Bengaluru who know the city well. They are vetted by our platform for identification, communication skills, and safety before they can accept PG verification bounties."
            },
            {
              q: "What specific items will the Dude verify?",
              a: "By default, Dudes verify the exact room conditions, take raw video walkthroughs, run local Wi-Fi speed tests, audit mess food quality (ratings + photos), check water pressure/geyser functionality, and confirm the PG's curfew rules. You can also specify custom items in the special notes when posting a bounty."
            },
            {
              q: "Can I ask the Dude to visit multiple PGs?",
              a: "Each bounty of ₹499 covers a comprehensive ground inspection of a single PG. If you have 3 different PGs you want verified, you can raise 3 separate bounties. Dudes can accept them individually or in bundles."
            }
          ].map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="border border-zinc-100 rounded-lg overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 bg-zinc-50/50 hover:bg-zinc-50 flex justify-between items-center transition-colors font-bold text-xs sm:text-sm text-black cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#cc5a37] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
                  />
                </button>
                {isOpen && (
                  <div className="px-6 py-5 bg-white border-t border-zinc-100 text-xs leading-relaxed text-zinc-500 font-sans">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
