"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  ArrowLeftRight,
  Code2,
  BookOpen,
  Copy,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Puzzle,
  Wrench,
  Lock,
  Unlock,
} from "lucide-react";
import {
  hexToASM,
  scriptHexPreview,
  isHex,
  hexToText,
} from "@/lib/script-playground";
import { Transaction } from "@bsv/sdk";

// ---------------------------------------------------------------------------
//  Hex ↔ ASM Converter
// ---------------------------------------------------------------------------

function HexAsmConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"hex-to-asm" | "asm-to-hex">("hex-to-asm");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    setError("");
    setOutput("");
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      if (mode === "hex-to-asm") {
        const clean = trimmed.replace(/\s+/g, "");
        if (!/^[0-9a-fA-F]*$/.test(clean)) {
          setError("Input is not valid hex. Use hex-to-ASM mode or switch to ASM-to-hex.");
          return;
        }
        const asm = hexToASM(clean);
        setOutput(asm);
      } else {
        const preview = scriptHexPreview(trimmed);
        if (preview.error) {
          setError(preview.error);
          return;
        }
        setOutput(preview.hex);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    }
  }, [input, mode]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  const handleSwap = useCallback(() => {
    setMode((m) => m === "hex-to-asm" ? "asm-to-hex" : "hex-to-asm");
    setOutput("");
    setError("");
    if (output) {
      setInput(output);
    }
  }, [output]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {mode === "hex-to-asm" ? "Script Hex" : "Script ASM"}
            </label>
          </div>
          <Textarea
            placeholder={mode === "hex-to-asm" ? "Paste script hex..." : "Type ASM opcodes..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-sm min-h-[120px] resize-y"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {mode === "hex-to-asm" ? "Decoded ASM" : "Encoded Hex"}
            </label>
            {output && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="bg-muted/30 border border-border rounded-lg p-3 font-mono text-sm min-h-[120px] break-all whitespace-pre-wrap text-foreground">
            {output || <span className="text-muted-foreground italic">Result will appear here...</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={handleConvert} disabled={!input.trim()} className="gap-1.5">
          <ArrowRight className="h-3.5 w-3.5" />
          Convert
        </Button>
        <Button variant="outline" onClick={handleSwap} className="gap-1.5">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Swap
        </Button>
        <Badge variant="outline" className="text-xs">
          {mode === "hex-to-asm" ? "Hex → ASM" : "ASM → Hex"}
        </Badge>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Transaction Decoder
// ---------------------------------------------------------------------------

interface DecodedTx {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  inputs: {
    prevTxId: string;
    outputIndex: number;
    scriptHex: string;
    scriptASM: string;
    sequence: number;
  }[];
  outputs: {
    index: number;
    satoshis: number;
    scriptHex: string;
    scriptASM: string;
  }[];
}

function tryDecodeText(hex: string): string | null {
  if (!hex || hex.length < 2 || hex.length > 400) return null;
  try {
    const text = hexToText(hex);
    if ([...text].every(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127)) return text;
  } catch { /* ignore */ }
  return null;
}

function TransactionDecoder() {
  const [rawHex, setRawHex] = useState("");
  const [decoded, setDecoded] = useState<DecodedTx | null>(null);
  const [error, setError] = useState("");

  const handleDecode = useCallback(() => {
    setError("");
    setDecoded(null);
    const hex = rawHex.trim().replace(/\s+/g, "");
    if (!hex) return;

    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      setError("Input is not valid hex.");
      return;
    }

    try {
      const tx = Transaction.fromHex(hex);
      const txid = tx.id("hex") as string;
      const txBin = tx.toBinary();

      const inputs = (tx.inputs || []).map((inp, i) => {
        const prevHash = inp.sourceTXID || "";
        const scriptBuf = inp.unlockingScript ? inp.unlockingScript.toBinary() : new Uint8Array(0);
        const scriptHex = [...scriptBuf].map(b => b.toString(16).padStart(2, "0")).join("");
        let scriptASM = "";
        try { scriptASM = hexToASM(scriptHex); } catch { scriptASM = "(could not decode)"; }
        return {
          prevTxId: prevHash,
          outputIndex: inp.sourceOutputIndex ?? 0,
          scriptHex,
          scriptASM,
          sequence: inp.sequence ?? 0xffffffff,
        };
      });

      const outputs = (tx.outputs || []).map((out, i) => {
        const scriptBuf = out.lockingScript ? out.lockingScript.toBinary() : new Uint8Array(0);
        const scriptHex = [...scriptBuf].map(b => b.toString(16).padStart(2, "0")).join("");
        let scriptASM = "";
        try { scriptASM = hexToASM(scriptHex); } catch { scriptASM = "(could not decode)"; }
        return {
          index: i,
          satoshis: Number(out.satoshis ?? 0),
          scriptHex,
          scriptASM,
        };
      });

      setDecoded({
        txid,
        version: tx.version,
        locktime: tx.lockTime,
        size: txBin.length,
        inputs,
        outputs,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decode transaction. Make sure it's a valid raw transaction hex.");
    }
  }, [rawHex]);

  const totalOutput = decoded ? decoded.outputs.reduce((sum, o) => sum + o.satoshis, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Raw Transaction Hex
        </label>
        <Textarea
          placeholder="Paste a raw Bitcoin transaction hex..."
          value={rawHex}
          onChange={(e) => setRawHex(e.target.value)}
          className="font-mono text-sm min-h-[100px] resize-y"
        />
      </div>

      <Button onClick={handleDecode} disabled={!rawHex.trim()} className="gap-1.5">
        <FileSearch className="h-3.5 w-3.5" />
        Decode Transaction
      </Button>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          {/* Overview */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Transaction Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="text-sm font-mono text-foreground">{decoded.size} bytes</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="text-sm font-mono text-foreground">{decoded.version}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Locktime</p>
                  <p className="text-sm font-mono text-foreground">{decoded.locktime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Output</p>
                  <p className="text-sm font-mono text-foreground">{(totalOutput / 1e8).toFixed(8)} BSV</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">TXID</p>
                <p className="text-xs font-mono text-foreground break-all">{decoded.txid}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inputs */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium text-foreground">
                  Inputs ({decoded.inputs.length})
                </h3>
              </div>
              <div className="space-y-3">
                {decoded.inputs.map((inp, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Input #{i}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        seq: {inp.sequence === 0xffffffff ? "0xFFFFFFFF" : `0x${inp.sequence.toString(16).toUpperCase()}`}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Previous TX</p>
                      <p className="text-xs font-mono text-foreground break-all">
                        {inp.prevTxId}:{inp.outputIndex}
                      </p>
                    </div>
                    {inp.scriptASM && (
                      <div>
                        <p className="text-xs text-muted-foreground">ScriptSig (ASM)</p>
                        <p className="text-xs font-mono text-foreground break-all bg-muted/30 rounded p-2">
                          {inp.scriptASM}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outputs */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-medium text-foreground">
                  Outputs ({decoded.outputs.length})
                </h3>
              </div>
              <div className="space-y-3">
                {decoded.outputs.map((out) => {
                  const isOpReturn = out.scriptASM.includes("OP_RETURN");
                  return (
                    <div key={out.index} className="bg-muted/20 border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            Output #{out.index}
                          </Badge>
                          {isOpReturn && (
                            <Badge variant="outline" className="text-xs">Data</Badge>
                          )}
                        </div>
                        <span className="text-sm font-mono font-medium text-foreground">
                          {out.satoshis > 0 ? `${(out.satoshis / 1e8).toFixed(8)} BSV` : "0 BSV"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ScriptPubKey (ASM)</p>
                        <p className="text-xs font-mono text-foreground break-all bg-muted/30 rounded p-2">
                          {out.scriptASM}
                        </p>
                      </div>
                      {isOpReturn && (() => {
                        // Try to decode OP_RETURN data pushes
                        const parts = out.scriptASM.split(" ").filter(p => !p.startsWith("OP_"));
                        const decodedParts = parts.map(p => tryDecodeText(p)).filter(Boolean);
                        if (decodedParts.length > 0) {
                          return (
                            <div>
                              <p className="text-xs text-muted-foreground">Decoded Data</p>
                              <p className="text-sm text-foreground">{decodedParts.join(" | ")}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Page
// ---------------------------------------------------------------------------

export default function ScriptToolsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Saibun</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Script Tools
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
        {/* Hero */}
        <section className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            Script Tools
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Utility tools for working with Bitcoin scripts and transactions.
            Everything runs locally in your browser.
          </p>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="converter" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="converter" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Hex / ASM
            </TabsTrigger>
            <TabsTrigger value="decoder" className="gap-2">
              <FileSearch className="h-4 w-4" />
              TX Decoder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="converter" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-foreground">Script Hex / ASM Converter</h2>
              <p className="text-sm text-muted-foreground">
                Convert between raw script hex and human-readable ASM notation.
              </p>
            </div>
            <HexAsmConverter />
          </TabsContent>

          <TabsContent value="decoder" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-foreground">Transaction Decoder</h2>
              <p className="text-sm text-muted-foreground">
                Paste a raw transaction hex to decode its structure &mdash; inputs, outputs, scripts, and values.
              </p>
            </div>
            <TransactionDecoder />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Saibun &mdash; Script Tools</p>
            <div className="flex items-center gap-4">
              <Link href="/scripts" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                Script Lab
              </Link>
              <Link href="/scripts/challenges" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Puzzle className="h-3.5 w-3.5" />
                Challenges
              </Link>
              <Link href="/scripts/tools" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" />
                Tools
              </Link>
              <Link href="/scripts/learn" className="hover:text-foreground transition-colors flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Guide
              </Link>
              <Link href="/" className="hover:text-foreground transition-colors">
                UTXO Splitter
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
