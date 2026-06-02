"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, ArrowRight, Star, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("SEEKER"); // SEEKER or DUDE
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = request otp, 2 = verify otp
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = "http://localhost:5001";

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setMessage(data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid OTP code");

      // Save token & user
      localStorage.setItem("tab_token", data.token);
      localStorage.setItem("tab_user", JSON.stringify(data.user));

      // Redirect
      if (data.user.role === "SEEKER") {
        router.push("/seeker");
      } else {
        router.push("/dude");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo logins
  const handleDemoLogin = async (demoPhone: string, demoRole: string) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Send Mock OTP
      await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: demoPhone, role: demoRole }),
      });

      // 2. Verify with developer override code
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: demoPhone, otp: "123456" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("tab_token", data.token);
      localStorage.setItem("tab_user", JSON.stringify(data.user));

      if (data.user.role === "SEEKER") {
        router.push("/seeker");
      } else {
        router.push("/dude");
      }
    } catch (err: any) {
      setError("Demo authentication failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/50 via-transparent to-transparent -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 rounded-lg bg-[#cc5a37] flex items-center justify-center text-white font-heading font-black text-lg shadow-md select-none">
          TAB
        </div>
        <h2 className="mt-6 text-center text-3xl font-heading font-black tracking-tight text-zinc-950">
          Sign In to TAB
        </h2>
        <p className="mt-2 text-center text-xs text-zinc-500 max-w">
          Enter your phone to access your PG verification portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-zinc-150 py-8 px-4 shadow-sm rounded-lg sm:px-10 flex flex-col gap-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-md p-3 text-[11px] font-medium">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="bg-orange-50 border border-orange-200 text-[#cc5a37] rounded-md p-3 text-[11px] font-medium">
              ℹ️ {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Phone Number</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-9 pr-3 py-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Select Portal Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("SEEKER")}
                    className={`py-3 px-3 border rounded transition-all font-bold text-[11px] cursor-pointer ${
                      role === "SEEKER"
                        ? "bg-[#cc5a37] text-white border-[#cc5a37] shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white"
                    }`}
                  >
                    🔍 Seeker Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("DUDE")}
                    className={`py-3 px-3 border rounded transition-all font-bold text-[11px] cursor-pointer ${
                      role === "DUDE"
                        ? "bg-[#cc5a37] text-white border-[#cc5a37] shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white"
                    }`}
                  >
                    🏍️ Dude Inspector
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded transition-colors cursor-pointer select-none flex items-center justify-center gap-1"
              >
                {isLoading ? "Requesting OTP..." : "Get OTP Code"} <ArrowRight size={13} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Enter Verification Code</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Lock size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code..."
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full pl-9 pr-3 py-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none placeholder-zinc-400 font-mono tracking-widest text-center text-sm"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  Tip: Check the backend server terminal output for the OTP code, or type `123456` in dev mode.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded transition-colors cursor-pointer select-none flex items-center justify-center gap-1"
              >
                {isLoading ? "Verifying..." : "Confirm & Sign In"} <ShieldCheck size={14} />
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-center font-bold text-[#cc5a37] hover:underline"
              >
                Back to Phone request
              </button>
            </form>
          )}

          {/* Quick Demo Entries */}
          <div className="border-t border-zinc-100 pt-6">
            <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider block mb-3 text-center">
              Quick Developer / Demo Logins
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin("+919876543210", "SEEKER")}
                className="w-full py-2.5 px-4 border border-zinc-200 rounded hover:bg-zinc-50 hover:border-zinc-300 font-bold text-xs text-zinc-800 bg-white transition-all cursor-pointer flex justify-between items-center"
              >
                <span>Amit R. (Seeker Profile)</span>
                <span className="text-[9px] text-[#cc5a37] font-extrabold flex items-center gap-0.5">
                  Sign In <Star size={10} fill="currentColor" />
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin("+918765432109", "DUDE")}
                className="w-full py-2.5 px-4 border border-zinc-200 rounded hover:bg-zinc-50 hover:border-zinc-300 font-bold text-xs text-zinc-800 bg-white transition-all cursor-pointer flex justify-between items-center"
              >
                <span>Rahul K. (Dude Inspector)</span>
                <span className="text-[9px] text-[#cc5a37] font-extrabold flex items-center gap-0.5">
                  Sign In <Star size={10} fill="currentColor" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
