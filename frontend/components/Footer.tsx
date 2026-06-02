import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#121212] text-zinc-400 py-12 px-8 mt-auto border-t border-zinc-800 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div className="max-w-md">
          <div className="flex items-center gap-3.5 mb-6 group select-none">
            <img 
              src="/logo.png" 
              alt="TAB Logo" 
              className="w-14 h-14 object-contain filter drop-shadow-[0_2px_8px_rgba(204,90,55,0.3)] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col justify-center">
              <span className="font-heading font-black text-3xl tracking-tight text-white leading-none">
                TAB<span className="text-[#cc5a37]">.</span>
              </span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mt-1.5 transition-colors group-hover:text-zinc-400">
                Take A Breath
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed">
            Your Local Dude, On The Ground. Direct physical validation of PGs and student accommodations in Bengaluru.
          </p>
        </div>
        <div className="flex gap-16 text-xs">
          <div>
            <h4 className="text-white font-heading font-semibold uppercase mb-4 tracking-wider">Hubs</h4>
            <ul className="flex flex-col gap-2">
              <li><Link href="/seeker" className="hover:text-white transition-colors">Koramangala</Link></li>
              <li><Link href="/seeker" className="hover:text-white transition-colors">HSR Layout</Link></li>
              <li><Link href="/seeker" className="hover:text-white transition-colors">Indiranagar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-heading font-semibold uppercase mb-4 tracking-wider">Company</h4>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="hover:text-white transition-colors">Validation Stories</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Safety & Escrow</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Incubator Grant</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-zinc-800 mt-10 pt-6 text-[10px] flex justify-between">
        <p>&copy; 2026 TAB - Take A Breath. Supported by Bengaluru Student Incubation Hub.</p>
      </div>
    </footer>
  );
}
