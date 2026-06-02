import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#121212] text-zinc-400 py-12 px-8 mt-auto border-t border-zinc-800 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-lg mb-4">
            <div className="w-6 h-6 rounded bg-[#cc5a37] flex items-center justify-center text-xs font-black">
              T
            </div>
            <span>TAB (Take A Breath)</span>
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
