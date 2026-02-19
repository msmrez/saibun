"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Code2,
  BookOpen,
  Copy,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  FileText,
  Loader2,
  ExternalLink,
  KeyRound,
  Wallet,
  Eye,
  EyeOff,
  Puzzle,
  Wrench,
  Send,
  Calculator,
  Trophy,
  ShoppingCart,
  Clock,
  Shield,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  buildCustomLockTransaction,
  buildCustomUnlockTransaction,
  broadcastTransaction,
  type BuildTransactionResult,
} from "@/lib/script-playground";
import {
  isValidPrivateKey,
  isValidAddress,
  importFromPrivateKey,
  fetchUtxosWithRawTx,
  fetchRawTransaction,
  type BitailsUtxo,
} from "@/lib/bsv";

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function textToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(hex: string): Promise<string> {
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Encode a non-negative integer as a Bitcoin script number ASM token. */
function numToASMToken(n: number): string {
  if (n < 0) throw new Error("Negative numbers not supported");
  if (n === 0) return "OP_0";
  if (n >= 1 && n <= 16) return `OP_${n}`;
  // Little-endian encoding; if MSB of last byte is set, append 0x00 (sign byte)
  const bytes: number[] = [];
  let rem = n;
  while (rem > 0) {
    bytes.push(rem & 0xff);
    rem = Math.floor(rem / 256);
  }
  if (bytes[bytes.length - 1] & 0x80) bytes.push(0x00);
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Decode a Bitcoin script number ASM token back to a JS number. */
function scriptTokenToNum(token: string): number {
  if (!token || token === "OP_0" || token === "OP_FALSE") return 0;
  const opMatch = token.match(/^OP_(\d+)$/);
  if (opMatch) return parseInt(opMatch[1], 10);
  const bytes: number[] = [];
  for (let i = 0; i < token.length; i += 2)
    bytes.push(parseInt(token.slice(i, i + 2), 16));
  if (!bytes.length) return 0;
  const isNeg = (bytes[bytes.length - 1] & 0x80) !== 0;
  bytes[bytes.length - 1] &= 0x7f;
  let val = 0;
  for (let i = bytes.length - 1; i >= 0; i--) val = val * 256 + bytes[i];
  return isNeg ? -val : val;
}

// ---------------------------------------------------------------------------
//  Contract type definitions
// ---------------------------------------------------------------------------

type ContractId = "computation-bounty" | "hash-bounty" | "data-marketplace" | "time-vault";

interface ContractDef {
  id: ContractId;
  name: string;
  icon: React.ElementType;
  tagline: string;
  concept: string;
  lockPattern: string;
  deployFields: { id: string; label: string; placeholder: string; help: string }[];
  buildLockASM: (p: Record<string, string>) => Promise<{ asm: string; note?: string }>;
  executePaths: {
    id: string;
    label: string;
    description: string;
    fields: { id: string; label: string; placeholder: string; help?: string }[];
    buildUnlock: (p: Record<string, string>, lockASM: string) => { asm: string; useCltv: boolean };
  }[];
}

const CONTRACTS: ContractDef[] = [
  // ── 1. Computation Bounty ─────────────────────────────────────────────────
  {
    id: "computation-bounty",
    name: "Computation Bounty",
    icon: Calculator,
    tagline: "Post a math problem on-chain. First solver wins.",
    concept:
      "Lock BSV to a publicly verifiable math problem. Anyone who finds the solution — a number x " +
      "such that x² mod N = M — can claim the funds. The deployer sets the problem by choosing N and a " +
      "known solution x; the contract embeds only N and M = x² mod N. Verification is purely on-chain: " +
      "OP_DUP OP_MUL OP_MOD OP_EQUAL. No trusted oracle needed.",
    lockPattern: "OP_DUP OP_MUL <N> OP_MOD <M> OP_EQUAL",
    deployFields: [
      {
        id: "N",
        label: "Modulus (N)",
        placeholder: "e.g. 101",
        help: "A positive integer ≥ 2 that defines the problem space. Using a prime makes the problem harder.",
      },
      {
        id: "x",
        label: "Your Solution (x)",
        placeholder: "e.g. 9",
        help: "The answer only you know. The contract will embed M = x² mod N without revealing x.",
      },
    ],
    buildLockASM: async (p) => {
      const N = parseInt(p.N, 10);
      const x = parseInt(p.x, 10);
      if (isNaN(N) || N < 2) throw new Error("N must be an integer ≥ 2");
      if (isNaN(x) || x < 1) throw new Error("x must be a positive integer");
      const M = ((x * x) % N + N) % N;
      const asm = `OP_DUP OP_MUL ${numToASMToken(N)} OP_MOD ${numToASMToken(M)} OP_EQUAL`;
      return { asm, note: `Problem: find x where x² mod ${N} = ${M}` };
    },
    executePaths: [
      {
        id: "solve",
        label: "Submit Solution",
        description: "Push the number x that satisfies x² mod N = M",
        fields: [
          {
            id: "x",
            label: "Solution (x)",
            placeholder: "Enter the integer x...",
            help: "The script verifies: x × x mod N = M",
          },
        ],
        buildUnlock: (p) => ({
          asm: numToASMToken(parseInt(p.x, 10)),
          useCltv: false,
        }),
      },
    ],
  },

  // ── 2. Hash Bounty (Mini PoW) ─────────────────────────────────────────────
  {
    id: "hash-bounty",
    name: "Hash Bounty",
    icon: Trophy,
    tagline: "Find a preimage whose SHA256 starts with N zero bytes.",
    concept:
      "A proof-of-work bounty: lock BSV to a challenge requiring the solver to find any string whose " +
      "SHA256 hash begins with a specified number of zero bytes. This mirrors Bitcoin mining difficulty — " +
      "each additional zero byte multiplies expected work by 256. The contract uses OP_SHA256, OP_SPLIT, " +
      "and OP_EQUAL to verify the prefix without revealing anything about valid solutions.",
    lockPattern: "OP_SHA256 <N> OP_SPLIT OP_DROP <00…> OP_EQUAL",
    deployFields: [
      {
        id: "difficulty",
        label: "Difficulty (leading zero bytes)",
        placeholder: "1 or 2",
        help: "1 byte = ~256 attempts, 2 bytes = ~65,536 attempts. Use 1 for a fast demo.",
      },
    ],
    buildLockASM: async (p) => {
      const diff = Math.max(1, Math.min(3, parseInt(p.difficulty, 10)));
      if (isNaN(diff)) throw new Error("Difficulty must be 1-3");
      const zeros = "00".repeat(diff);
      const asm = `OP_SHA256 ${numToASMToken(diff)} OP_SPLIT OP_DROP ${zeros} OP_EQUAL`;
      return {
        asm,
        note: `Find any preimage whose SHA256 starts with ${diff} zero byte${diff > 1 ? "s" : ""} (0x${"00".repeat(diff)})`,
      };
    },
    executePaths: [
      {
        id: "claim",
        label: "Claim Bounty",
        description: "Provide the preimage (any text whose SHA256 starts with the required zeros)",
        fields: [
          {
            id: "preimage",
            label: "Preimage (the winning text)",
            placeholder: "Enter the text / leave blank to auto-solve...",
            help: "Push this as a hex-encoded data push. Use the solver below to find a valid value.",
          },
        ],
        buildUnlock: (p) => ({
          asm: textToHex(p.preimage),
          useCltv: false,
        }),
      },
    ],
  },

  // ── 3. Dual-Secret HTLC ───────────────────────────────────────────────────
  {
    id: "data-marketplace",
    name: "Dual-Secret HTLC",
    icon: ShoppingCart,
    tagline: "Two-party escrow: each side holds a secret key to their spend path.",
    concept:
      "A hash time-lock contract (HTLC) without CLTV. The BSV Genesis upgrade (Feb 2020) " +
      "reverted OP_CHECKLOCKTIMEVERIFY to a no-op, so time-locks cannot be enforced by Script on BSV. " +
      "Instead this contract uses two independent hash-locked paths: the seller claims by revealing " +
      "the data preimage (OP_IF branch); the buyer reclaims by revealing a separate refund secret " +
      "(OP_ELSE branch). Both secrets are SHA256-locked on-chain. The party who reveals their " +
      "secret first wins. Timing is coordinated off-chain — both parties agree that the buyer " +
      "waits before broadcasting the refund, enforced socially or via the TX nLockTime field " +
      "(miners follow nLockTime conventions even though Script doesn't check it).",
    lockPattern:
      "OP_IF OP_SHA256 <hash_data> OP_EQUAL  OP_ELSE OP_SHA256 <hash_refund> OP_EQUAL  OP_ENDIF",
    deployFields: [
      {
        id: "secret",
        label: "Data / Secret to sell",
        placeholder: "The data the buyer will receive...",
        help: "Only the SHA256 hash goes on-chain. The seller reveals this to claim.",
      },
      {
        id: "refundSecret",
        label: "Buyer refund key",
        placeholder: "A separate secret only the buyer knows...",
        help: "Only the SHA256 hash goes on-chain. The buyer reveals this to reclaim if the seller disappears.",
      },
    ],
    buildLockASM: async (p) => {
      if (!p.secret) throw new Error("Data/secret is required");
      if (!p.refundSecret) throw new Error("Buyer refund key is required");
      const hashData = await sha256Hex(textToHex(p.secret));
      const hashRefund = await sha256Hex(textToHex(p.refundSecret));
      const asm = `OP_IF OP_SHA256 ${hashData} OP_EQUAL OP_ELSE OP_SHA256 ${hashRefund} OP_EQUAL OP_ENDIF`;
      return {
        asm,
        note: `Seller hash = ${hashData.slice(0, 12)}… | Buyer refund hash = ${hashRefund.slice(0, 12)}…`,
      };
    },
    executePaths: [
      {
        id: "seller-claim",
        label: "Seller claims",
        description: "Reveal the original data to receive payment (OP_IF branch)",
        fields: [
          {
            id: "secret",
            label: "Original Data / Secret",
            placeholder: "The exact data that was hashed...",
            help: "Must match SHA256(data) embedded in the contract.",
          },
        ],
        buildUnlock: (p) => ({
          asm: `${textToHex(p.secret)} OP_1`,
          useCltv: false,
        }),
      },
      {
        id: "buyer-refund",
        label: "Buyer refunds",
        description: "Reveal the refund key to reclaim funds (OP_ELSE branch)",
        fields: [
          {
            id: "refundSecret",
            label: "Buyer Refund Key",
            placeholder: "The refund secret set at deploy time...",
            help: "Must match the SHA256 hash in the OP_ELSE branch.",
          },
        ],
        buildUnlock: (p) => ({
          asm: `${textToHex(p.refundSecret)} OP_0`,
          useCltv: false,
        }),
      },
    ],
  },

  // ── 4. OP_CAT Treasury ────────────────────────────────────────────────────
  {
    id: "time-vault",
    name: "OP_CAT Treasury",
    icon: Clock,
    tagline: "Split a secret in two. Both halves needed to unlock.",
    concept:
      "Lock funds to a two-part secret using BSV's restored OP_CAT. The contract embeds " +
      "SHA256(part1 ‖ part2) on-chain. To spend, both parts must be pushed separately — " +
      "OP_CAT concatenates them, OP_SHA256 hashes the result, and OP_EQUAL verifies against " +
      "the committed digest. Neither part alone is enough. OP_CAT was disabled in BTC and " +
      "BCH in 2010 but was restored on BSV in the Monolith upgrade (May 2018), making this " +
      "pattern uniquely available on BSV.",
    lockPattern: "OP_CAT OP_SHA256 <SHA256(part1||part2)> OP_EQUAL",
    deployFields: [
      {
        id: "part1",
        label: "Secret Part 1",
        placeholder: "First half of the secret...",
        help: "Give this to one keyholder. Funds cannot move without both parts.",
      },
      {
        id: "part2",
        label: "Secret Part 2",
        placeholder: "Second half of the secret...",
        help: "Give this to a second keyholder (or store separately). Both are required.",
      },
    ],
    buildLockASM: async (p) => {
      if (!p.part1) throw new Error("Part 1 is required");
      if (!p.part2) throw new Error("Part 2 is required");
      const combined = textToHex(p.part1) + textToHex(p.part2);
      const hash = await sha256Hex(combined);
      const asm = `OP_CAT OP_SHA256 ${hash} OP_EQUAL`;
      return {
        asm,
        note: `SHA256("${p.part1}" ‖ "${p.part2}") = ${hash.slice(0, 16)}…`,
      };
    },
    executePaths: [
      {
        id: "claim",
        label: "Claim Treasury",
        description: "Push both secret parts — OP_CAT joins them before hashing",
        fields: [
          {
            id: "part1",
            label: "Secret Part 1",
            placeholder: "First part of the secret...",
            help: "Must match the first part used at deploy time.",
          },
          {
            id: "part2",
            label: "Secret Part 2",
            placeholder: "Second part of the secret...",
            help: "Must match the second part used at deploy time.",
          },
        ],
        buildUnlock: (p) => ({
          asm: `${textToHex(p.part1)} ${textToHex(p.part2)}`,
          useCltv: false,
        }),
      },
    ],
  },
];

// ---------------------------------------------------------------------------
//  History entry
// ---------------------------------------------------------------------------

interface HistoryEntry {
  contractId: ContractId;
  lockTxid: string;
  lockTxHex: string;
  lockASM: string;
  note: string;
  amount: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
//  Main Page
// ---------------------------------------------------------------------------

export default function ContractsPage() {
  const { toast } = useToast();

  // ── Shared ──
  const [wif, setWif] = useState("");
  const [showWif, setShowWif] = useState(false);
  const [address, setAddress] = useState("");

  // ── Deploy ──
  const [deployId, setDeployId] = useState<ContractId | null>(null);
  const [deployParams, setDeployParams] = useState<Record<string, string>>({});
  const [deployAmount, setDeployAmount] = useState("1000");
  const [deployFeeRate, setDeployFeeRate] = useState("0.5");
  const [deployPreview, setDeployPreview] = useState<{ asm: string; note?: string } | null>(null);
  const [utxos, setUtxos] = useState<BitailsUtxo[]>([]);
  const [fetchingUtxos, setFetchingUtxos] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ txid: string; lockASM: string; note: string; fee: number; size: number } | null>(null);

  // ── Execute ──
  const [execId, setExecId] = useState<ContractId | null>(null);
  const [execTxid, setExecTxid] = useState("");
  const [execRawTx, setExecRawTx] = useState("");
  const [execVout, setExecVout] = useState("0");
  const [execLockASM, setExecLockASM] = useState("");
  const [execPathId, setExecPathId] = useState<string | null>(null);
  const [execParams, setExecParams] = useState<Record<string, string>>({});
  const [execDest, setExecDest] = useState("");
  const [execFeeRate, setExecFeeRate] = useState("0.5");
  const [fetchingTx, setFetchingTx] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<BuildTransactionResult | null>(null);

  // ── Hash Bounty solver ──
  const [solving, setSolving] = useState(false);
  const [solveAttempts, setSolveAttempts] = useState(0);
  const [solveStop, setSolveStop] = useState(false);

  // ── History ──
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("saibun-contracts-v2") || "[]");
    } catch {
      return [];
    }
  });

  const pushHistory = useCallback((entry: HistoryEntry) => {
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem("saibun-contracts-v2", JSON.stringify(updated)); } catch {}
  }, [history]);

  // ── WIF ──
  const handleWif = useCallback((v: string) => {
    setWif(v);
    setAddress(isValidPrivateKey(v) ? importFromPrivateKey(v).address : "");
  }, []);

  // ── Fetch UTXOs ──
  const handleFetchUtxos = useCallback(async () => {
    if (!address) return;
    setFetchingUtxos(true);
    try {
      const result = await fetchUtxosWithRawTx(address);
      setUtxos(result);
      if (!result.length) {
        toast({ title: "No UTXOs", description: "No spendable outputs found.", variant: "destructive" });
      } else {
        toast({ title: "UTXOs loaded", description: `${result.length} UTXO(s)` });
      }
    } catch (e) {
      toast({ title: "Fetch failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setFetchingUtxos(false);
    }
  }, [address, toast]);

  // ── Preview ──
  const handlePreview = useCallback(async () => {
    const def = CONTRACTS.find((c) => c.id === deployId);
    if (!def) return;
    try {
      const result = await def.buildLockASM(deployParams);
      setDeployPreview(result);
    } catch (e) {
      toast({ title: "Preview error", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  }, [deployId, deployParams, toast]);

  // ── Deploy ──
  const handleDeploy = useCallback(async () => {
    const def = CONTRACTS.find((c) => c.id === deployId);
    if (!def || !wif || !utxos.length) return;
    setDeploying(true);
    setDeployResult(null);
    try {
      const built = await def.buildLockASM(deployParams);
      const amount = parseInt(deployAmount, 10);
      const feeRate = parseFloat(deployFeeRate);
      if (isNaN(amount) || amount < 1) throw new Error("Amount must be ≥ 1 sat");
      const utxo = utxos.reduce((a, b) => (a.satoshis > b.satoshis ? a : b));
      if (!utxo.rawTxHex) throw new Error("Missing raw TX hex");
      const txResult = await buildCustomLockTransaction(wif, utxo.rawTxHex, utxo.vout, built.asm, amount, feeRate);
      const txid = await broadcastTransaction(txResult.hex);
      setDeployResult({ txid, lockASM: built.asm, note: built.note || "", fee: txResult.fee, size: txResult.size });
      pushHistory({ contractId: deployId!, lockTxid: txid, lockTxHex: txResult.hex, lockASM: built.asm, note: built.note || "", amount, timestamp: Date.now() });
      setUtxos([]);
      toast({ title: "Contract deployed!", description: txid.slice(0, 16) + "…" });
    } catch (e) {
      toast({ title: "Deploy failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  }, [deployId, wif, utxos, deployParams, deployAmount, deployFeeRate, toast, pushHistory]);

  // ── Load TX for execute ──
  const handleFetchTx = useCallback(async () => {
    if (execTxid.length !== 64) return;
    setFetchingTx(true);
    try {
      const raw = await fetchRawTransaction(execTxid);
      setExecRawTx(raw);
      const { Transaction } = await import("@bsv/sdk");
      const tx = Transaction.fromHex(raw);
      const vout = parseInt(execVout, 10);
      if (vout < tx.outputs.length) {
        setExecLockASM(tx.outputs[vout].lockingScript.toASM());
      }
      toast({ title: "Transaction loaded", description: `${(raw.length / 2).toLocaleString()} bytes` });
    } catch (e) {
      toast({ title: "Fetch failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setFetchingTx(false);
    }
  }, [execTxid, execVout, toast]);

  // ── Execute ──
  const handleExecute = useCallback(async () => {
    const def = CONTRACTS.find((c) => c.id === execId);
    if (!def || !execRawTx || !execDest) return;
    const pathDef = def.executePaths.find((p) => p.id === execPathId);
    if (!pathDef) return;
    if (!isValidAddress(execDest)) { toast({ title: "Invalid address", variant: "destructive" }); return; }
    setExecuting(true);
    setExecResult(null);
    try {
      const { asm: unlockASM } = pathDef.buildUnlock(execParams, execLockASM);
      const vout = parseInt(execVout, 10);
      const feeRate = parseFloat(execFeeRate);
      const txResult = await buildCustomUnlockTransaction(execRawTx, vout, unlockASM, execDest, feeRate);
      const txid = await broadcastTransaction(txResult.hex);
      setExecResult({ ...txResult, txid });
      toast({ title: "Contract executed!", description: txid.slice(0, 16) + "…" });
    } catch (e) {
      toast({ title: "Execute failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setExecuting(false);
    }
  }, [execId, execRawTx, execVout, execPathId, execParams, execDest, execFeeRate, execLockASM, toast]);

  // ── Hash Bounty: Browser Solver ──
  const handleSolve = useCallback(async () => {
    const def = CONTRACTS.find((c) => c.id === "hash-bounty");
    if (!def || solving) return;

    let difficulty = parseInt(deployParams.difficulty || execParams.difficulty || "1", 10);
    if (isNaN(difficulty) || difficulty < 1) difficulty = 1;

    setSolving(true);
    setSolveAttempts(0);
    setSolveStop(false);

    let found: string | null = null;
    const zeros = new Uint8Array(difficulty);

    for (let i = 0; i < 5_000_000 && !solveStop; i++) {
      const text = `saibun-${i}`;
      const data = new TextEncoder().encode(text);
      const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
      if (i % 200 === 0) {
        setSolveAttempts(i);
        await new Promise((r) => setTimeout(r, 0));
      }
      if (zeros.every((_, j) => digest[j] === 0)) {
        found = text;
        break;
      }
    }

    setSolving(false);
    setSolveAttempts(0);
    if (found) {
      // Fill the preimage field in execute params
      setExecParams((p) => ({ ...p, preimage: found! }));
      toast({ title: "Solution found!", description: `Preimage: "${found}"` });
    } else {
      toast({ title: "Not found within limit", description: "Try increasing difficulty or run externally.", variant: "destructive" });
    }
  }, [solving, solveStop, deployParams, execParams, toast]);

  const deployDef = CONTRACTS.find((c) => c.id === deployId);
  const execDef = CONTRACTS.find((c) => c.id === execId);
  const execPath = execDef?.executePaths.find((p) => p.id === execPathId);
  const balance = utxos.reduce((s, u) => s + u.satoshis, 0);

  const deployFieldsFilled = deployDef?.deployFields.every((f) => deployParams[f.id]?.trim());
  const execFieldsFilled = execPath?.fields.every((f) => execParams[f.id]?.trim()) ?? true;

  // Auto-select single path
  useEffect(() => {
    if (execDef?.executePaths.length === 1) setExecPathId(execDef.executePaths[0].id);
  }, [execDef]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Saibun</span>
            <Badge variant="secondary">Smart Contracts</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts"><Code2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Script Lab</span></Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts/challenges"><Puzzle className="h-3.5 w-3.5" /><span className="hidden sm:inline">Challenges</span></Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts/tools"><Wrench className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tools</span></Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts/learn"><BookOpen className="h-3.5 w-3.5" /><span className="hidden sm:inline">Guide</span></Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/">UTXO Splitter <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Hero */}
        <section className="mb-8 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">Smart Contracts</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Real, deployable Bitcoin contracts running on BSV mainnet. Each contract
            leverages BSV-restored opcodes — OP_MUL, OP_MOD, OP_SPLIT, OP_CAT —
            to enforce logic that no trusted third party can override.
          </p>
        </section>

        {/* WIF */}
        <Card className="mb-6">
          <CardContent className="pt-5 pb-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Private Key (WIF or Hex)</Label>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showWif ? "text" : "password"}
                  value={wif}
                  onChange={(e) => handleWif(e.target.value)}
                  placeholder="WIF (K, L, 5...) or 64-char hex"
                  className="pr-10 font-mono text-xs"
                />
                <button type="button" onClick={() => setShowWif(!showWif)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showWif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {address && <p className="text-xs text-muted-foreground font-mono">Address: {address}</p>}
          </CardContent>
        </Card>

        <Tabs defaultValue="deploy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deploy" className="gap-1.5"><Lock className="h-4 w-4" />Deploy</TabsTrigger>
            <TabsTrigger value="execute" className="gap-1.5"><Unlock className="h-4 w-4" />Execute</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><FileText className="h-4 w-4" />History</TabsTrigger>
          </TabsList>

          {/* ══════════════════════════ DEPLOY ══════════════════════════ */}
          <TabsContent value="deploy" className="space-y-6">
            {/* Contract picker */}
            <div>
              <p className="text-sm font-medium mb-3">1. Choose Contract</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTRACTS.map((c) => {
                  const Icon = c.icon;
                  const sel = deployId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setDeployId(c.id); setDeployParams({}); setDeployPreview(null); setDeployResult(null); }}
                      className={`text-left p-4 rounded-lg border transition-all ${sel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${sel ? "bg-primary/10" : "bg-secondary"}`}>
                          <Icon className={`h-4 w-4 ${sel ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.tagline}</p>
                          <code className="text-[10px] text-muted-foreground/70 font-mono mt-1 block">{c.lockPattern}</code>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {deployDef && (
              <>
                <Separator />
                {/* Concept */}
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How it works</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{deployDef.concept}</p>
                </div>

                {/* Parameters */}
                <div>
                  <p className="text-sm font-medium mb-3">2. Parameters</p>
                  <div className="space-y-4">
                    {deployDef.deployFields.map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <Label className="text-sm">{f.label}</Label>
                        <Input
                          value={deployParams[f.id] || ""}
                          onChange={(e) => setDeployParams((p) => ({ ...p, [f.id]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">{f.help}</p>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Lock Amount (sats)</Label>
                        <Input type="number" value={deployAmount} onChange={(e) => setDeployAmount(e.target.value)} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Fee Rate (sat/byte)</Label>
                        <Input type="number" value={deployFeeRate} onChange={(e) => setDeployFeeRate(e.target.value)} step="0.1" className="font-mono text-xs" />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={handlePreview} disabled={!deployFieldsFilled} className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />Preview Script
                    </Button>

                    {deployPreview && (
                      <div className="bg-card border border-border rounded-lg p-3 space-y-1">
                        <p className="text-xs text-muted-foreground">Locking Script ASM:</p>
                        <code className="text-xs font-mono break-all leading-relaxed">{deployPreview.asm}</code>
                        {deployPreview.note && <p className="text-xs text-primary mt-1">{deployPreview.note}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />
                {/* Fund & Deploy */}
                <div>
                  <p className="text-sm font-medium mb-3">3. Fund &amp; Deploy</p>
                  {!address ? (
                    <p className="text-sm text-muted-foreground">Enter a WIF or hex private key above.</p>
                  ) : !utxos.length ? (
                    <div className="space-y-2">
                      <Button size="sm" onClick={handleFetchUtxos} disabled={fetchingUtxos} className="gap-1.5">
                        {fetchingUtxos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                        Fetch UTXOs
                      </Button>
                      <p className="text-xs text-muted-foreground">Loads spendable outputs for {address.slice(0, 12)}…</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                        Balance: <span className="font-mono font-medium">{balance.toLocaleString()}</span> sats
                        <span className="text-muted-foreground ml-2">({utxos.length} UTXO{utxos.length > 1 ? "s" : ""})</span>
                      </div>
                      <Button onClick={handleDeploy} disabled={deploying || !deployFieldsFilled || !deployAmount} className="gap-2">
                        {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Deploy Contract
                      </Button>
                    </div>
                  )}
                </div>

                {deployResult && (
                  <>
                    <Separator />
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <p className="text-sm font-medium">Contract Deployed</p>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <p><span className="text-muted-foreground">TXID: </span><code className="font-mono break-all">{deployResult.txid}</code></p>
                        {deployResult.note && <p className="text-primary">{deployResult.note}</p>}
                        <p><span className="text-muted-foreground">Size: </span><span className="font-mono">{deployResult.size}b</span><span className="text-muted-foreground"> | Fee: </span><span className="font-mono">{deployResult.fee} sats</span></p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(deployResult.txid); toast({ title: "Copied" }); }} className="gap-1.5">
                          <Copy className="h-3 w-3" />Copy TXID
                        </Button>
                        <Button variant="outline" size="sm" asChild className="gap-1.5">
                          <a href={`https://whatsonchain.com/tx/${deployResult.txid}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />View on-chain
                          </a>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ══════════════════════════ EXECUTE ══════════════════════════ */}
          <TabsContent value="execute" className="space-y-6">
            {/* Contract type */}
            <div>
              <p className="text-sm font-medium mb-3">1. Contract Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONTRACTS.map((c) => {
                  const Icon = c.icon;
                  const sel = execId === c.id;
                  return (
                    <button key={c.id} onClick={() => { setExecId(c.id); setExecParams({}); setExecPathId(null); setExecResult(null); }}
                      className={`p-3 rounded-lg border text-left transition-all ${sel ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
                    >
                      <Icon className={`h-4 w-4 mb-1 ${sel ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-xs font-medium leading-tight">{c.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {execDef && (
              <>
                <Separator />
                {/* Load TX */}
                <div>
                  <p className="text-sm font-medium mb-3">2. Load Locked Transaction</p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input value={execTxid} onChange={(e) => { setExecTxid(e.target.value.trim()); setExecRawTx(""); setExecLockASM(""); }}
                        placeholder="Paste TXID (64 hex chars)…" className="font-mono text-xs" />
                      <Button size="sm" onClick={handleFetchTx} disabled={fetchingTx || execTxid.length !== 64} className="gap-1.5 shrink-0">
                        {fetchingTx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                        Fetch
                      </Button>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Label className="text-xs shrink-0">Output index</Label>
                      <Input type="number" value={execVout} onChange={(e) => setExecVout(e.target.value)} className="font-mono text-xs w-20" />
                    </div>
                    {execLockASM && (
                      <div className="bg-card border border-border rounded-lg p-3 space-y-1">
                        <p className="text-xs text-muted-foreground">Detected locking script:</p>
                        <code className="text-xs font-mono break-all">{execLockASM.length > 100 ? execLockASM.slice(0, 97) + "…" : execLockASM}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unlock path */}
                {execDef.executePaths.length > 1 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-3">3. Unlock Path</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {execDef.executePaths.map((path) => (
                          <button key={path.id} onClick={() => { setExecPathId(path.id); setExecParams({}); }}
                            className={`text-left p-3 rounded-lg border transition-all ${execPathId === path.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
                          >
                            <p className="text-sm font-medium">{path.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{path.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {execPath && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-3">{execDef.executePaths.length > 1 ? "4." : "3."} Claim Parameters</p>
                      <div className="space-y-4">
                        {execPath.fields.map((f) => (
                          <div key={f.id} className="space-y-1.5">
                            <Label className="text-sm">{f.label}</Label>
                            <Input value={execParams[f.id] || ""} onChange={(e) => setExecParams((p) => ({ ...p, [f.id]: e.target.value }))}
                              placeholder={f.placeholder} className="font-mono text-xs" />
                            {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                          </div>
                        ))}

                        {/* Hash Bounty solver */}
                        {execId === "hash-bounty" && execPath.id === "claim" && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleSolve} disabled={solving} className="gap-1.5">
                              {solving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                              {solving ? `Solving… (${solveAttempts.toLocaleString()} attempts)` : "Solve in Browser"}
                            </Button>
                            {solving && (
                              <button onClick={() => setSolveStop(true)} className="text-xs text-muted-foreground hover:text-foreground underline">Cancel</button>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-sm">Destination Address</Label>
                          <Input value={execDest} onChange={(e) => setExecDest(e.target.value.trim())} placeholder="BSV address to receive funds…" className="font-mono text-xs" />
                          {address && !execDest && (
                            <button onClick={() => setExecDest(address)} className="text-xs text-primary hover:underline">
                              Use my address ({address.slice(0, 12)}…)
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-sm">Fee Rate (sat/byte)</Label>
                          <Input type="number" value={execFeeRate} onChange={(e) => setExecFeeRate(e.target.value)} step="0.1" className="font-mono text-xs w-32" />
                        </div>

                        <Button onClick={handleExecute} disabled={executing || !execRawTx || !execDest || !execFieldsFilled} className="gap-2">
                          {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                          Execute Contract
                        </Button>

                        {execResult && (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              <p className="text-sm font-medium">Contract Executed</p>
                            </div>
                            <div className="space-y-1 text-xs">
                              <p><span className="text-muted-foreground">TXID: </span><code className="font-mono break-all">{execResult.txid}</code></p>
                              <p><span className="text-muted-foreground">Fee: </span><span className="font-mono">{execResult.fee} sats</span></p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(execResult.txid!); toast({ title: "Copied" }); }} className="gap-1.5">
                                <Copy className="h-3 w-3" />Copy TXID
                              </Button>
                              <Button variant="outline" size="sm" asChild className="gap-1.5">
                                <a href={`https://whatsonchain.com/tx/${execResult.txid}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />View on-chain
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ══════════════════════════ HISTORY ══════════════════════════ */}
          <TabsContent value="history" className="space-y-4">
            <p className="text-sm font-medium">Deployed Contracts</p>
            {!history.length ? (
              <p className="text-sm text-muted-foreground">No contracts deployed yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h, i) => {
                  const def = CONTRACTS.find((c) => c.id === h.contractId);
                  const Icon = def?.icon || Lock;
                  return (
                    <div key={`${h.lockTxid}-${i}`} className="border border-border rounded-lg p-4 bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{def?.name || h.contractId}</span>
                          <Badge variant="outline" className="text-xs font-mono">{h.amount.toLocaleString()} sats</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                      {h.note && <p className="text-xs text-primary">{h.note}</p>}
                      <p className="text-xs"><span className="text-muted-foreground">TXID: </span><code className="font-mono">{h.lockTxid}</code></p>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(h.lockTxid); toast({ title: "Copied" }); }} className="gap-1 h-7 text-xs"><Copy className="h-3 w-3" />TXID</Button>
                        <Button variant="outline" size="sm" asChild className="gap-1 h-7 text-xs">
                          <a href={`https://whatsonchain.com/tx/${h.lockTxid}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" />View</a>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"
                          onClick={() => {
                            setExecId(h.contractId);
                            setExecTxid(h.lockTxid);
                            setExecRawTx(h.lockTxHex);
                            setExecLockASM(h.lockASM);
                            setExecVout("0");
                            setExecParams({});
                            setExecResult(null);
                            document.querySelector<HTMLElement>('[data-state][value="execute"]')?.click();
                          }}
                        >
                          <Unlock className="h-3 w-3" />Execute
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button variant="ghost" size="sm" onClick={() => { setHistory([]); localStorage.removeItem("saibun-contracts-v2"); toast({ title: "History cleared" }); }} className="text-xs text-muted-foreground">
                  Clear History
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <footer className="mt-16 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Splitter</Link>
            <Link href="/scripts" className="hover:text-foreground">Script Lab</Link>
            <Link href="/scripts/challenges" className="hover:text-foreground">Challenges</Link>
            <Link href="/scripts/tools" className="hover:text-foreground">Tools</Link>
            <Link href="/scripts/learn" className="hover:text-foreground">Guide</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
