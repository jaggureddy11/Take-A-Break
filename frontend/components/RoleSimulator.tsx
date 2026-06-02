"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function RoleSimulator() {
  const pathname = usePathname();

  const buttons = [
    { label: "Landing Page", path: "/", role: "visitor" },
    { label: "Seeker Dashboard", path: "/seeker", role: "seeker" },
    { label: "Dude Dashboard", path: "/dude", role: "dude" },
    { label: "Admin Control", path: "/admin", role: "admin" },
  ];

  return (
    <div className="bg-[#121212] text-white py-2.5 px-6 flex justify-between items-center text-xs font-semibold tracking-wide border-b border-zinc-800 select-none z-50">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#cc5a37] animate-pulse"></span>
        <span className="font-heading uppercase tracking-wider text-[10px]">Role Simulator</span>
      </div>
      <div className="flex gap-2">
        {buttons.map((btn) => {
          const isActive = pathname === btn.path;
          return (
            <Link
              key={btn.path}
              href={btn.path}
              className={`px-3 py-1.5 rounded text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#cc5a37] text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {btn.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
