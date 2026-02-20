import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-block mb-4">
          <span className="px-3 py-1 text-xs font-semibold bg-[#9945ff]/20 text-[#9945ff] rounded-full border border-[#9945ff]/30">
            On Solana Devnet
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold font-[family-name:var(--font-space)] tracking-tight">
          <span className="text-white">Block</span>
          <span className="text-[#9945ff]">poly</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 font-medium">
          On-chain Monopoly on Solana.{" "}
          <span className="text-[#00ff88]">Every move is a transaction.</span>{" "}
          Every property is an NFT.
        </p>

        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Buy Jupiter, build Liquidity Pools, dodge the SEC Investigation, and
          survive the Rug Pull Zone. 40 spaces. 22 Solana protocols. 100%
          on-chain.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/lobby"
            className="btn-primary text-lg px-8 py-3 inline-block text-center"
          >
            Play Now
          </Link>
          <a
            href="https://github.com/Blessedbiello/Blockpoly"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-lg px-8 py-3 inline-block text-center"
          >
            View on GitHub
          </a>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center pt-8">
          {[
            "Switchboard VRF Randomness",
            "Metaplex Core NFTs",
            "Helius WebSocket",
            "2–8 Players",
            "Full Monopoly Rules",
            "Session Keys",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1 text-xs text-slate-400 border border-[#1a1a3e] rounded-full bg-[#0d0d22]"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Board preview */}
      <div className="mt-20 grid grid-cols-3 gap-4 max-w-2xl w-full">
        {[
          { name: "Jupiter", group: "Green", price: 300 },
          { name: "Solana", group: "Dark Blue", price: 400 },
          { name: "Helius", group: "Dark Blue", price: 350 },
          { name: "Jito", group: "Green", price: 300 },
          { name: "Nosana", group: "Green", price: 320 },
          { name: "Raydium", group: "Red", price: 220 },
        ].map((p) => (
          <div
            key={p.name}
            className="card p-4 hover:border-[#9945ff]/50 transition-colors"
          >
            <div className="text-xs text-slate-500 mb-1">{p.group}</div>
            <div className="font-semibold text-slate-200">{p.name}</div>
            <div className="bpoly-amount text-sm mt-1">{p.price} BPOLY</div>
          </div>
        ))}
      </div>

      <footer className="mt-20 mb-8 text-slate-600 text-xs text-center">
        Built on Solana · Metaplex · Switchboard VRF · Helius
      </footer>
    </main>
  );
}
