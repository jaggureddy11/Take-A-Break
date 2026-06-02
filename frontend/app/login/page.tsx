"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, ArrowRight, Star, User } from "lucide-react";
import { authClient } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  
  // Auth Form Inputs
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("SEEKER"); // SEEKER or DUDE
  
  // Step state: 1 = Enter Phone Number, 2 = Verify OTP, 3 = Onboarding
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const BACKEND_URL = "http://localhost:5001";

  // Check active Neon Auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionRes = await authClient.getSession();
        const sessionToken = localStorage.getItem("tab_token");
        
        if (sessionRes.data?.session && sessionToken) {
          setIsLoading(true);
          const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${sessionToken}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.onboardingCompleted) {
              localStorage.setItem("tab_user", JSON.stringify(data.user));
              if (data.user.role === "SEEKER") {
                router.push("/seeker");
              } else {
                router.push("/dude");
              }
            } else {
              // Not completed onboarding yet, show onboarding UI
              setStep(3);
              setPhone(sessionRes.data.user.phoneNumber || "");
            }
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Sanitize and format phone number to E.164 format
  const formatPhoneNumber = (num: string) => {
    let cleaned = num.replace(/\s+/g, ""); // remove spaces
    if (!cleaned.startsWith("+")) {
      // If it doesn't start with +, prepend +91 (default Indian country code)
      cleaned = "+91" + cleaned;
    }
    return cleaned;
  };

  // Send OTP using Neon Auth
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { error: authError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: formattedPhone,
      });

      if (authError) throw new Error(authError.message || "Failed to send verification code");

      setMessage(`Verification code sent to ${formattedPhone}`);
      setStep(2); // Go to OTP entry
      setResendCountdown(60); // 60s countdown
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your phone number.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { error: authError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: formattedPhone,
      });

      if (authError) throw new Error(authError.message || "Failed to resend code");

      setMessage(`Verification code resent to ${formattedPhone}`);
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and sign in
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otpCode) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { error: authError } = await authClient.phoneNumber.verify({
        phoneNumber: formattedPhone,
        code: otpCode,
      });

      if (authError) throw new Error(authError.message || "Invalid verification code");

      // Verify onboarding status
      const sessionToken = localStorage.getItem("tab_token");
      if (!sessionToken) throw new Error("Authentication failed: No session token stored");

      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!res.ok) throw new Error("Failed to retrieve profile");
      const profileData = await res.json();

      if (profileData.onboardingCompleted) {
        localStorage.setItem("tab_user", JSON.stringify(profileData.user));
        if (profileData.user.role === "SEEKER") {
          router.push("/seeker");
        } else {
          router.push("/dude");
        }
      } else {
        setStep(3); // Go to onboarding
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Onboarding (Save name & role)
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !role) return;

    setIsLoading(true);
    setError(null);

    const formattedPhone = formatPhoneNumber(phone);

    try {
      const sessionToken = localStorage.getItem("tab_token");
      if (!sessionToken) throw new Error("Session expired. Please log in again.");

      const res = await fetch(`${BACKEND_URL}/api/auth/register-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ name, phone: formattedPhone, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register profile");

      localStorage.setItem("tab_user", JSON.stringify(data.user));

      if (data.user.role === "SEEKER") {
        router.push("/seeker");
      } else {
        router.push("/dude");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo logins (Uses mock backend OTP flow for backward compatibility/demo)
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
          {step === 1 && "Sign In with Phone"}
          {step === 2 && "Enter Verification Code"}
          {step === 3 && "Complete Your Profile"}
        </h2>
        <p className="mt-2 text-center text-xs text-zinc-500 max-w">
          {step === 1 && "We'll send you a 6-digit OTP code to verify your phone number"}
          {step === 2 && `We sent a security code to ${formatPhoneNumber(phone)}`}
          {step === 3 && "We need a few more details to set up your portal access"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-zinc-150 py-8 px-4 shadow-sm rounded-lg sm:px-10 flex flex-col gap-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-md p-3 text-[11px] font-medium animate-fadeIn">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="bg-orange-50 border border-orange-200 text-[#cc5a37] rounded-md p-3 text-[11px] font-medium animate-fadeIn">
              ℹ️ {message}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Phone Number</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210 (without country code or with +)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-9 pr-3 py-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none placeholder-zinc-400"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  If country code is omitted, +91 (India) will be added automatically.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded transition-all active:scale-[0.99] cursor-pointer select-none flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
              >
                {isLoading ? "Sending OTP..." : "Get OTP Code"} <ArrowRight size={13} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="block w-full text-center text-lg tracking-[0.5em] py-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none placeholder-zinc-300 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold text-xs rounded transition-all active:scale-[0.99] cursor-pointer select-none flex items-center justify-center gap-1 shadow-sm"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"} <ShieldCheck size={14} />
              </button>

              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-zinc-500 hover:text-zinc-700 hover:underline"
                >
                  Change phone number
                </button>
                <button
                  type="button"
                  disabled={isLoading || resendCountdown > 0}
                  onClick={handleResendOtp}
                  className={`font-bold text-[#cc5a37] ${resendCountdown > 0 ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleOnboarding} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Your Full Name</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-3 border border-zinc-200 bg-white rounded focus:border-[#cc5a37]/50 focus:outline-none placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Verified Phone Number</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Phone size={14} />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={formatPhoneNumber(phone)}
                    className="block w-full pl-9 pr-3 py-3 border border-zinc-200 bg-zinc-50 text-zinc-500 rounded focus:outline-none select-none"
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
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded transition-all active:scale-[0.99] cursor-pointer select-none flex items-center justify-center gap-1 shadow-sm"
              >
                {isLoading ? "Saving details..." : "Complete Setup & Access Portal"} <ShieldCheck size={14} />
              </button>
            </form>
          )}

          {/* Quick Demo Entries */}
          {step === 1 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
