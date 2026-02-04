"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  type BitailsUtxo,
  type SplitConfig as SplitConfigType,
  isValidAddress,
  satoshisToBsv,
  calculateFee,
  deriveAddressesFromXpub,
  parseRawTransactionHex,
} from "@/lib/bsv";
import {
  Split,
  Wallet,
  Key,
  AlertCircle,
  Info,
  Plus,
  Minus,
  Calculator,
  Settings,
  FileCode,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface SplitConfigProps {
  utxos: BitailsUtxo[];
  sourceAddress: string;
  onConfigReady: (config: SplitConfigType, updatedUtxos: BitailsUtxo[]) => void;
}

const DUST_THRESHOLD = 1; // BSV allows 1 sat outputs

export function SplitConfig({ utxos, sourceAddress, onConfigReady }: SplitConfigProps) {
  const [mode, setMode] = useState<"address" | "xpub">("address");
  const [singleAddress, setSingleAddress] = useState("");
  const [xpub, setXpub] = useState("");
  const [derivationPath, setDerivationPath] = useState("m/44'/145'/0'/0");
  const [startIndex, setStartIndex] = useState(0);
  const [utxoCount, setUtxoCount] = useState(10);
  const [satoshisPerUtxo, setSatoshisPerUtxo] = useState(1000);
  const [feeRate, setFeeRate] = useState(0.5);
  const [error, setError] = useState("");
  const [addressValid, setAddressValid] = useState(false);
  const [xpubValid, setXpubValid] = useState(false);
  const [derivedAddresses, setDerivedAddresses] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localUtxos, setLocalUtxos] = useState<BitailsUtxo[]>(utxos);
  const [rawTxInputs, setRawTxInputs] = useState<Record<string, string>>({});

  const utxosMissingRawTx = localUtxos.filter(u => !u.rawTxHex);
  const allUtxosHaveRawTx = utxosMissingRawTx.length === 0;

  useEffect(() => {
    setLocalUtxos(utxos);
  }, [utxos]);

  useEffect(() => {
    if (sourceAddress && !singleAddress) {
      setSingleAddress(sourceAddress);
    }
  }, [sourceAddress, singleAddress]);

  useEffect(() => {
    if (singleAddress.trim()) {
      const valid = isValidAddress(singleAddress.trim());
      setAddressValid(valid);
    } else {
      setAddressValid(false);
    }
  }, [singleAddress]);

  useEffect(() => {
    if (xpub.trim() && mode === "xpub") {
      try {
        const addresses = deriveAddressesFromXpub(xpub.trim(), derivationPath, startIndex, utxoCount);
        setDerivedAddresses(addresses);
        setXpubValid(true);
        setError("");
      } catch (err) {
        setXpubValid(false);
        setDerivedAddresses([]);
        setError(err instanceof Error ? err.message : "Invalid xPub");
      }
    } else {
      setXpubValid(false);
      setDerivedAddresses([]);
    }
  }, [xpub, derivationPath, startIndex, utxoCount, mode]);

  const totalInput = localUtxos.reduce((sum, u) => sum + u.satoshis, 0);
  const totalOutput = utxoCount * satoshisPerUtxo;
  const estimatedFee = calculateFee(localUtxos.length, utxoCount + 1, feeRate);
  const estimatedChange = totalInput - totalOutput - estimatedFee;

  const maxUtxos = Math.floor((totalInput - calculateFee(localUtxos.length, 2, feeRate)) / DUST_THRESHOLD);
  const suggestedUtxoCount = Math.min(
    Math.floor((totalInput - estimatedFee) / satoshisPerUtxo),
    100
  );

  const handleRawTxInput = (utxoKey: string, hex: string) => {
    setRawTxInputs(prev => ({ ...prev, [utxoKey]: hex }));
  };

  const applyRawTx = (utxo: BitailsUtxo) => {
    const utxoKey = `${utxo.txid}:${utxo.vout}`;
    const hex = rawTxInputs[utxoKey];
    
    if (!hex) {
      setError(`Please paste the raw transaction hex for ${utxo.txid.slice(0, 8)}...`);
      return;
    }

    try {
      const tx = parseRawTransactionHex(hex);
      const parsedTxid = tx.id("hex") as string;
      
      if (parsedTxid !== utxo.txid) {
        setError(`Transaction ID mismatch. Expected ${utxo.txid.slice(0, 16)}..., got ${parsedTxid.slice(0, 16)}...`);
        return;
      }

      if (utxo.vout >= tx.outputs.length) {
        setError(`Output index ${utxo.vout} doesn't exist in this transaction`);
        return;
      }

      setLocalUtxos(prev => prev.map(u => 
        u.txid === utxo.txid && u.vout === utxo.vout
          ? { ...u, rawTxHex: hex.trim() }
          : u
      ));

      setRawTxInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[utxoKey];
        return newInputs;
      });
      
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid transaction hex");
    }
  };

  const handleConfigure = () => {
    setError("");

    if (!allUtxosHaveRawTx) {
      setError("Please provide raw transaction hex for all UTXOs");
      return;
    }

    if (mode === "address" && !addressValid) {
      setError("Please enter a valid BSV address");
      return;
    }

    if (mode === "xpub" && !xpubValid) {
      setError("Please enter a valid xPub key");
      return;
    }

    if (estimatedChange < -1) {
      setError("Insufficient funds for this configuration");
      return;
    }

    if (satoshisPerUtxo < DUST_THRESHOLD) {
      setError(`Satoshis per UTXO must be at least ${DUST_THRESHOLD}`);
      return;
    }

    const config: SplitConfigType = {
      outputCount: utxoCount,
      satoshisPerOutput: satoshisPerUtxo,
      feeRate: feeRate,
      recipientMode: mode === "address" ? "single" : "xpub",
      recipientAddress: mode === "address" ? singleAddress.trim() : undefined,
      xpub: mode === "xpub" ? xpub.trim() : undefined,
      derivationPath: mode === "xpub" ? derivationPath : undefined,
      startIndex: mode === "xpub" ? startIndex : undefined,
      derivedAddresses: mode === "xpub" ? derivedAddresses : undefined,
    };

    onConfigReady(config, localUtxos);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-medium tracking-tight text-foreground">
          Split Configuration
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Configure how you want to split your UTXOs. Choose a recipient method
          and set the split parameters.
        </p>
      </div>

      {/* Raw Transaction Data Section (for offline mode) */}
      {!allUtxosHaveRawTx && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-start gap-2 mb-4">
              <FileCode className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Raw Transaction Hex Required (Not UTXO Data)
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {utxosMissingRawTx.length} UTXO{utxosMissingRawTx.length > 1 ? 's' : ''} missing source transaction hex. 
                  This is the raw hex of the transaction that created each UTXO, needed for offline signing.
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Format: Long hex string starting with <code className="bg-muted px-1 rounded">01000000</code> or <code className="bg-muted px-1 rounded">02000000</code>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {utxosMissingRawTx.map((utxo) => {
                const utxoKey = `${utxo.txid}:${utxo.vout}`;
                return (
                  <div key={utxoKey} className="space-y-2 p-3 bg-background rounded-lg border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground truncate">
                          {utxo.txid.slice(0, 16)}...:{utxo.vout}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {utxo.satoshis.toLocaleString()} sats
                        </p>
                      </div>
                      <a
                        href={`https://api.bitails.io/download/tx/${utxo.txid}/hex`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                      >
                        Get from Bitails
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Textarea
                      placeholder="Paste raw transaction hex here (long hex string starting with 01000000 or 02000000, NOT JSON)..."
                      value={rawTxInputs[utxoKey] || ""}
                      onChange={(e) => handleRawTxInput(utxoKey, e.target.value)}
                      className="font-mono text-[10px] sm:text-xs h-20 resize-none"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => applyRawTx(utxo)}
                      disabled={!rawTxInputs[utxoKey]}
                      className="w-full sm:w-auto text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      Verify & Apply
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show success if all UTXOs have raw tx */}
      {allUtxosHaveRawTx && localUtxos.length > 0 && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2F6F5E] bg-[#2F6F5E]/10 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4 shrink-0" />
          All {localUtxos.length} UTXO{localUtxos.length > 1 ? 's' : ''} have source transaction data. Ready to configure split.
        </div>
      )}

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "address" | "xpub")}
      >
        <TabsList className="grid w-full grid-cols-2 bg-secondary h-10 sm:h-11">
          <TabsTrigger value="address" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Single Address
          </TabsTrigger>
          <TabsTrigger value="xpub" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Key className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            xPub Derivation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="address" className="mt-4 sm:mt-6">
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="recipient-address" className="text-xs sm:text-sm font-medium">
              Recipient Address
            </Label>
            <Input
              id="recipient-address"
              placeholder="Enter BSV address (starts with 1)"
              value={singleAddress}
              onChange={(e) => setSingleAddress(e.target.value)}
              className={`font-mono text-xs sm:text-sm ${
                singleAddress && !addressValid
                  ? "border-destructive"
                  : addressValid
                    ? "border-[#2F6F5E]"
                    : ""
              }`}
            />
            {singleAddress && !addressValid && (
              <p className="text-[10px] sm:text-xs text-destructive">Invalid BSV address</p>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              All {utxoCount} outputs will be sent to this address. Defaults to
              your source address.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="xpub" className="mt-4 sm:mt-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="xpub" className="text-xs sm:text-sm font-medium">
                Extended Public Key (xPub)
              </Label>
              <Input
                id="xpub"
                placeholder="xpub661MyMwAqRbcF..."
                value={xpub}
                onChange={(e) => setXpub(e.target.value)}
                className={`font-mono text-xs ${
                  xpub && !xpubValid
                    ? "border-destructive"
                    : xpubValid
                      ? "border-[#2F6F5E]"
                      : ""
                }`}
              />
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              {showAdvanced ? "Hide" : "Show"} Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-2">
                  <Label htmlFor="derivation-path" className="text-xs font-medium">
                    Derivation Path (without index)
                  </Label>
                  <Input
                    id="derivation-path"
                    placeholder="m/44'/145'/0'/0"
                    value={derivationPath}
                    onChange={(e) => setDerivationPath(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Common paths: m/44&apos;/145&apos;/0&apos;/0 (BIP44 BSV), m/44&apos;/0&apos;/0&apos;/0 (BIP44 BTC), m/0 (Simple)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-index" className="text-xs font-medium">
                    Start Index
                  </Label>
                  <Input
                    id="start-index"
                    type="number"
                    min={0}
                    value={startIndex}
                    onChange={(e) => setStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
                    className="font-mono text-xs w-32"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Addresses will be derived from index {startIndex} to {startIndex + utxoCount - 1}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-muted/50 border border-border rounded-lg p-2 sm:p-3">
              <div className="flex gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
                <div>
                  <p>
                    Derivation:{" "}
                    <code className="bg-muted px-1 rounded">
                      {derivationPath}/{startIndex}...{startIndex + utxoCount - 1}
                    </code>
                  </p>
                  <p className="mt-1">
                    Each output goes to a unique derived address
                  </p>
                </div>
              </div>
            </div>

            {/* Preview derived addresses */}
            {xpubValid && derivedAddresses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Preview (first 3 addresses)</Label>
                <div className="space-y-1.5 font-mono text-[10px] text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {derivedAddresses.slice(0, 3).map((addr, i) => (
                    <p key={addr} className="flex gap-2">
                      <span className="text-foreground/50">/{startIndex + i}:</span>
                      <span className="truncate">{addr}</span>
                    </p>
                  ))}
                  {derivedAddresses.length > 3 && (
                    <p className="text-muted-foreground/70">...and {derivedAddresses.length - 3} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Split Parameters */}
      <Card className="border-border/50">
        <CardContent className="p-4 sm:pt-6 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
            <Split className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Split Parameters
          </div>

          {/* Number of UTXOs */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <Label className="text-xs sm:text-sm">Number of UTXOs</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-transparent"
                  onClick={() => setUtxoCount(Math.max(1, utxoCount - 1))}
                  aria-label="Decrease number of UTXOs"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={utxoCount}
                  onChange={(e) =>
                    setUtxoCount(
                      Math.max(1, Math.min(1000, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-20 text-center text-xs sm:text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-transparent"
                  onClick={() => setUtxoCount(Math.min(1000, utxoCount + 1))}
                  aria-label="Increase number of UTXOs"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Max possible: ~{maxUtxos.toLocaleString()} UTXOs | Suggested:{" "}
              {suggestedUtxoCount.toLocaleString()} UTXOs
            </p>
          </div>

          {/* Satoshis per UTXO */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <Label className="text-xs sm:text-sm">Satoshis per UTXO</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={satoshisPerUtxo}
                  onChange={(e) =>
                    setSatoshisPerUtxo(
                      Math.max(DUST_THRESHOLD, parseInt(e.target.value) || DUST_THRESHOLD)
                    )
                  }
                  className="w-28 text-right text-xs sm:text-sm"
                />
                <span className="text-[10px] sm:text-xs text-muted-foreground w-8">sats</span>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Minimum: {DUST_THRESHOLD} sat{DUST_THRESHOLD > 1 ? "s" : ""} | Each output:{" "}
              {satoshisToBsv(satoshisPerUtxo)} BSV
            </p>
          </div>

          {/* Fee Rate */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm">Fee Rate</Label>
              <span className="text-xs sm:text-sm font-mono">{feeRate} sat/byte</span>
            </div>
            <Slider
              value={[feeRate]}
              onValueChange={(v) => setFeeRate(v[0])}
              min={0.25}
              max={2}
              step={0.25}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>0.25</span>
              <span>0.5</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-4 sm:pt-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4">
            <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Transaction Summary
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Total Input</p>
              <p className="font-mono font-medium text-xs sm:text-sm">
                {totalInput.toLocaleString()} sats
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Total Output</p>
              <p className="font-mono font-medium text-xs sm:text-sm">
                {totalOutput.toLocaleString()} sats
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Estimated Fee</p>
              <p className="font-mono font-medium text-xs sm:text-sm">
                ~{estimatedFee.toLocaleString()} sats
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Change (returned)</p>
              <p
                className={`font-mono font-medium text-xs sm:text-sm ${
                  estimatedChange < 0 ? "text-destructive" : ""
                }`}
              >
                {estimatedChange < 0 ? "-" : ""}
                {Math.abs(estimatedChange).toLocaleString()} sats
              </p>
            </div>
          </div>

          {estimatedChange > 0 && estimatedChange < DUST_THRESHOLD && (
            <div className="mt-3 sm:mt-4 flex items-start gap-2 text-[10px] sm:text-xs text-muted-foreground bg-background/50 p-2 sm:p-3 rounded-lg">
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
              Change below dust threshold will be added to miner fee.
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        onClick={handleConfigure}
        disabled={
          !allUtxosHaveRawTx ||
          (mode === "address" && !addressValid) ||
          (mode === "xpub" && !xpubValid) ||
          estimatedChange < -1
        }
        className="w-full text-xs sm:text-sm"
        size="lg"
      >
        <Split className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
        Configure Split
      </Button>
    </div>
  );
}
