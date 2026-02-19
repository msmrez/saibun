"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Play,
  Copy,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Code2,
  BookOpen,
  Download,
  Loader2,
  Key,
  Wallet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  SkipForward,
  ExternalLink,
  RefreshCw,
  Pause,
  Type,
  Hash,
  Puzzle,
  Wrench,
  Lock,
} from "lucide-react";
import {
  type PlaygroundTemplate,
  type ValidationResult,
  type BuildTransactionResult,
  type RPuzzleGenerationResult,
  type SimulationResult,
  type ExecutionStep,
  TEMPLATES,
  OPCODE_REFERENCE,
  validateScript,
  validateTransactionSpend,
  scriptHexPreview,
  buildCustomLockTransaction,
  buildCustomUnlockTransaction,
  buildRPuzzleUnlockTransaction,
  generateRPuzzle,
  buildHashPuzzleLock,
  simulateScript,
  textToHex,
  isHex,
  detectAndConvertToASM,
  extractLockingScriptFromTx,
  extractUnlockingScriptFromTx,
  parseTxIdFromHex,
  simulateTransactionSpend,
  broadcastTransaction,
} from "@/lib/script-playground";
import { isValidPrivateKey, isValidAddress, importFromPrivateKey, fetchUtxosWithRawTx, fetchSpendingTx, fetchRawTransaction } from "@/lib/bsv";
import { DisclaimerDialog } from "@/components/scripts/disclaimer-dialog";

type HashAlgo = "SHA256" | "HASH160" | "HASH256" | "RIPEMD160" | "SHA1";

// Stable category order for Transaction Builder (most-used first). Only include categories that have builder templates.
const BUILDER_CATEGORY_ORDER = ["Lock Funds", "Basic", "Control Flow", "Stack", "Time Lock", "Escrow & Swaps", "Standard Payments", "Data Manipulation", "Data Embedding", "Covenants"];
const BUILDER_CATEGORIES = BUILDER_CATEGORY_ORDER.filter(cat =>
  TEMPLATES.some(t => t.category === cat && t.id !== "custom" && !t.educational)
);

// Stable category order for Script Lab template list (consistent menu order)
const LAB_CATEGORY_ORDER = ["Basic", "Lock Funds", "Control Flow", "Stack", "Time Lock", "Escrow & Swaps", "Standard Payments", "Data Manipulation", "Data Embedding", "Covenants", "Custom"];

