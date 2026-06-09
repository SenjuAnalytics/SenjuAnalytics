"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, ExternalLink, ChevronRight, Wifi } from "lucide-react";
import { TEXT_MICRO } from "@/lib/text";
import { TOKEN_STANDARDS } from "@/lib/constants";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Handler to close mobile menu
  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= TOKEN_STANDARDS.MIN_ADDRESS_LENGTH) {
      router.push(`/token/${trimmed}`);
      setQuery("");
      inputRef.current?.blur();
      closeMobileMenu();
    }
  }

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(20,212,232,0.5) 30%, rgba(20,241,149,0.3) 70%, transparent 100%)",
        }}
      />

      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-5 px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-[#14d4e8]/20 group-hover:shadow-[#14d4e8]/40 transition-shadow duration-300">
            <Image
              src="/images/senju2.jpg"
              alt="Senju"
              fill
              sizes="36px"
              className="object-cover object-top scale-110"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-white">SENJU</span>
            <span className={`${TEXT_MICRO} font-medium tracking-widest uppercase`}
              style={{ background: "linear-gradient(90deg,#14d4e8,#14F195)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Analytics
            </span>
          </div>
        </Link>

        {!isHome && (
          <div className="hidden md:flex items-center">
            <div className="h-5 w-px bg-border/50 mx-1" />
          </div>
        )}

        {!isHome && (
        <form onSubmit={handleSearch} className="flex flex-1 items-center max-w-lg">
          <div
            className="relative flex-1 transition-all duration-200"
            style={{ filter: focused ? "drop-shadow(0 0 8px rgba(20,212,232,0.20))" : "none" }}
          >
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search token address..."
              className="w-full h-9 pl-9 pr-20 text-xs bg-white/5 border rounded-lg text-white placeholder:text-muted-foreground/60 outline-none transition-colors duration-200"
              style={{
                borderColor: focused ? "rgba(20,212,232,0.5)" : "rgba(255,255,255,0.08)",
                backgroundColor: focused ? "rgba(20,212,232,0.06)" : "rgba(255,255,255,0.04)",
              }}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query.trim().length >= TOKEN_STANDARDS.MIN_ADDRESS_LENGTH ? (
                <button
                  type="submit"
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 ${TEXT_MICRO} font-medium text-white transition-colors cursor-pointer hover:opacity-90`}
                  style={{ background: "linear-gradient(135deg,#14d4e8,#14F195)" }}
                >
                  Go <ChevronRight className="h-2.5 w-2.5" />
                </button>
              ) : (
                <kbd className={`hidden sm:flex items-center gap-0.5 rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 ${TEXT_MICRO} font-mono text-muted-foreground/60`}>
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        </form>
        )}

        <nav className="hidden md:flex items-center gap-1 ml-auto shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-[#14F195]/20 bg-[#14F195]/5 px-2.5 py-1 mr-2">
            <Wifi className="h-2.5 w-2.5 text-[#14F195]" />
            <span className={`${TEXT_MICRO} font-medium text-[#14F195]`}>Mainnet</span>
          </div>
          {!isHome && (
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Home
            </Link>
          )}
          <a
            href="https://solscan.io"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            Solscan
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://dexscreener.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            DexScreener
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <button
          className="ml-auto md:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-border/40 text-muted-foreground hover:text-white hover:border-border transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/30 bg-card px-4 py-4 md:hidden">
          <div className="mb-3 flex items-center gap-1.5 rounded-full border border-[#14F195]/20 bg-[#14F195]/5 px-3 py-1.5 w-fit">
            <Wifi className="h-2.5 w-2.5 text-[#14F195]" />
            <span className={`${TEXT_MICRO} font-medium text-[#14F195]`}>Solana Mainnet</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {!isHome && (
              <form onSubmit={handleSearch} className="mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search token address..."
                    className="w-full h-9 pl-9 pr-4 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground/60 outline-none"
                  />
                </div>
              </form>
            )}
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
            >
              Home
            </Link>
            <a
              href="https://solscan.io"
              target="_blank"
              rel="noreferrer"
              onClick={closeMobileMenu}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
            >
              Solscan <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://dexscreener.com"
              target="_blank"
              rel="noreferrer"
              onClick={closeMobileMenu}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
            >
              DexScreener <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
