"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type BitailsUtxo,
  fetchUtxosWithRawTx,
  satoshisToBsv,
  extractUtxoFromRawTx,
} from "@/lib/bsv";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Coins,
  Info,
  FileCode,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface UTXOFetcherProps {
  address: string;
  onUTXOsReady: (utxos: BitailsUtxo[], mode: "online" | "offline") => void;
}

interface ManualUtxoEntry {
  id: string;
  rawTxHex: string;
  vout: string;
  parsedTxid?: string;
  parsedSatoshis?: number;
  parseError?: string;
}

export function UTXOFetcher({ address, onUTXOsReady }: UTXOFetcherProps) {
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [utxos, setUtxos] = useState<BitailsUtxo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState("");
  const [noUtxosFound, setNoUtxosFound] = useState(false);
  const [manualUtxos, setManualUtxos] = useState<ManualUtxoEntry[]>([
    { id: crypto.randomUUID(), rawTxHex: "", vout: "0" }
  ]);
  const [parseError, setParseError] = useState("");

  const handleFetchUTXOs = async () => {
    setLoading(true);
    setError("");
    setNoUtxosFound(false);
    setLoadingStatus("Fetching UTXOs...");
    
    try {
      setLoadingStatus("Fetching UTXOs and source transactions...");
      const fetchedUtxos = await fetchUtxosWithRawTx(address);

      setUtxos(fetchedUtxos);
      if (fetchedUtxos.length > 0) {
        setLoadingStatus("");
        onUTXOsReady(fetchedUtxos, "online");
      } else {
        setNoUtxosFound(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch UTXOs. Check your connection or use offline mode."
      );
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const addManualUtxo = () => {
    setManualUtxos([
      ...manualUtxos,
      { id: crypto.randomUUID(), rawTxHex: "", vout: "0" }
    ]);
  };

  const removeManualUtxo = (id: string) => {
    if (manualUtxos.length > 1) {
      setManualUtxos(manualUtxos.filter(u => u.id !== id));
    }
  };

  const updateManualUtxo = (id: string, field: "rawTxHex" | "vout", value: string) => {
    setManualUtxos(manualUtxos.map(u => {
      if (u.id !== id) return u;
      
      const updated = { ...u, [field]: value };
      
      if (updated.rawTxHex && updated.vout !== "") {
        try {
          const voutNum = parseInt(updated.vout, 10);
          if (isNaN(voutNum) || voutNum < 0) {
            updated.parseError = "Invalid output index";
            updated.parsedTxid = undefined;
            updated.parsedSatoshis = undefined;
          } else {
            const parsed = extractUtxoFromRawTx(updated.rawTxHex, voutNum);
            updated.parsedTxid = parsed.txid;
            updated.parsedSatoshis = parsed.satoshis;
            updated.parseError = undefined;
          }
        } catch (err) {
          updated.parseError = err instanceof Error ? err.message : "Failed to parse";
          updated.parsedTxid = undefined;
          updated.parsedSatoshis = undefined;
        }
      } else {
        updated.parsedTxid = undefined;
        updated.parsedSatoshis = undefined;
        updated.parseError = undefined;
      }
      
      return updated;
    }));
  };

  const validateAndConfirmManualUtxos = () => {
    setParseError("");
    
    try {
      const validatedUtxos: BitailsUtxo[] = [];
      
      for (let i = 0; i < manualUtxos.length; i++) {
        const entry = manualUtxos[i];
        
        if (!entry.rawTxHex.trim()) {
          throw new Error(`UTXO ${i + 1}: Raw transaction hex is required.`);
        }
        
        const vout = parseInt(entry.vout, 10);
        if (isNaN(vout) || vout < 0) {
          throw new Error(`UTXO ${i + 1}: Invalid output index.`);
        }
        
        const utxo = extractUtxoFromRawTx(entry.rawTxHex, vout);
        validatedUtxos.push(utxo);
      }
      
      if (validatedUtxos.length === 0) {
        throw new Error("Please add at least one UTXO.");
      }
      
      setUtxos(validatedUtxos);
      onUTXOsReady(validatedUtxos, "offline");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(msg || "Validation failed");
    }
  };

  const isManualEntryValid = (entry: ManualUtxoEntry) => {
    return entry.rawTxHex.trim() && entry.vout !== "" && entry.parsedTxid && !entry.parseError;
  };

  const allManualUtxosValid = manualUtxos.every(isManualEntryValid);
  const manualTotalSatoshis = manualUtxos.reduce((sum, u) => {
    return sum + (u.parsedSatoshis || 0);
  }, 0);

  const totalSatoshis = utxos.reduce((sum, u) => sum + u.satoshis, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-medium tracking-tight text-foreground">
          Fetch UTXOs
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Retrieve unspent outputs from the network or enter raw transaction data for
          offline operation.
        </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "online" | "offline")}
      >
        <TabsList className="grid w-full grid-cols-2 bg-secondary h-10 sm:h-11">
          <TabsTrigger value="online" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Online
          </TabsTrigger>
          <TabsTrigger value="offline" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <WifiOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Offline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="mt-4 sm:mt-6">
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      Bitails API
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Fetch UTXOs and source transactions from api.bitails.io
                    </p>
                  </div>
                  <Button
                    onClick={handleFetchUTXOs}
                    disabled={loading || !address}
                    className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    {loading ? "Fetching..." : "Fetch UTXOs"}
                  </Button>
                </div>
                {loadingStatus && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-3">{loadingStatus}</p>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <Card className="border-border/50">
                <CardContent className="p-4 sm:pt-6 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && noUtxosFound && (
              <Empty className="border-border/50 bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Coins className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>No UTXOs found</EmptyTitle>
                  <EmptyDescription>
                    Fund the address from the Keys step, then fetch again. For a fully offline workflow, switch to Offline mode and paste raw transaction hex + vout.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button onClick={handleFetchUTXOs} className="w-full sm:w-auto">
                      Fetch again
                    </Button>
                    <Button asChild variant="outline" className="bg-transparent w-full sm:w-auto">
                      <Link href="/learn">Learn how it works</Link>
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
            )}
          </div>
        </TabsContent>

        <TabsContent value="offline" className="mt-4 sm:mt-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Instructions */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-2 text-xs">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      Offline Mode - Paste Raw Transaction Data
                    </p>
                    <p className="text-muted-foreground">
                      For each UTXO you want to spend, provide:
                    </p>
                    <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                      <li><strong>Raw TX Hex:</strong> The transaction that <strong>created</strong> this UTXO (the one you are spending from), not the spending tx you are building (starts with 01000000 or 02000000)</li>
                      <li><strong>Output Index:</strong> Which output to spend (0, 1, 2...)</li>
                    </ul>
                    <p className="text-muted-foreground text-[10px] sm:text-xs mt-2">
                      The txid and satoshis are automatically extracted from the raw hex.
                      Download raw TX from: <code className="bg-muted px-1 rounded text-foreground">api.bitails.io/download/tx/{"{txid}"}/hex</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual UTXO entries - simplified */}
            <div className="space-y-4">
              {manualUtxos.map((entry, index) => (
                <Card key={entry.id} className="border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">UTXO {index + 1}</span>
                      </div>
                      {manualUtxos.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeManualUtxo(entry.id)}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove UTXO ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Raw Transaction Hex
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="What is raw transaction hex?"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6} className="max-w-[280px]">
                              Paste the hex of the transaction that <strong>created</strong> this UTXO (the one you are spending from), not the spending transaction you are building.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Textarea
                          placeholder="Paste the raw transaction hex here. Example: 0100000001abc123..."
                          value={entry.rawTxHex}
                          onChange={(e) => updateManualUtxo(entry.id, "rawTxHex", e.target.value.replace(/\s/g, ""))}
                          className="min-h-[100px] font-mono text-xs"
                        />
                        {entry.rawTxHex && !entry.parseError && (
                          <p className="text-[10px] text-muted-foreground">
                            {(entry.rawTxHex.length / 2).toLocaleString()} bytes
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Output Index (vout)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="What is vout?"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6}>
                              vout is the output number inside the source transaction (0, 1, 2…).
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={entry.vout}
                          onChange={(e) => updateManualUtxo(entry.id, "vout", e.target.value)}
                          className="font-mono text-xs w-32"
                        />
                      </div>
                    </div>

                    {entry.parseError && (
                      <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {entry.parseError}
                      </div>
                    )}

                    {isManualEntryValid(entry) && (
                      <div className="flex flex-col gap-1 text-xs text-[#2F6F5E] bg-[#2F6F5E]/10 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span className="font-medium">UTXO parsed successfully</span>
                        </div>
                        <div className="ml-5 space-y-0.5 text-foreground/70">
                          <p className="font-mono text-[10px]">txid: {entry.parsedTxid?.slice(0, 16)}...{entry.parsedTxid?.slice(-8)}</p>
                          <p>Amount: <span className="font-medium text-foreground">{entry.parsedSatoshis?.toLocaleString()} sats</span></p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addManualUtxo}
                className="w-full gap-2 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                Add Another UTXO
              </Button>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Summary and confirm */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {manualUtxos.filter(isManualEntryValid).length} of {manualUtxos.length} UTXO{manualUtxos.length !== 1 ? "s" : ""} valid
                {manualTotalSatoshis > 0 && (
                  <span className="font-medium text-foreground"> ({satoshisToBsv(manualTotalSatoshis)} BSV)</span>
                )}
              </span>
              <Button
                onClick={validateAndConfirmManualUtxos}
                disabled={!allManualUtxosValid}
                className="w-full sm:w-auto"
              >
                Confirm UTXOs
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {utxos.length > 0 && (
        <Card className="border-[#2F6F5E]/30 bg-[#2F6F5E]/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#2F6F5E]/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#2F6F5E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {utxos.length} UTXO{utxos.length !== 1 ? "s" : ""} Ready
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: {satoshisToBsv(totalSatoshis)} BSV (
                  {totalSatoshis.toLocaleString()} sats)
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {utxos.map((utxo) => (
                <div
                  key={`${utxo.txid}-${utxo.vout}`}
                  className="flex items-center justify-between text-xs bg-background/50 p-3 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <code className="font-mono truncate text-muted-foreground">
                      {utxo.txid.slice(0, 8)}...:{utxo.vout}
                    </code>
                    {utxo.rawTxHex && (
                      <span title="Source TX loaded">
                        <FileCode className="h-3.5 w-3.5 text-[#2F6F5E] shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-foreground shrink-0 ml-2">
                    {utxo.satoshis.toLocaleString()} sats
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
