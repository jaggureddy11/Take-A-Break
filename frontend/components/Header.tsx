"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== "/") {
      router.push(`/#${sectionId}`);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navItems = [
    { label: "How It Works", target: "how-it-works" },
    { label: "Active Dudes Map", target: "active-bounties" },
    { label: "Why TAB", target: "features" },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-zinc-100/90 py-3.5 px-6 md:px-8 sticky top-0 z-40 select-none transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo Lockup */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <img 
            src="/logo.png" 
            alt="TAB Logo" 
            className="w-14 h-14 object-contain group-hover:scale-105 transition-all duration-300 filter drop-shadow-[0_2px_8px_rgba(204,90,55,0.25)]"
          />
          <div className="flex flex-col justify-center">
            <span className="font-heading font-black text-3xl tracking-tight text-zinc-900 leading-none group-hover:text-[#cc5a37] transition-colors duration-300">
              TAB<span className="text-[#cc5a37]">.</span>
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mt-1.5 transition-colors duration-300 group-hover:text-zinc-500">
              Take A Breath
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 text-[13px] font-bold text-[#495057]">
          {navItems.map((item) => (
            <button 
              key={item.target}
              onClick={() => handleScrollToSection(item.target)} 
              className="relative py-1.5 hover:text-[#cc5a37] transition-colors cursor-pointer group/nav"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#cc5a37] transition-all duration-300 group-hover/nav:w-full rounded-full" />
            </button>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            href="/dude" 
            className="px-5 py-2.5 text-xs font-bold border border-zinc-200 text-zinc-700 rounded-lg hover:border-[#cc5a37]/30 hover:bg-[#cc5a37]/5 hover:text-[#cc5a37] transition-all duration-300 flex items-center gap-1.5 group/btn"
          >
            Become a Dude
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse group-hover/btn:scale-110 transition-transform"></span>
          </Link>
          <Link 
            href="/seeker" 
            className="px-5 py-2.5 text-xs font-bold bg-[#cc5a37] hover:bg-[#b84b2c] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg shadow-[#cc5a37]/15 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 group/seeker"
          >
            Post a Bounty
            <ArrowRight size={12} className="group-hover/seeker:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-700 hover:text-[#cc5a37] hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-zinc-100 shadow-lg px-6 py-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4 text-sm font-bold text-[#495057]">
            {navItems.map((item) => (
              <button 
                key={item.target}
                onClick={() => handleScrollToSection(item.target)} 
                className="text-left py-2 hover:text-[#cc5a37] transition-colors border-b border-zinc-50 pb-2 cursor-pointer flex justify-between items-center group"
              >
                <span>{item.label}</span>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-[#cc5a37] transition-colors" />
              </button>
            ))}
          </nav>
          
          <div className="flex flex-col gap-3 pt-2">
            <Link 
              href="/dude" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4.5 py-3 text-xs font-bold border border-zinc-200 text-zinc-700 rounded-lg hover:border-[#cc5a37]/30 hover:bg-[#cc5a37]/5 hover:text-[#cc5a37] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Become a Dude
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </Link>
            <Link 
              href="/seeker" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4.5 py-3 text-xs font-bold bg-[#cc5a37] hover:bg-[#b84b2c] text-white rounded-lg transition-all duration-300 shadow-md shadow-[#cc5a37]/15 flex items-center justify-center gap-2"
            >
              Post a Bounty
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