export default function ScriptsPage() {
  const { toast } = useToast();

  // Script Lab state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [lockingASM, setLockingASM] = useState("");
  const [unlockingASM, setUnlockingASM] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  // Stored raw TX hexes for full transaction validation (OP_CHECKSIG scripts)
  const [labSourceTxHex, setLabSourceTxHex] = useState("");
  const [labSpendingTxHex, setLabSpendingTxHex] = useState("");
  const [fetchingSpendTx, setFetchingSpendTx] = useState(false);
  // Controlled values for the visible TX input fields
  const [labSourceTxInput, setLabSourceTxInput] = useState("");
  const [labSpendingTxInput, setLabSpendingTxInput] = useState("");
  // Selectable output/input indices for the TX loaders
  const [labSourceOutputIndex, setLabSourceOutputIndex] = useState(0);
  const [labSpendingInputIndex, setLabSpendingInputIndex] = useState(0);

  // Transaction Builder state
  const [builderMode, setBuilderMode] = useState<"lock" | "unlock">("lock");
  
  // Lock mode state
  const [lockWif, setLockWif] = useState("");
  const [lockSourceTx, setLockSourceTx] = useState("");
  const [lockVout, setLockVout] = useState("");
  const [lockScriptASM, setLockScriptASM] = useState("");
  const [lockAmount, setLockAmount] = useState("");
  const [lockFeeRate, setLockFeeRate] = useState("0.5");
  const [lockChangeAddr, setLockChangeAddr] = useState("");
  const [lockResult, setLockResult] = useState<BuildTransactionResult | null>(null);
  const [lockBuilding, setLockBuilding] = useState(false);
  const [lockBroadcasting, setLockBroadcasting] = useState(false);
  const [lockBroadcastSuccess, setLockBroadcastSuccess] = useState(false);
  const [lockBroadcastTxid, setLockBroadcastTxid] = useState("");
  const [loadingUtxo, setLoadingUtxo] = useState(false);
  const [lockAddress, setLockAddress] = useState("");
  const [builderLockTemplate, setBuilderLockTemplate] = useState<string | null>("hash-sha256");
  const [builderLockCategory, setBuilderLockCategory] = useState("Lock Funds");
  
  // Lock: Hash Puzzle params
  const [lockHashPreimage, setLockHashPreimage] = useState("");
  const [lockHashPreimageIsHex, setLockHashPreimageIsHex] = useState(false);
  const [lockHashAlgo, setLockHashAlgo] = useState<HashAlgo>("SHA256");
  
  // Lock: R-Puzzle params
  const [rpuzzleType, setRpuzzleType] = useState<"raw" | "HASH160">("raw");
  const [rpuzzleResult, setRpuzzleResult] = useState<RPuzzleGenerationResult | null>(null);
  
  // Unlock mode state
  const [unlockWif, setUnlockWif] = useState("");
  const [unlockSourceTx, setUnlockSourceTx] = useState("");
  const [unlockVout, setUnlockVout] = useState("");
  const [unlockScriptASM, setUnlockScriptASM] = useState("");
  const [unlockDestAddr, setUnlockDestAddr] = useState("");
  const [unlockFeeRate, setUnlockFeeRate] = useState("0.5");
  const [unlockResult, setUnlockResult] = useState<BuildTransactionResult | null>(null);
  const [unlockBuilding, setUnlockBuilding] = useState(false);
  const [unlockBroadcasting, setUnlockBroadcasting] = useState(false);
  const [unlockBroadcastSuccess, setUnlockBroadcastSuccess] = useState(false);
  const [unlockBroadcastTxid, setUnlockBroadcastTxid] = useState("");
  const [builderUnlockTemplate, setBuilderUnlockTemplate] = useState<string | null>("hash-sha256");
  const [builderUnlockCategory, setBuilderUnlockCategory] = useState("Lock Funds");
  
  // Unlock: Hash Puzzle params
  const [unlockHashPreimage, setUnlockHashPreimage] = useState("");
  const [unlockHashPreimageIsHex, setUnlockHashPreimageIsHex] = useState(false);

  // Unlock: R-Puzzle params
  const [unlockRPuzzleK, setUnlockRPuzzleK] = useState("");
  const [unlockRPuzzleType, setUnlockRPuzzleType] = useState<"raw" | "HASH160">("raw");

  // Alt-Stack params (lock + unlock share these)
  const [altStackVal1, setAltStackVal1] = useState("3");
  const [altStackVal2, setAltStackVal2] = useState("4");

  // Step-by-step Simulator state
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(600);
  const [showHexText, setShowHexText] = useState(false);

  // Auto-play effect
  useEffect(() => {
    if (!autoPlaying || !simulation) return;
    const interval = setInterval(() => {
      setSimStep((s) => {
        if (s >= simulation.steps.length - 1) {
          setAutoPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, autoPlaySpeed);
    return () => clearInterval(interval);
  }, [autoPlaying, simulation, autoPlaySpeed]);

  // Helper: try to decode hex as printable text
  const tryHexToText = useCallback((hex: string): string | null => {
    if (!hex || hex.length < 2 || hex.length > 200 || hex === "(empty)") return null;
    try {
      const bytes = hex.match(/.{1,2}/g);
      if (!bytes) return null;
      const text = bytes.map(b => String.fromCharCode(parseInt(b, 16))).join("");
      if ([...text].every(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127)) {
        return `"${text}"`;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  const lockPreview = scriptHexPreview(lockingASM);
  const unlockPreview = scriptHexPreview(unlockingASM);

  // Derive address from WIF when it changes
  useEffect(() => {
    if (lockWif.trim() && isValidPrivateKey(lockWif.trim())) {
      try {
        const { address } = importFromPrivateKey(lockWif.trim());
        setLockAddress(address);
      } catch {
        setLockAddress("");
      }
    } else {
      setLockAddress("");
    }
  }, [lockWif]);

  const loadTemplate = useCallback((template: PlaygroundTemplate) => {
    setLockingASM(template.lockingASM);
    setUnlockingASM(template.unlockingASM);
    setSelectedTemplate(template.id);
    setResult(null);
    // Clear stored TX hexes when switching templates
    setLabSourceTxHex("");
    setLabSpendingTxHex("");
    setLabSourceTxInput("");
    setLabSpendingTxInput("");
    setLabSourceOutputIndex(0);
    setLabSpendingInputIndex(0);
  }, []);

  // Use full tx context validation when both source and spending TXes are loaded
  const canValidateWithTxContext = labSourceTxHex.trim().length > 0 && labSpendingTxHex.trim().length > 0;
  const lockingHasChecksig = lockingASM.includes("OP_CHECKSIG");

  const handleValidate = useCallback(() => {
    if (!lockingASM.trim() && !unlockingASM.trim()) {
      toast({
        title: "Nothing to validate",
        description: "Enter a locking script first.",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    requestAnimationFrame(() => {
      try {
        // Use full transaction context when both TX hexes are loaded
        // (required for OP_CHECKSIG — the signature commits to the real tx)
        const res = (labSourceTxHex.trim() && labSpendingTxHex.trim())
          ? validateTransactionSpend(labSourceTxHex.trim(), labSpendingTxHex.trim(), labSourceOutputIndex, labSpendingInputIndex)
          : validateScript(lockingASM, unlockingASM);
        setResult(res);
      } catch (err) {
        setResult({
          valid: false,
          error: err instanceof Error ? err.message : "Unexpected error",
          lockingHex: "",
          unlockingHex: "",
          lockingSize: 0,
          unlockingSize: 0,
          finalStack: [],
        });
      } finally {
        setValidating(false);
      }
    });
  }, [lockingASM, unlockingASM, labSourceTxHex, labSpendingTxHex, labSourceOutputIndex, labSpendingInputIndex, toast]);

  const handleSimulate = useCallback(() => {
    if (!lockingASM.trim()) {
      toast({
        title: "Nothing to simulate",
        description: "Enter a locking script first.",
        variant: "destructive",
      });
      return;
    }

    setSimulating(true);
    requestAnimationFrame(() => {
      try {
        const res = (labSourceTxHex.trim() && labSpendingTxHex.trim())
          ? simulateTransactionSpend(labSourceTxHex.trim(), labSpendingTxHex.trim(), labSourceOutputIndex, labSpendingInputIndex)
          : simulateScript(lockingASM, unlockingASM);
        setSimulation(res);
        setSimStep(res.steps.length > 0 ? 0 : 0);
      } catch (err) {
        toast({
          title: "Simulation Failed",
          description: err instanceof Error ? err.message : "Unexpected error",
          variant: "destructive",
        });
      } finally {
        setSimulating(false);
      }
    });
  }, [lockingASM, unlockingASM, labSourceTxHex, labSpendingTxHex, labSourceOutputIndex, labSpendingInputIndex, toast]);

  const handleGenerateRPuzzle = useCallback(() => {
    try {
      const res = generateRPuzzle(rpuzzleType);
      setRpuzzleResult(res);
      setLockScriptASM(res.lockingASM);
      toast({
        title: "R-Puzzle Generated",
        description: "Save the K value — you need it to unlock!",
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [rpuzzleType, toast]);

  // Resolve the selected builder lock template
  const builderLockTpl = TEMPLATES.find(t => t.id === builderLockTemplate);
  const builderUnlockTpl = TEMPLATES.find(t => t.id === builderUnlockTemplate);

  // Derive the actual lock script ASM from current template params
  const resolveLockASM = useCallback((): string => {
    const cfg = builderLockTpl?.interactiveConfig;
    if (cfg === "hash-puzzle") {
      if (!lockHashPreimage.trim()) {
        toast({ title: "Missing Preimage", description: "Enter a preimage for the hash puzzle.", variant: "destructive" });
        return "";
      }
      try {
        const { lockingASM } = buildHashPuzzleLock(lockHashPreimage.trim(), lockHashPreimageIsHex, lockHashAlgo);
        return lockingASM;
      } catch (err) {
        toast({ title: "Invalid Preimage", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
        return "";
      }
    }
    if (cfg === "r-puzzle") {
      if (!lockScriptASM.trim()) {
        toast({ title: "Generate R-Puzzle First", description: "Click 'Generate R-Puzzle' to create a locking script.", variant: "destructive" });
        return "";
      }
      return lockScriptASM.trim();
    }
    if (cfg === "alt-stack") {
      return "OP_TOALTSTACK OP_2 OP_MUL OP_FROMALTSTACK OP_ADD";
    }
    // Non-interactive template or custom: use the textarea ASM
    return lockScriptASM.trim();
  }, [builderLockTpl, lockHashPreimage, lockHashPreimageIsHex, lockHashAlgo, lockScriptASM, toast]);

  // Derive the actual unlock script ASM from current template params
  const resolveUnlockASM = useCallback((): string => {
    const cfg = builderUnlockTpl?.interactiveConfig;
    if (cfg === "hash-puzzle") {
      if (!unlockHashPreimage.trim()) {
        toast({ title: "Missing Preimage", description: "Enter the preimage that was used to lock the funds.", variant: "destructive" });
        return "";
      }
      const hex = unlockHashPreimageIsHex ? unlockHashPreimage.trim() : textToHex(unlockHashPreimage.trim());
      return hex;
    }
    if (cfg === "r-puzzle") {
      return "__RPUZZLE__";
    }
    if (cfg === "alt-stack") {
      const v1 = parseInt(altStackVal1, 10);
      const v2 = parseInt(altStackVal2, 10);
      if (isNaN(v1) || isNaN(v2) || v1 < 0 || v2 < 0) {
        toast({ title: "Invalid Values", description: "Enter two non-negative integers for the push values.", variant: "destructive" });
        return "";
      }
      const toOpcode = (n: number): string => {
        if (n === 0) return "OP_0";
        if (n >= 1 && n <= 16) return `OP_${n}`;
        return n.toString(16).padStart(2, "0");
      };
      return `${toOpcode(v1)} ${toOpcode(v2)}`;
    }
    // Non-interactive or custom
    return unlockScriptASM.trim();
  }, [builderUnlockTpl, unlockHashPreimage, unlockHashPreimageIsHex, unlockScriptASM, altStackVal1, altStackVal2, toast]);

  const handleBuildLock = useCallback(async () => {
    if (!lockWif.trim() || !isValidPrivateKey(lockWif.trim())) {
      toast({ title: "Invalid key", description: "Please enter a valid private key (WIF or hex).", variant: "destructive" });
      return;
    }
    if (!lockSourceTx.trim()) {
      toast({ title: "Missing Source Transaction", description: "Please paste the raw transaction hex.", variant: "destructive" });
      return;
    }
    const vout = parseInt(lockVout, 10);
    if (isNaN(vout) || vout < 0) {
      toast({ title: "Invalid Output Index", description: "Please enter a valid output index (vout).", variant: "destructive" });
      return;
    }
    const amount = parseInt(lockAmount, 10);
    if (isNaN(amount) || amount < 546) {
      toast({ title: "Invalid Amount", description: "Amount must be at least 546 satoshis (dust threshold).", variant: "destructive" });
      return;
    }
    const feeRate = parseFloat(lockFeeRate);
    if (isNaN(feeRate) || feeRate < 0.1) {
      toast({ title: "Invalid Fee Rate", description: "Fee rate must be at least 0.1 sat/byte.", variant: "destructive" });
      return;
    }

    const resolvedASM = resolveLockASM();
    if (!resolvedASM) return;

    setLockBuilding(true);
    try {
      const res = await buildCustomLockTransaction(
        lockWif.trim(),
        lockSourceTx.trim(),
        vout,
        resolvedASM,
        amount,
        feeRate,
        lockChangeAddr.trim() || undefined
      );
      setLockResult(res);
      toast({ title: "Transaction Built", description: "Your transaction is ready to broadcast!" });
    } catch (err) {
      toast({ title: "Build Failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setLockBuilding(false);
    }
  }, [lockWif, lockSourceTx, lockVout, lockAmount, lockFeeRate, lockChangeAddr, resolveLockASM, toast]);

  const handleBuildUnlock = useCallback(async () => {
    // Private key is only required for R-Puzzle (needs signature)
    // Hash puzzles and custom scripts don't need private keys
    if (builderUnlockTpl?.interactiveConfig === "r-puzzle") {
      if (!unlockWif.trim() || !isValidPrivateKey(unlockWif.trim())) {
        toast({ title: "Invalid key", description: "R-Puzzle requires a private key for signing.", variant: "destructive" });
        return;
      }
    }
    
    if (!unlockSourceTx.trim()) {
      toast({ title: "Missing Source Transaction", description: "Please paste the raw transaction hex of the locked UTXO.", variant: "destructive" });
      return;
    }
    if (!unlockDestAddr.trim() || !isValidAddress(unlockDestAddr.trim())) {
      toast({ title: "Invalid Destination", description: "Please enter a valid BSV address.", variant: "destructive" });
      return;
    }
    const vout = parseInt(unlockVout, 10);
    if (isNaN(vout) || vout < 0) {
      toast({ title: "Invalid Output Index", description: "Please enter a valid output index (vout).", variant: "destructive" });
      return;
    }
    const feeRate = parseFloat(unlockFeeRate);
    if (isNaN(feeRate) || feeRate < 0.1) {
      toast({ title: "Invalid Fee Rate", description: "Fee rate must be at least 0.1 sat/byte.", variant: "destructive" });
      return;
    }

    // R-Puzzle uses a dedicated builder
    if (builderUnlockTpl?.interactiveConfig === "r-puzzle") {
      if (!unlockRPuzzleK.trim()) {
        toast({ title: "Missing K Value", description: "Enter the K value that was generated when locking.", variant: "destructive" });
        return;
      }
      setUnlockBuilding(true);
      try {
        const res = await buildRPuzzleUnlockTransaction(
          unlockWif.trim(),
          unlockRPuzzleK.trim(),
          unlockRPuzzleType,
          unlockSourceTx.trim(),
          vout,
          unlockDestAddr.trim(),
          feeRate
        );
        setUnlockResult(res);
        toast({ title: "Transaction Built", description: "Your R-Puzzle spending transaction is ready to broadcast!" });
      } catch (err) {
        toast({ title: "Build Failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      } finally {
        setUnlockBuilding(false);
      }
      return;
    }

    const resolvedASM = resolveUnlockASM();
    if (!resolvedASM) return;

    setUnlockBuilding(true);
    try {
      // For hash puzzles and custom scripts, private key is optional
      const res = await buildCustomUnlockTransaction(
        unlockSourceTx.trim(),
        vout,
        resolvedASM,
        unlockDestAddr.trim(),
        feeRate,
        unlockWif.trim() && isValidPrivateKey(unlockWif.trim()) ? unlockWif.trim() : undefined
      );
      setUnlockResult(res);
      toast({ title: "Transaction Built", description: "Your spending transaction is ready to broadcast!" });
    } catch (err) {
      toast({ title: "Build Failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setUnlockBuilding(false);
    }
  }, [unlockWif, unlockSourceTx, unlockVout, unlockDestAddr, unlockFeeRate, builderUnlockTpl, unlockRPuzzleK, unlockRPuzzleType, resolveUnlockASM, toast]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleBroadcastLock = useCallback(async () => {
    if (!lockResult) return;
    setLockBroadcasting(true);
    setLockBroadcastSuccess(false);
    setLockBroadcastTxid("");
    try {
      const txid = await broadcastTransaction(lockResult.hex);
      setLockBroadcastSuccess(true);
      setLockBroadcastTxid(String(txid));
      // Auto-populate unlock builder so the user doesn't paste the wrong TX
      // The custom script output is always at index 0 in buildCustomLockTransaction
      setUnlockSourceTx(lockResult.hex);
      setUnlockVout("0");
      const displayId = txid ? `${String(txid).substring(0, 16)}...` : "sent";
      toast({
        title: "Transaction Broadcasted",
        description: `Transaction ${displayId} sent to network. Unlock source TX and vout pre-filled.`,
      });
    } catch (err) {
      toast({
        title: "Broadcast Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLockBroadcasting(false);
    }
  }, [lockResult, toast]);

  const handleBroadcastUnlock = useCallback(async () => {
    if (!unlockResult) return;
    setUnlockBroadcasting(true);
    setUnlockBroadcastSuccess(false);
    setUnlockBroadcastTxid("");
    try {
      const txid = await broadcastTransaction(unlockResult.hex);
      setUnlockBroadcastSuccess(true);
      setUnlockBroadcastTxid(String(txid));
      const displayId = txid ? `${String(txid).substring(0, 16)}...` : "sent";
      toast({
        title: "Transaction Broadcasted",
        description: `Transaction ${displayId} sent to network.`,
      });
    } catch (err) {
      toast({
        title: "Broadcast Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUnlockBroadcasting(false);
    }
  }, [unlockResult, toast]);

  const handleLoadUtxo = useCallback(async () => {
    if (!lockWif.trim() || !isValidPrivateKey(lockWif.trim())) {
      toast({ title: "Enter private key first", description: "A valid private key (WIF or hex) is needed to derive the address.", variant: "destructive" });
      return;
    }
    const { address } = importFromPrivateKey(lockWif.trim());
    setLoadingUtxo(true);
    try {
      const utxos = await fetchUtxosWithRawTx(address);
      if (utxos.length === 0) {
        toast({ title: "No UTXOs found", description: `Address ${address} has no unspent outputs.`, variant: "destructive" });
        return;
      }
      const best = utxos.filter((u) => u.rawTxHex).sort((a, b) => b.satoshis - a.satoshis)[0];
      if (!best) {
        toast({ title: "No UTXO with raw tx", description: "Could not fetch raw transaction data.", variant: "destructive" });
        return;
      }
      setLockSourceTx(best.rawTxHex!);
      setLockVout(String(best.vout));
      toast({ title: "UTXO Loaded", description: `Source TX set (vout ${best.vout}, ${best.satoshis.toLocaleString()} sats). Set the lock amount below.` });
    } catch (err) {
      toast({ title: "Failed to load UTXO", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoadingUtxo(false);
    }
  }, [lockWif, toast]);

  const handleFindSpendingTx = useCallback(async () => {
    if (!labSourceTxHex) return;
    setFetchingSpendTx(true);
    try {
      const txid = parseTxIdFromHex(labSourceTxHex);
      const found = await fetchSpendingTx(txid, labSourceOutputIndex);
      if (!found) {
        toast({
          title: "Output not spent",
          description: `Output ${labSourceOutputIndex} has not been spent yet. If your script is at a different output, change the index above.`,
          variant: "destructive",
        });
        return;
      }
      const rawHex = await fetchRawTransaction(found.spendTxid);
      const inputIdx = found.vin; // use the actual input index that spends our output
      const unlockScript = extractUnlockingScriptFromTx(rawHex, inputIdx);
      setLabSpendingInputIndex(inputIdx);
      if (unlockScript) {
        setUnlockingASM(unlockScript.asm);
        setLabSpendingTxHex(rawHex);
        setLabSpendingTxInput(rawHex);
        setResult(null);
        toast({ title: "Spending TX found", description: `Loaded spending tx ${found.spendTxid.slice(0, 12)}… (input ${found.vin})` });
      } else {
        toast({ title: "No unlocking script", description: "The spending TX input has no script (coinbase or segwit?).", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setFetchingSpendTx(false);
    }
  }, [labSourceTxHex, labSourceOutputIndex, toast]);

  const downloadHex = (hex: string, txid: string) => {
    const blob = new Blob([hex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tx-${txid.substring(0, 8)}.hex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Transaction hex file downloaded." });
  };

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);

  // Group templates by category
  const templatesByCategory = TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, PlaygroundTemplate[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Saibun</span>
            <Badge
              variant="secondary"
              className="bg-secondary text-secondary-foreground"
            >
              Script Playground
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts">
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Script Lab</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts/challenges">
                <Puzzle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Challenges</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts/tools">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tools</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/scripts/learn">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Guide</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/">
                UTXO Splitter <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Intro */}
        <section className="space-y-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            Script Playground
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Build, test, and validate Bitcoin scripts directly in your browser.
            Create custom-locked transactions or spend from them. All processing
            happens offline in your browser — your keys never leave your device.
          </p>
        </section>

        <Tabs defaultValue="lab" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lab" className="gap-2">
              <Code2 className="h-4 w-4" />
              Script Lab
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-2">
              <Wallet className="h-4 w-4" />
              Transaction Builder
            </TabsTrigger>
          </TabsList>

          {/* Script Lab Tab */}
          <TabsContent value="lab" className="space-y-8">
            {/* Template Selector */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-medium text-foreground">
                Templates
              </h2>
              <ScrollArea className="max-h-[280px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LAB_CATEGORY_ORDER.filter(cat => templatesByCategory[cat]?.length).map((category) => {
                    const templates = templatesByCategory[category];
                    return (
                      <div key={category} className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          {category}
                          <Badge variant="secondary" className="text-[8px] px-1 py-0">{templates.length}</Badge>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => loadTemplate(t)}
                              className={`px-2.5 py-1 text-[10px] rounded-full border transition-colors ${
                                selectedTemplate === t.id
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                              }`}
                            >
                              {t.name}
                              {t.educational && <span className="ml-1 opacity-50">(edu)</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {currentTemplate && currentTemplate.id !== "custom" && (
                <Card className="border-border/50 bg-muted/10">
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium text-foreground">{currentTemplate.name}</p>
                      <Badge variant="secondary" className="text-[8px]">{currentTemplate.category}</Badge>
                      {currentTemplate.requiresTxContext && (
                        <Badge variant="outline" className="text-[8px] text-amber-500 border-amber-500/30">Needs TX Context</Badge>
                      )}
                      {currentTemplate.educational && (
                        <Badge variant="outline" className="text-[8px] text-blue-500 border-blue-500/30">Educational</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{currentTemplate.description}</p>
                    {currentTemplate.note && (
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">{currentTemplate.note}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </section>

            <Separator />

            {/* Script Editors */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-medium text-foreground">
                  Scripts
                </h2>
                <p className="text-xs text-muted-foreground">
                  A <strong>locking script</strong> guards an output — the <strong>unlocking script</strong> in the spending input must satisfy it. The unlocking script runs first (pushes data), then the locking script evaluates it. Valid if the stack ends with a single <code className="text-[11px]">TRUE</code>.
                </p>
              </div>

              {/* Load Scripts from Transaction */}
              <Card className="border-border/50 bg-muted/20">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">Load Scripts from Real Transactions</p>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Paste raw TX hexes to load real scripts. Use the index spinners to pick which output/input to extract. When both TXes are loaded, <code>OP_CHECKSIG</code>-based validation uses the real transaction context (required for P2PKH and R-Puzzle).
                  </p>

                  {/* Source TX → locking script */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Source TX — locking script from output</p>
                        <Input
                          type="number"
                          min={0}
                          value={labSourceOutputIndex}
                          onChange={(e) => {
                            const idx = Math.max(0, parseInt(e.target.value) || 0);
                            setLabSourceOutputIndex(idx);
                            if (labSourceTxHex) {
                              try {
                                const lockScript = extractLockingScriptFromTx(labSourceTxHex, idx);
                                setLockingASM(lockScript.asm);
                                setResult(null);
                              } catch {
                                // out of range — user will see error on validate
                              }
                            }
                          }}
                          className="w-14 h-6 font-mono text-xs px-1.5 text-center"
                          title="Output index to extract locking script from"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste the TX that created the locked UTXO..."
                        className="font-mono text-xs flex-1 min-w-0"
                        value={labSourceTxInput}
                        onChange={(e) => setLabSourceTxInput(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => {
                          const txHex = labSourceTxInput.trim();
                          if (!txHex) {
                            toast({ title: "Empty", description: "Paste a transaction hex first.", variant: "destructive" });
                            return;
                          }
                          try {
                            const lockScript = extractLockingScriptFromTx(txHex, labSourceOutputIndex);
                            setLockingASM(lockScript.asm);
                            setLabSourceTxHex(txHex);
                            setResult(null);
                            toast({ title: "Source TX loaded", description: `Locking script extracted from output ${labSourceOutputIndex}.` });
                          } catch (err) {
                            toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to parse transaction", variant: "destructive" });
                          }
                        }}
                      >
                        Load
                      </Button>
                    </div>
                    {labSourceTxHex && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        Loaded — output {labSourceOutputIndex} ✓
                      </p>
                    )}
                  </div>

                  {/* Spending TX → unlocking script */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Spending TX(Spending the output from the tx above) — unlocking script from input</p>
                        <Input
                          type="number"
                          min={0}
                          value={labSpendingInputIndex}
                          onChange={(e) => {
                            const idx = Math.max(0, parseInt(e.target.value) || 0);
                            setLabSpendingInputIndex(idx);
                            if (labSpendingTxHex) {
                              try {
                                const unlockScript = extractUnlockingScriptFromTx(labSpendingTxHex, idx);
                                if (unlockScript) {
                                  setUnlockingASM(unlockScript.asm);
                                  setResult(null);
                                }
                              } catch {
                                // out of range — user will see error on validate
                              }
                            }
                          }}
                          className="w-14 h-6 font-mono text-xs px-1.5 text-center"
                          title="Input index to extract unlocking script from"
                        />
                      </div>
                      {labSourceTxHex && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] gap-1 text-muted-foreground shrink-0"
                          onClick={handleFindSpendingTx}
                          disabled={fetchingSpendTx}
                          title="Look up the spending transaction on-chain using Bitails"
                        >
                          {fetchingSpendTx ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Find on-chain
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste the TX that spends the locked UTXO..."
                        className="font-mono text-xs flex-1 min-w-0"
                        value={labSpendingTxInput}
                        onChange={(e) => setLabSpendingTxInput(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => {
                          const txHex = labSpendingTxInput.trim();
                          if (!txHex) {
                            toast({ title: "Empty", description: "Paste a transaction hex first.", variant: "destructive" });
                            return;
                          }
                          try {
                            const unlockScript = extractUnlockingScriptFromTx(txHex, labSpendingInputIndex);
                            if (unlockScript) {
                              setUnlockingASM(unlockScript.asm);
                              setLabSpendingTxHex(txHex);
                              setResult(null);
                              toast({ title: "Spending TX loaded", description: `Unlocking script extracted from input ${labSpendingInputIndex}.` });
                            } else {
                              toast({ title: "No unlocking script", description: `Input ${labSpendingInputIndex} has no unlocking script (coinbase?).`, variant: "destructive" });
                            }
                          } catch (err) {
                            toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to parse transaction", variant: "destructive" });
                          }
                        }}
                      >
                        Load
                      </Button>
                    </div>
                    {labSpendingTxHex && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        Loaded — input {labSpendingInputIndex} ✓
                      </p>
                    )}
                  </div>

                  {canValidateWithTxContext && (
                    <div className="flex items-start gap-1.5 text-[10px] text-[#2F6F5E]">
                      <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Both transactions loaded — validator will use real transaction context. <code>OP_CHECKSIG</code> signatures will be checked correctly.</span>
                    </div>
                  )}
                  {!canValidateWithTxContext && lockingHasChecksig && (
                    <div className="flex items-start gap-1.5 text-[10px] text-amber-500">
                      <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>This script contains <code>OP_CHECKSIG</code>. Signatures are bound to the specific spending transaction — load both TXes above to validate correctly. Without them, signature checks will always fail.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Locking Script */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Locking Script — the conditions guarding the output
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Guards the output. Defines what the spender must prove. Examples: <code className="text-[9px]">OP_SHA256 &lt;hash&gt; OP_EQUAL</code> (hash puzzle), <code className="text-[9px]">OP_DUP OP_HASH160 &lt;pkh&gt; OP_EQUALVERIFY OP_CHECKSIG</code> (P2PKH).
                </p>
                <Textarea
                  value={lockingASM}
                  onChange={(e) => {
                    const input = e.target.value;
                    setLockingASM(input);
                    setLabSourceTxHex("");
                    setResult(null);
                  }}
                  onPaste={async (e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted.trim()) {
                      try {
                        const { asm, wasHex } = detectAndConvertToASM(pasted);
                        if (wasHex) {
                          e.preventDefault();
                          setLockingASM(asm);
                          toast({
                            title: "Hex converted",
                            description: "Converted hex to ASM format.",
                          });
                        }
                      } catch (err) {
                        // Not hex or invalid - let default paste happen
                      }
                    }
                  }}
                  placeholder="OP_DUP OP_HASH160 ... OP_EQUALVERIFY OP_CHECKSIG (paste hex to auto-convert)"
                  className="font-mono text-xs sm:text-sm min-h-[80px] bg-muted/30"
                />
                <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                  {lockPreview.error ? (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {lockPreview.error}
                    </span>
                  ) : (
                    <>
                      <span>
                        Size: <strong>{lockPreview.size}</strong> bytes
                      </span>
                      {lockPreview.hex && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(lockPreview.hex, "Locking script hex")
                          }
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          Copy hex
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Unlocking Script */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Unlocking Script — the proof that satisfies the locking script
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Goes into the spending input. Pushes the proof (preimage, signature + pubkey, number, etc.) that satisfies the locking script.
                </p>
                <Textarea
                  value={unlockingASM}
                  onChange={(e) => {
                    setUnlockingASM(e.target.value);
                    setLabSpendingTxHex("");
                    setResult(null);
                  }}
                  onPaste={async (e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted.trim()) {
                      try {
                        const { asm, wasHex } = detectAndConvertToASM(pasted);
                        if (wasHex) {
                          e.preventDefault();
                          setUnlockingASM(asm);
                          toast({
                            title: "Hex converted",
                            description: "Converted hex to ASM format.",
                          });
                        }
                      } catch (err) {
                        // Not hex or invalid - let default paste happen
                      }
                    }
                  }}
                  placeholder="<signature> <public key> (paste hex to auto-convert)"
                  className="font-mono text-xs sm:text-sm min-h-[60px] bg-muted/30"
                />
                <p className="text-[10px] text-muted-foreground">
                  Paste hex script to auto-convert to ASM, or type ASM directly.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                  {unlockPreview.error ? (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {unlockPreview.error}
                    </span>
                  ) : (
                    <>
                      <span>
                        Size: <strong>{unlockPreview.size}</strong> bytes
                      </span>
                      {unlockPreview.hex && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              unlockPreview.hex,
                              "Unlocking script hex"
                            )
                          }
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          Copy hex
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Validate + Simulate buttons */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleValidate}
                    disabled={validating}
                    className="flex-1 sm:flex-none gap-2"
                    size="lg"
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {validating ? "Validating..." : canValidateWithTxContext ? "Validate Spend" : "Run Validator"}
                  </Button>
                  <Button
                    onClick={handleSimulate}
                    disabled={simulating}
                    variant="outline"
                    className="flex-1 sm:flex-none gap-2"
                    size="lg"
                  >
                    {simulating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )}
                    {simulating ? "Simulating..." : "Step-by-Step"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  <strong>Run Validator:</strong> Quickly checks if the scripts validate (pass/fail). 
                  <strong> Step-by-Step:</strong> Shows detailed execution trace with stack state after each opcode — perfect for learning how Bitcoin Script works.
                </p>
              </div>
            </section>

            {/* Results */}
            {result && (
              <>
                <Separator />
                <section className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-medium text-foreground">
                    Result
                  </h2>

                  <Card
                    className={
                      result.valid
                        ? "border-[#2F6F5E]/50 bg-[#2F6F5E]/5"
                        : "border-destructive/50 bg-destructive/5"
                    }
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        {result.valid ? (
                          <CheckCircle className="h-5 w-5 text-[#2F6F5E] shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground">
                            {result.valid
                              ? "Script validates successfully"
                              : "Script validation failed"}
                          </p>
                          {result.error && (
                            <p className="text-xs sm:text-sm text-muted-foreground break-all font-mono bg-muted/30 p-2 sm:p-3 rounded-lg">
                              {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Script details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Locking hex */}
                    <Card className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Locking Script Hex
                        </p>
                        {result.lockingHex ? (
                          <div className="flex items-start gap-2">
                            <code className="flex-1 min-w-0 text-[10px] sm:text-xs font-mono bg-muted/30 p-2 rounded break-all overflow-hidden">
                              {result.lockingHex}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-8 w-8"
                              onClick={() =>
                                copyToClipboard(
                                  result.lockingHex,
                                  "Locking script hex"
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">(empty)</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {result.lockingSize} bytes
                        </p>
                      </CardContent>
                    </Card>

                    {/* Unlocking hex */}
                    <Card className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Unlocking Script Hex
                        </p>
                        {result.unlockingHex ? (
                          <div className="flex items-start gap-2">
                            <code className="flex-1 min-w-0 text-[10px] sm:text-xs font-mono bg-muted/30 p-2 rounded break-all overflow-hidden">
                              {result.unlockingHex}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-8 w-8"
                              onClick={() =>
                                copyToClipboard(
                                  result.unlockingHex,
                                  "Unlocking script hex"
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">(empty)</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {result.unlockingSize} bytes
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Final stack */}
                  {result.finalStack.length > 0 && (
                    <Card className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Final Stack
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.finalStack.map((item, i) => (
                            <code
                              key={i}
                              className="text-[10px] sm:text-xs font-mono bg-muted/50 border border-border px-2 py-1 rounded"
                            >
                              {item}
                            </code>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </section>
              </>
            )}

            {/* Step-by-Step Simulator */}
            {simulation && (
              <>
                <Separator />
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg sm:text-xl font-medium text-foreground">
                      Step-by-Step Execution
                    </h2>
                  </div>

                  {/* Result badge */}
                  <Card
                    className={
                      simulation.valid
                        ? "border-[#2F6F5E]/50 bg-[#2F6F5E]/5"
                        : "border-destructive/50 bg-destructive/5"
                    }
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        {simulation.valid ? (
                          <CheckCircle className="h-4 w-4 text-[#2F6F5E] shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground break-words">
                          {simulation.valid
                            ? `Script valid — ${simulation.steps.length} step${simulation.steps.length !== 1 ? "s" : ""} executed`
                            : `Script invalid — ${simulation.error || "failed"}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {simulation.steps.length > 0 && (() => {
                    const curStep = simulation.steps[simStep];
                    const prevStep = simStep > 0 ? simulation.steps[simStep - 1] : null;
                    const stackDelta = curStep.stack.length - (prevStep?.stack.length ?? 0);
                    return (
                    <>
                      {/* Step Navigator */}
                      <Card className="border-border/50 overflow-hidden">
                        <CardContent className="p-3 sm:p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Step {simStep + 1} of {simulation.steps.length}
                              </p>
                              {stackDelta !== 0 && (
                                <span className={`text-xs font-mono font-medium ${stackDelta > 0 ? "text-emerald-500" : "text-red-400"}`}>
                                  {stackDelta > 0 ? `+${stackDelta}` : stackDelta}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setShowHexText(!showHexText)}
                                title={showHexText ? "Show hex" : "Show as text"}
                              >
                                <Type className={`h-3.5 w-3.5 ${showHexText ? "text-primary" : "text-muted-foreground"}`} />
                              </Button>
                              <Badge
                                variant="secondary"
                                className={
                                  curStep.context === "UnlockingScript"
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }
                              >
                                {curStep.context === "UnlockingScript" ? "Unlocking" : "Locking"}
                              </Badge>
                            </div>
                          </div>

                          {/* Step navigation controls */}
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={simStep === 0}
                              onClick={() => { setAutoPlaying(false); setSimStep(0); }}
                              title="First step"
                            >
                              <ChevronsLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={simStep === 0}
                              onClick={() => { setAutoPlaying(false); setSimStep((s) => Math.max(0, s - 1)); }}
                              title="Previous step"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>

                            {/* Auto-play button */}
                            <Button
                              variant={autoPlaying ? "default" : "outline"}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (autoPlaying) {
                                  setAutoPlaying(false);
                                } else {
                                  if (simStep >= simulation.steps.length - 1) setSimStep(0);
                                  setAutoPlaying(true);
                                }
                              }}
                              title={autoPlaying ? "Pause" : "Auto-play"}
                            >
                              {autoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>

                            {/* Step slider */}
                            <input
                              type="range"
                              min={0}
                              max={simulation.steps.length - 1}
                              value={simStep}
                              onChange={(e) => { setAutoPlaying(false); setSimStep(parseInt(e.target.value, 10)); }}
                              className="flex-1 mx-2 h-1.5 accent-primary cursor-pointer"
                            />

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={simStep === simulation.steps.length - 1}
                              onClick={() => { setAutoPlaying(false); setSimStep((s) => Math.min(simulation.steps.length - 1, s + 1)); }}
                              title="Next step"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={simStep === simulation.steps.length - 1}
                              onClick={() => { setAutoPlaying(false); setSimStep(simulation.steps.length - 1); }}
                              title="Last step"
                            >
                              <ChevronsRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Speed control (visible when auto-playing) */}
                          {autoPlaying && (
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <span>Speed:</span>
                              {[{ label: "Slow", ms: 1200 }, { label: "Normal", ms: 600 }, { label: "Fast", ms: 250 }].map((s) => (
                                <button
                                  key={s.label}
                                  type="button"
                                  onClick={() => setAutoPlaySpeed(s.ms)}
                                  className={`px-2 py-0.5 rounded text-xs transition-colors ${autoPlaySpeed === s.ms ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Current opcode */}
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-start gap-2 min-w-0">
                              <SkipForward className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <code className="text-sm font-mono font-medium text-foreground break-all min-w-0">
                                {curStep.opcode}
                              </code>
                            </div>
                            {curStep.error && (
                              <p className="text-xs text-destructive mt-2 font-mono break-all">
                                Error: {curStep.error}
                              </p>
                            )}
                          </div>

                          {/* Stack visualization */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Main Stack */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Stack ({curStep.stack.length} item{curStep.stack.length !== 1 ? "s" : ""})
                              </p>
                              <div className="bg-muted/20 border border-border rounded-lg p-2 min-h-[60px] max-h-[200px] overflow-y-auto">
                                {curStep.stack.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic text-center py-3">
                                    (empty)
                                  </p>
                                ) : (
                                  <div className="flex flex-col-reverse gap-1">
                                    {curStep.stack.map((item, i) => {
                                      const isTop = i === curStep.stack.length - 1;
                                      const isNew = prevStep ? i >= prevStep.stack.length : true;
                                      const decoded = showHexText ? tryHexToText(item) : null;
                                      return (
                                      <div
                                        key={i}
                                        className={`flex items-start gap-2 text-xs font-mono rounded px-2 py-1.5 transition-colors ${
                                          isTop
                                            ? "bg-primary/10 border border-primary/20 text-foreground"
                                            : isNew
                                              ? "bg-emerald-500/5 border border-emerald-500/15 text-foreground"
                                              : "bg-muted/30 text-muted-foreground"
                                        }`}
                                      >
                                        <span className="text-[10px] text-muted-foreground/60 shrink-0 w-4 text-right mt-0.5">
                                          {i}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <code className="break-all">{item}</code>
                                          {decoded && (
                                            <span className="block text-[10px] text-muted-foreground mt-0.5">{decoded}</span>
                                          )}
                                        </div>
                                      </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Alt Stack */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Alt Stack ({curStep.altStack.length} item{curStep.altStack.length !== 1 ? "s" : ""})
                              </p>
                              <div className="bg-muted/20 border border-border rounded-lg p-2 min-h-[60px] max-h-[200px] overflow-y-auto">
                                {curStep.altStack.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic text-center py-3">
                                    (empty)
                                  </p>
                                ) : (
                                  <div className="flex flex-col-reverse gap-1">
                                    {curStep.altStack.map((item, i) => {
                                      const decoded = showHexText ? tryHexToText(item) : null;
                                      return (
                                      <div
                                        key={i}
                                        className="flex items-start gap-2 text-xs font-mono rounded px-2 py-1.5 bg-muted/30 text-muted-foreground"
                                      >
                                        <span className="text-[10px] text-muted-foreground/60 shrink-0 w-4 text-right mt-0.5">
                                          {i}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <code className="break-all">{item}</code>
                                          {decoded && (
                                            <span className="block text-[10px] text-muted-foreground mt-0.5">{decoded}</span>
                                          )}
                                        </div>
                                      </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Execution Timeline */}
                      <Card className="border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Execution Timeline
                          </p>
                          <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                            {simulation.steps.map((step, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => { setAutoPlaying(false); setSimStep(i); }}
                                className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                                  i === simStep
                                    ? "bg-primary/10 text-foreground border border-primary/20"
                                    : "hover:bg-muted/30 text-muted-foreground"
                                }`}
                              >
                                <span className="shrink-0 w-6 text-right text-muted-foreground/60 text-[10px]">
                                  {step.stepNumber}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={`shrink-0 text-[9px] px-1 py-0 ${
                                    step.context === "UnlockingScript"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : "bg-amber-500/10 text-amber-500"
                                  }`}
                                >
                                  {step.context === "UnlockingScript" ? "UNL" : "LCK"}
                                </Badge>
                                <code className="flex-1 min-w-0 truncate">
                                  {step.opcode}
                                </code>
                                <span className="shrink-0 text-muted-foreground/60 text-[10px]">
                                  [{step.stack.length}]
                                </span>
                                {step.error && (
                                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Final Stack */}
                      <Card className="border-border/50">
                        <CardContent className="p-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Final Stack
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {simulation.finalStack.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">(empty)</p>
                            ) : (
                              simulation.finalStack.map((item, i) => (
                                <code
                                  key={i}
                                  className="text-xs font-mono bg-muted/50 border border-border px-2 py-1.5 rounded break-all"
                                >
                                  {item}
                                  {showHexText && tryHexToText(item) && (
                                    <span className="text-muted-foreground ml-2">{tryHexToText(item)}</span>
                                  )}
                                </code>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                    );
                  })()}
                </section>
              </>
            )}

            <Separator />

            {/* Opcode Reference */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg sm:text-xl font-medium text-foreground">
                  Opcode Reference
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Common Bitcoin Script opcodes grouped by category. Use these in the
                ASM editors above.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {OPCODE_REFERENCE.map((cat) => (
                  <Accordion
                    key={cat.category}
                    type="single"
                    collapsible
                    className="w-full"
                  >
                    <AccordionItem value={cat.category}>
                      <AccordionTrigger className="text-sm">
                        {cat.category}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1.5">
                          {cat.opcodes.map((op) => (
                            <div
                              key={op.name}
                              className="flex items-start gap-2 text-xs"
                            >
                              <code className="font-mono text-foreground shrink-0 min-w-[140px]">
                                {op.name}
                              </code>
                              <span className="text-muted-foreground">
                                {op.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* Transaction Builder Tab */}
          <TabsContent value="builder" className="space-y-8">
            {/* Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={builderMode === "lock" ? "default" : "outline"}
                onClick={() => { setBuilderMode("lock"); setLockResult(null); }}
                className="flex-1"
              >
                <Key className="h-4 w-4 mr-2" />
                Lock Funds
              </Button>
              <Button
                variant={builderMode === "unlock" ? "default" : "outline"}
                onClick={() => { setBuilderMode("unlock"); setUnlockResult(null); }}
                className="flex-1"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Unlock Funds
              </Button>
            </div>

            {/* ============ LOCK MODE ============ */}
            {builderMode === "lock" && (
              <div className="space-y-6">
                <section className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-medium text-foreground">
                    Lock Funds to Custom Script
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Create a transaction that locks funds to a custom locking script.
                    Choose a script type, configure it, and build the transaction offline.
                  </p>
                  <Card className="border-border/50 bg-muted/20 mt-3">
                    <CardContent className="p-3 space-y-1.5 text-[10px] text-muted-foreground">
                      <p><strong className="text-foreground">Hash Puzzle:</strong> Lock funds with a secret preimage. Anyone who knows the preimage can unlock. Use SHA256, HASH160, HASH256, RIPEMD160, or SHA1.</p>
                      <p><strong className="text-foreground">R-Puzzle:</strong> Lock funds to a signature's R value. Requires the K value (private nonce) to unlock. More private than hash puzzles.</p>
                      <p><strong className="text-foreground">Custom ASM:</strong> Write any Bitcoin Script opcodes. Test in Script Lab first!</p>
                    </CardContent>
                  </Card>
                </section>

                {/* Step 1: Script Type */}
                <Card className="border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Step 1 — Choose Locking Script
                    </p>
                    {/* Category tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {BUILDER_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setBuilderLockCategory(cat);
                            const inCat = TEMPLATES.filter(t => t.category === cat && t.id !== "custom" && !t.educational);
                            const first = inCat[0];
                            setBuilderLockTemplate(first?.id ?? null);
                            if (first && !first.interactiveConfig) setLockScriptASM(first.lockingASM);
                            setLockResult(null);
                          }}
                          className={`px-2.5 py-1 text-[10px] rounded-full border whitespace-nowrap transition-colors ${
                            builderLockCategory === cat
                              ? "bg-primary/10 text-foreground border-primary/30"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {/* Template pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATES.filter(t => t.category === builderLockCategory && t.id !== "custom" && !t.educational).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setBuilderLockTemplate(t.id);
                            if (!t.interactiveConfig) setLockScriptASM(t.lockingASM);
                            setLockResult(null);
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            builderLockTemplate === t.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                      {builderLockCategory === BUILDER_CATEGORIES[0] && (
                        <button
                          type="button"
                          onClick={() => { setBuilderLockTemplate(null); setLockResult(null); }}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            builderLockTemplate === null
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          Custom ASM
                        </button>
                      )}
                    </div>
                    {/* Template description */}
                    {builderLockTpl && !builderLockTpl.interactiveConfig && builderLockTpl.id !== "custom" && (
                      <p className="text-[10px] text-muted-foreground">{builderLockTpl.description}</p>
                    )}

                    {/* Hash Puzzle Config */}
                    {builderLockTpl?.interactiveConfig === "hash-puzzle" && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Hash Algorithm</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {(["SHA256", "HASH160", "HASH256", "RIPEMD160", "SHA1"] as HashAlgo[]).map((algo) => (
                              <button
                                key={algo}
                                type="button"
                                onClick={() => setLockHashAlgo(algo)}
                                className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors ${
                                  lockHashAlgo === algo
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {algo}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Secret Preimage</Label>
                            <button
                              type="button"
                              onClick={() => setLockHashPreimageIsHex(!lockHashPreimageIsHex)}
                              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {lockHashPreimageIsHex ? "Switch to Text" : "Switch to Hex"}
                            </button>
                          </div>
                          <Input
                            value={lockHashPreimage}
                            onChange={(e) => setLockHashPreimage(e.target.value)}
                            placeholder={lockHashPreimageIsHex ? "68656c6c6f" : "hello"}
                            className="font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            {lockHashPreimageIsHex
                              ? "Enter preimage as hex bytes."
                              : "Enter preimage as plain text — converted to hex automatically."}{" "}
                            <strong className="text-foreground">Save this securely!</strong> Anyone who knows it can unlock the funds.
                          </p>
                        </div>
                        {lockHashPreimage.trim() && (
                          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-[10px] font-mono">
                            <p className="text-muted-foreground">
                              Preimage hex: <code>{lockHashPreimageIsHex ? lockHashPreimage.trim() : textToHex(lockHashPreimage.trim())}</code>
                            </p>
                            <p className="text-muted-foreground">
                              Script: <code>OP_{lockHashAlgo} {(() => { try { return buildHashPuzzleLock(lockHashPreimage.trim(), lockHashPreimageIsHex, lockHashAlgo).hashHex; } catch { return "..."; } })()} OP_EQUAL</code>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* R-Puzzle Config */}
                    {builderLockTpl?.interactiveConfig === "r-puzzle" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={rpuzzleType}
                            onChange={(e) => setRpuzzleType(e.target.value as "raw" | "HASH160")}
                            className="text-xs px-2 py-1.5 rounded border border-border bg-background"
                          >
                            <option value="raw">Raw R (less private)</option>
                            <option value="HASH160">HASH160(R) (more private)</option>
                          </select>
                          <Button variant="outline" size="sm" onClick={handleGenerateRPuzzle} className="gap-1 text-xs">
                            <Sparkles className="h-3 w-3" />
                            Generate R-Puzzle
                          </Button>
                        </div>
                        {rpuzzleResult ? (
                          <Card className="border-border/50 bg-muted/20">
                            <CardContent className="p-3 space-y-2">
                              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-[#2F6F5E]" />
                                R-Puzzle Generated
                              </p>
                              <div className="space-y-1.5 text-[10px] font-mono">
                                <div className="flex items-start gap-2">
                                  <span className="text-muted-foreground shrink-0">K value:</span>
                                  <code className="break-all flex-1 min-w-0">{rpuzzleResult.kHex}</code>
                                  <Button variant="ghost" size="icon" className="shrink-0 h-5 w-5" onClick={() => copyToClipboard(rpuzzleResult.kHex, "K value")}>
                                    <Copy className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-muted-foreground shrink-0">R value:</span>
                                  <code className="break-all flex-1 min-w-0">{rpuzzleResult.rHex}</code>
                                  <Button variant="ghost" size="icon" className="shrink-0 h-5 w-5" onClick={() => copyToClipboard(rpuzzleResult.rHex, "R value")}>
                                    <Copy className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5 text-[10px] text-destructive">
                                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                <span>Save the K value securely — you need it to unlock!</span>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">
                            Click &quot;Generate R-Puzzle&quot; to create a new K/R pair.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Alt Stack Config */}
                    {builderLockTpl?.interactiveConfig === "alt-stack" && (
                      <div className="space-y-2 pt-2">
                        <div className="bg-muted/30 rounded-lg p-2 text-[10px] font-mono text-foreground break-all">
                          OP_TOALTSTACK OP_2 OP_MUL OP_FROMALTSTACK OP_ADD
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Result: <code className="text-[9px]">val1 × 2 + val2</code> — use Alt Stack unlock type when spending.
                        </p>
                      </div>
                    )}

                    {/* Non-interactive template or Custom: editable ASM textarea */}
                    {(builderLockTemplate === null || (builderLockTpl && !builderLockTpl.interactiveConfig)) && (
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-medium">Locking Script (ASM)</Label>
                        <Textarea
                          value={lockScriptASM}
                          onChange={(e) => setLockScriptASM(e.target.value)}
                          placeholder="OP_DUP OP_HASH160 <pubkeyhash> OP_EQUALVERIFY OP_CHECKSIG"
                          className="font-mono text-xs min-h-[80px] bg-muted/30"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Step 2: UTXO Source */}
                <Card className="border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Step 2 — Source UTXO
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Provide the UTXO you want to spend from and the amount to lock to your custom script.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        Private Key (WIF or Hex) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="password"
                        value={lockWif}
                        onChange={(e) => setLockWif(e.target.value)}
                        placeholder="WIF (K, L, 5...) or 64-char hex"
                        className="font-mono text-xs"
                      />
                      {lockAddress && (
                        <p className="text-[10px] text-muted-foreground">
                          Address: <code className="font-mono">{lockAddress}</code>
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Required to sign the transaction spending from your UTXO. The address above shows where change will go (if any).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Source Transaction (Raw Hex)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleLoadUtxo}
                          disabled={loadingUtxo || !lockAddress}
                          className="gap-1 text-[10px] h-6 px-2"
                        >
                          {loadingUtxo ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          {loadingUtxo ? "Loading..." : "Load from address"}
                        </Button>
                      </div>
                      <Textarea
                        value={lockSourceTx}
                        onChange={(e) => setLockSourceTx(e.target.value)}
                        placeholder="Paste the full raw transaction hex that contains the UTXO you want to spend..."
                        className="font-mono text-xs min-h-[80px] bg-muted/30"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        The complete raw transaction hex (starts with 01000000). Paste manually or click &quot;Load from address&quot; (requires private key above) to auto-fetch the largest UTXO.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Output Index (vout)</Label>
                        <Input type="number" value={lockVout} onChange={(e) => setLockVout(e.target.value)} placeholder="0" min="0" className="font-mono text-xs" />
                        <p className="text-[9px] text-muted-foreground">Which output in the source tx (usually 0)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Lock Amount (sats)</Label>
                        <Input type="number" value={lockAmount} onChange={(e) => setLockAmount(e.target.value)} placeholder="10000" min="546" className="font-mono text-xs" />
                        <p className="text-[9px] text-muted-foreground">How much to lock (min 546)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Fee Rate (sat/byte)</Label>
                        <Input type="number" value={lockFeeRate} onChange={(e) => setLockFeeRate(e.target.value)} placeholder="0.5" min="0.1" step="0.1" className="font-mono text-xs" />
                        <p className="text-[9px] text-muted-foreground">Transaction fee (default 0.5)</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Change Address (optional)</Label>
                      <Input value={lockChangeAddr} onChange={(e) => setLockChangeAddr(e.target.value)} placeholder="Defaults to source address" className="font-mono text-xs" />
                      <p className="text-[10px] text-muted-foreground">
                        Where to send remaining funds after locking amount + fees. Defaults to the address from your private key.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Build */}
                <Button onClick={handleBuildLock} disabled={lockBuilding} className="w-full gap-2" size="lg">
                  {lockBuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  {lockBuilding ? "Building..." : "Build Lock Transaction"}
                </Button>

                {/* Lock Result */}
                {lockResult && (
                  <Card className="border-[#2F6F5E]/50 bg-[#2F6F5E]/5">
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#2F6F5E] shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground">Transaction Built Successfully</p>
                          <div className="space-y-1 text-xs font-mono">
                            <p><span className="text-muted-foreground">TXID:</span> <code className="break-all">{lockResult.txid}</code></p>
                            <p><span className="text-muted-foreground">Size:</span> {lockResult.size.toLocaleString()} bytes</p>
                            <p><span className="text-muted-foreground">Fee:</span> {lockResult.fee.toLocaleString()} sats ({lockResult.feeRate} sat/byte)</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(lockResult.hex, "Transaction hex")} className="gap-1">
                          <Copy className="h-3 w-3" /> Copy Hex
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadHex(lockResult.hex, lockResult.txid)} className="gap-1">
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleBroadcastLock} 
                          disabled={lockBroadcasting || lockBroadcastSuccess}
                          className="gap-1"
                        >
                          {lockBroadcasting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Broadcasting...
                            </>
                          ) : lockBroadcastSuccess ? (
                            <>
                              <CheckCircle className="h-3 w-3" /> Broadcasted
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3" /> Broadcast
                            </>
                          )}
                        </Button>
                      </div>
                      {lockBroadcastSuccess && lockBroadcastTxid && (
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={`https://bitails.io/tx/${lockBroadcastTxid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#2F6F5E] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on Bitails Explorer
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => {
                              setBuilderMode("unlock");
                              setUnlockResult(null);
                            }}
                          >
                            <ArrowRight className="h-3 w-3" />
                            Proceed to Unlock
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ============ UNLOCK MODE ============ */}
            {builderMode === "unlock" && (
              <div className="space-y-6">
                <section className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-medium text-foreground">
                    Unlock Custom-Locked Funds
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Spend funds locked with a custom script. Choose the script type that matches
                    how the funds were locked, provide the secret, and build the spending transaction.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Choose the matching template and provide the secret or script that satisfies the lock.
                  </p>
                </section>

                {/* Step 1: Script Type */}
                <Card className="border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Step 1 — How were the funds locked?
                    </p>
                    {/* Category tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {BUILDER_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setBuilderUnlockCategory(cat);
                            const inCat = TEMPLATES.filter(t => t.category === cat && t.id !== "custom" && !t.educational);
                            const first = inCat[0];
                            setBuilderUnlockTemplate(first?.id ?? null);
                            if (first && !first.interactiveConfig) setUnlockScriptASM(first.unlockingASM);
                            setUnlockResult(null);
                          }}
                          className={`px-2.5 py-1 text-[10px] rounded-full border whitespace-nowrap transition-colors ${
                            builderUnlockCategory === cat
                              ? "bg-primary/10 text-foreground border-primary/30"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {/* Template pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATES.filter(t => t.category === builderUnlockCategory && t.id !== "custom" && !t.educational).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setBuilderUnlockTemplate(t.id);
                            if (!t.interactiveConfig) setUnlockScriptASM(t.unlockingASM);
                            setUnlockResult(null);
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            builderUnlockTemplate === t.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                      {builderUnlockCategory === BUILDER_CATEGORIES[0] && (
                        <button
                          type="button"
                          onClick={() => { setBuilderUnlockTemplate(null); setUnlockResult(null); }}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            builderUnlockTemplate === null
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          Custom ASM
                        </button>
                      )}
                    </div>
                    {/* Template description */}
                    {builderUnlockTpl && !builderUnlockTpl.interactiveConfig && builderUnlockTpl.id !== "custom" && (
                      <p className="text-[10px] text-muted-foreground">{builderUnlockTpl.description}</p>
                    )}

                    {/* Hash Puzzle Unlock */}
                    {builderUnlockTpl?.interactiveConfig === "hash-puzzle" && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Secret Preimage</Label>
                            <button
                              type="button"
                              onClick={() => setUnlockHashPreimageIsHex(!unlockHashPreimageIsHex)}
                              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {unlockHashPreimageIsHex ? "Switch to Text" : "Switch to Hex"}
                            </button>
                          </div>
                          <Input
                            value={unlockHashPreimage}
                            onChange={(e) => setUnlockHashPreimage(e.target.value)}
                            placeholder={unlockHashPreimageIsHex ? "68656c6c6f" : "hello"}
                            className="font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Enter the original secret that was used when locking the funds.
                            This is pushed onto the stack — the locking script hashes it and checks the result.
                          </p>
                        </div>
                        {unlockHashPreimage.trim() && (
                          <div className="bg-muted/30 rounded-lg p-3 text-[10px] font-mono text-muted-foreground">
                            Unlocking script: <code>{unlockHashPreimageIsHex ? unlockHashPreimage.trim() : textToHex(unlockHashPreimage.trim())}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* R-Puzzle Unlock */}
                    {builderUnlockTpl?.interactiveConfig === "r-puzzle" && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">R-Puzzle Type</Label>
                          <div className="flex items-center gap-2">
                            <select
                              value={unlockRPuzzleType}
                              onChange={(e) => setUnlockRPuzzleType(e.target.value as "raw" | "HASH160")}
                              className="text-xs px-2 py-1.5 rounded border border-border bg-background"
                            >
                              <option value="raw">Raw R (less private)</option>
                              <option value="HASH160">HASH160(R) (more private)</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Select the same type that was used when locking the funds.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">K Value (Private Nonce)</Label>
                          <Input
                            value={unlockRPuzzleK}
                            onChange={(e) => setUnlockRPuzzleK(e.target.value)}
                            placeholder="Paste the K value (hex) generated during locking"
                            className="font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            The K value was generated when the R-Puzzle was created.
                            The SDK uses this K to produce a signature with the matching R value,
                            satisfying the R-Puzzle locking script. If the network returns a validation
                            error, the K you use must be the exact K from when you built the lock transaction.
                          </p>
                        </div>
                        <div className="flex items-start gap-1.5 text-[10px] text-amber-500">
                          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>The K value is sensitive — anyone with it can unlock the funds. Do not share it.</span>
                        </div>
                      </div>
                    )}

                    {/* Alt Stack Unlock */}
                    {builderUnlockTpl?.interactiveConfig === "alt-stack" && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] text-muted-foreground">
                          The locking script computes <code className="text-[9px]">val1 × 2 + val2</code>.
                          Enter two numbers to push — the result must be non-zero.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Value 1 (pushed first)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={altStackVal1}
                              onChange={(e) => setAltStackVal1(e.target.value)}
                              className="font-mono text-xs"
                              placeholder="3"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Value 2 (pushed second)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={altStackVal2}
                              onChange={(e) => setAltStackVal2(e.target.value)}
                              className="font-mono text-xs"
                              placeholder="4"
                            />
                          </div>
                        </div>
                        {(() => {
                          const v1 = parseInt(altStackVal1, 10);
                          const v2 = parseInt(altStackVal2, 10);
                          if (!isNaN(v1) && !isNaN(v2)) {
                            const result = v1 * 2 + v2;
                            return (
                              <div className={`flex items-start gap-1.5 text-[10px] ${result !== 0 ? "text-[#2F6F5E]" : "text-destructive"}`}>
                                {result !== 0
                                  ? <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                  : <XCircle className="h-3 w-3 shrink-0 mt-0.5" />}
                                <span>
                                  {v1} × 2 + {v2} = <strong>{result}</strong>
                                  {result !== 0 ? " — script will succeed" : " — result is zero, script will fail"}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {/* Non-interactive template or Custom: editable ASM textarea */}
                    {(builderUnlockTemplate === null || (builderUnlockTpl && !builderUnlockTpl.interactiveConfig)) && (
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-medium">Unlocking Script (ASM)</Label>
                        <Textarea
                          value={unlockScriptASM}
                          onChange={(e) => setUnlockScriptASM(e.target.value)}
                          placeholder="OP_2 OP_3  or  68656c6c6f  or  <any opcodes>"
                          className="font-mono text-xs min-h-[80px] bg-muted/30"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Write the ASM opcodes that satisfy the locking script.
                          Test your script in the Script Lab tab first.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Step 2: UTXO + Destination */}
                <Card className="border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Step 2 — Source UTXO &amp; Destination
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Provide the locked UTXO you want to spend and where to send the unlocked funds.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        Private Key (WIF or Hex) {builderUnlockTpl?.interactiveConfig === "r-puzzle" && <span className="text-destructive">*</span>}
                        {builderUnlockTpl?.interactiveConfig !== "r-puzzle" && <span className="text-muted-foreground text-[10px]">(Optional)</span>}
                      </Label>
                      <Input
                        type="password"
                        value={unlockWif}
                        onChange={(e) => setUnlockWif(e.target.value)}
                        placeholder="WIF (K, L, 5...) or 64-char hex"
                        className="font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {builderUnlockTpl?.interactiveConfig === "r-puzzle" 
                          ? "Required for R-Puzzle — generates signature with the K value."
                          : builderUnlockTpl?.interactiveConfig === "hash-puzzle"
                          ? "Not required for hash puzzles. Only needed if you want to sign the transaction (optional)."
                          : "Optional — only needed for scripts requiring signatures. Hash puzzles don't need it."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Source Transaction (Raw Hex)</Label>
                      <Textarea
                        value={unlockSourceTx}
                        onChange={(e) => setUnlockSourceTx(e.target.value)}
                        placeholder="Paste the raw hex of the transaction that locked the funds..."
                        className="font-mono text-xs min-h-[80px] bg-muted/30"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        The raw transaction hex (starts with 01000000) that created the locked UTXO. 
                        Get it from: <code className="text-[9px]">https://api.bitails.io/download/tx/{`{txid}`}/hex</code>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Output Index (vout)</Label>
                        <Input type="number" value={unlockVout} onChange={(e) => setUnlockVout(e.target.value)} placeholder="0" min="0" className="font-mono text-xs" />
                        <p className="text-[9px] text-muted-foreground">Which output contains the locked funds (usually 0)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Fee Rate (sat/byte)</Label>
                        <Input type="number" value={unlockFeeRate} onChange={(e) => setUnlockFeeRate(e.target.value)} placeholder="0.5" min="0.1" step="0.1" className="font-mono text-xs" />
                        <p className="text-[9px] text-muted-foreground">Transaction fee (default 0.5)</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Destination Address</Label>
                      <Input
                        value={unlockDestAddr}
                        onChange={(e) => setUnlockDestAddr(e.target.value)}
                        placeholder="1... — where to send the unlocked funds"
                        className="font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Where to send the unlocked funds (minus fees). Must be a valid BSV address.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Build */}
                <Button onClick={handleBuildUnlock} disabled={unlockBuilding} className="w-full gap-2" size="lg">
                  {unlockBuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {unlockBuilding ? "Building..." : "Build Unlock Transaction"}
                </Button>

                {/* Unlock Result */}
                {unlockResult && (
                  <Card className="border-[#2F6F5E]/50 bg-[#2F6F5E]/5">
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#2F6F5E] shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground">Transaction Built Successfully</p>
                          <div className="space-y-1 text-xs font-mono">
                            <p><span className="text-muted-foreground">TXID:</span> <code className="break-all">{unlockResult.txid}</code></p>
                            <p><span className="text-muted-foreground">Size:</span> {unlockResult.size.toLocaleString()} bytes</p>
                            <p><span className="text-muted-foreground">Fee:</span> {unlockResult.fee.toLocaleString()} sats ({unlockResult.feeRate} sat/byte)</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(unlockResult.hex, "Transaction hex")} className="gap-1">
                          <Copy className="h-3 w-3" /> Copy Hex
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadHex(unlockResult.hex, unlockResult.txid)} className="gap-1">
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleBroadcastUnlock} 
                          disabled={unlockBroadcasting || unlockBroadcastSuccess}
                          className="gap-1"
                        >
                          {unlockBroadcasting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Broadcasting...
                            </>
                          ) : unlockBroadcastSuccess ? (
                            <>
                              <CheckCircle className="h-3 w-3" /> Broadcasted
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3" /> Broadcast
                            </>
                          )}
                        </Button>
                      </div>
                      {unlockBroadcastSuccess && unlockBroadcastTxid && (
                        <a
                          href={`https://bitails.io/tx/${unlockBroadcastTxid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#2F6F5E] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Bitails Explorer
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        {/* CTA */}
        <section>
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Need to split UTXOs?
                </p>
                <p className="text-xs text-muted-foreground">
                  Use the Saibun splitter to create and broadcast UTXO-splitting
                  transactions.
                </p>
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/">
                  UTXO Splitter <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <p>Saibun Script Lab</p>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  UTXO Splitter
                </Link>
                <Link
                  href="/scripts/learn"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3" />
                  Guide
                </Link>
                <Link
                  href="/scripts/challenges"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Puzzle className="h-3 w-3" />
                  Challenges
                </Link>
              </div>
            </div>
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                By using Saibun tools, you agree to our{" "}
                <Link href="/terms" className="hover:text-foreground underline transition-colors">
                  Terms of Service
                </Link>
                . Use at your own risk. Transactions are irreversible.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Security Disclaimer Dialog */}
      <DisclaimerDialog />
    </div>
  );
}
