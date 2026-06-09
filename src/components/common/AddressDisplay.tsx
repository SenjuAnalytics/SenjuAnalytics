"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { formatAddress } from "@/lib/formatters";

interface AddressDisplayProps {
  address: string;
  type?: "account" | "tx" | "token";
  chars?: number;
  showFull?: boolean;
  className?: string;
}

export function AddressDisplay({ address, type = "account", chars = 4, showFull = false, className = "" }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const explorerBase = "https://solscan.io";
  const explorerPath = type === "tx" ? "tx" : type === "token" ? "token" : "account";
  const explorerUrl = `${explorerBase}/${explorerPath}/${address}`;

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${className}`}>
      <span className="text-muted-foreground">
        {showFull ? address : formatAddress(address, chars)}
      </span>
      <button
        onClick={handleCopy}
        className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/60 hover:text-white transition-colors"
        title="Copy address"
      >
        {copied ? <Check className="h-3 w-3 text-[#14d4e8]" /> : <Copy className="h-3 w-3" />}
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/60 hover:text-[#14d4e8] transition-colors"
        title="View on Solscan"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </span>
  );
}
