"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleScrollToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      router.push(`/#${sectionId}`);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="bg-white border-b border-zinc-100 py-4 px-8 sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img 
            src="/logo.png" 
            alt="TAB Logo" 
            className="w-8 h-8 object-contain rounded bg-[#cc5a37]/5 p-0.5 group-hover:scale-105 transition-all"
          />
          <span className="font-heading font-extrabold text-xl tracking-tight text-black">TAB.</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-[13px] font-bold text-[#495057]">
          <button 
            onClick={() => handleScrollToSection("how-it-works")} 
            className="hover:text-[#cc5a37] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button 
            onClick={() => handleScrollToSection("active-bounties")} 
            className="hover:text-[#cc5a37] transition-colors cursor-pointer"
          >
            Active Dudes Map
          </button>
          <button 
            onClick={() => handleScrollToSection("features")} 
            className="hover:text-[#cc5a37] transition-colors cursor-pointer"
          >
            Why TAB
          </button>
        </nav>
        <div className="flex gap-3">
          <Link 
            href="/dude" 
            className="px-4.5 py-2 text-xs font-bold border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
          >
            Become a Dude
          </Link>
          <Link 
            href="/seeker" 
            className="px-4.5 py-2 text-xs font-bold bg-[#cc5a37] hover:bg-[#b84b2c] text-white rounded transition-colors shadow-sm"
          >
            Post a Bounty
          </Link>
        </div>
      </div>
    </header>
  );
}
