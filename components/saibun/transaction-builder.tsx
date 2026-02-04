"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type BitailsUtxo,
  type SplitConfig,
  type TransactionDetails,
  buildSplitTransaction,
  broadcastTransaction,
  downloadTransaction,
  satoshisToBsv,
} from "@/lib/bsv";
import { useToast } from "@/hooks/use-toast";
import {
  FileCode,
  Send,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowDown,
  Info,
} from "lucide-react";

interface TransactionBuilderProps {
  privateKeyWif: string;
  sourceAddress: string;
  utxos: BitailsUtxo[];
  config: SplitConfig;
  isOfflineMode?: boolean;
}

export function TransactionBuilder({
  privateKeyWif,
  sourceAddress,
  utxos,
  config,
  isOfflineMode = false,
}: TransactionBuilderProps) {
  const [building, setBuilding] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);
  const [error, setError] = useState("");
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const { toast } = useToast();

  const buildTx = async () => {
    setBuilding(true);
    setError("");
    try {
      const result = await buildSplitTransaction(
        privateKeyWif,
        utxos,
        sourceAddress,
        config
      );
      setTxDetails(result);
    } catch (err) {
      console.error("[v0] Transaction build error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to build transaction"
      );
    } finally {
      setBuilding(false);
    }
  };

  const broadcastTx = async () => {
    if (!txDetails) return;

    setBroadcasting(true);
    setBroadcastError("");
    try {
      await broadcastTransaction(txDetails.hex);
      setBroadcastSuccess(true);
    } catch (err) {
      setBroadcastError(
        err instanceof Error ? err.message : "Failed to broadcast transaction"
      );
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDownload = () => {
    if (!txDetails) return;
    downloadTransaction(txDetails.hex, txDetails.txid);
    toast({
      title: "Downloaded",
      description: "Raw transaction hex file saved.",
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    });
  };

  const totalInput = utxos.reduce((sum, u) => sum + u.satoshis, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AlertDialog open={confirmBroadcastOpen} onOpenChange={setConfirmBroadcastOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Broadcast this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to broadcast a signed transaction to the network. Double-check the preview and fee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {txDetails && (
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">New UTXOs</span>
                <span className="font-medium">{config.outputCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">{txDetails.fee.toLocaleString()} sats</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fee rate</span>
                <span className="font-medium">{txDetails.feeRate} sat/b</span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmBroadcastOpen(false);
                void broadcastTx();
              }}
            >
              Broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-medium tracking-tight text-foreground">
          Build & Broadcast
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Build your signed transaction and choose to broadcast it to the
          network or download for later.
        </p>
      </div>

      {/* Transaction Summary */}
      <Card className="border-border/50">
        <CardContent className="p-4 sm:pt-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4">
            <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Transaction Preview
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Inputs */}
            <div className="space-y-2">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inputs ({utxos.length})
              </p>
              <div className="bg-muted/30 rounded-lg p-2 sm:p-3 space-y-1">
                {utxos.slice(0, 3).map((utxo, i) => (
                  <div key={i} className="flex justify-between text-[10px] sm:text-xs">
                    <code className="font-mono text-muted-foreground">
                      {utxo.txid.slice(0, 8)}...:{utxo.vout}
                    </code>
                    <span className="font-medium">
                      {utxo.satoshis.toLocaleString()} sats
                    </span>
                  </div>
                ))}
                {utxos.length > 3 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center pt-1">
                    + {utxos.length - 3} more inputs
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>

            {/* Outputs */}
            <div className="space-y-2">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Outputs ({config.outputCount} + change)
              </p>
              <div className="bg-muted/30 rounded-lg p-2 sm:p-3 space-y-1">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">
                    {config.outputCount} UTXOs @{" "}
                    {config.satoshisPerOutput.toLocaleString()} sats each
                  </span>
                  <span className="font-medium">
                    {(
                      config.outputCount * config.satoshisPerOutput
                    ).toLocaleString()}{" "}
                    sats
                  </span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    To:{" "}
                    {config.recipientAddress
                      ? `${config.recipientAddress.slice(0, 10)}...`
                      : "xPub derived"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-sm sm:text-lg font-mono font-medium">
                  {satoshisToBsv(totalInput)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Input (BSV)</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-mono font-medium">
                  {config.outputCount}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">New UTXOs</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-mono font-medium">
                  {config.feeRate}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">sat/byte</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!txDetails ? (
        <>
          {error && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
              <span className="break-all">{error}</span>
            </div>
          )}

          <Button
            onClick={buildTx}
            disabled={building}
            className="w-full text-xs sm:text-sm"
            size="lg"
          >
            {building ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                Building & Signing...
              </>
            ) : (
              <>
                <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Build & Sign Transaction
              </>
            )}
          </Button>
        </>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Transaction ID */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-medium">
                  Transaction Built Successfully
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Transaction ID:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[9px] sm:text-xs bg-background/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono break-all border border-border/50">
                      {txDetails.txid}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => copyToClipboard(txDetails.txid, "Transaction ID")}
                      aria-label="Copy transaction id"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-mono font-medium">
                      {txDetails.size.toLocaleString()} bytes
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee</p>
                    <p className="font-mono font-medium">
                      {txDetails.fee.toLocaleString()} sats
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee Rate</p>
                    <p className="font-mono font-medium">
                      {txDetails.feeRate} sat/b
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outputs breakdown */}
          <Card className="border-border/50">
            <CardContent className="p-4 sm:pt-6">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">
                Outputs ({txDetails.outputs.length})
              </p>
              <div className="space-y-1 max-h-[120px] sm:max-h-[150px] overflow-y-auto">
                {txDetails.outputs.map((output, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-[10px] sm:text-xs bg-muted/30 p-1.5 sm:p-2 rounded"
                  >
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <span className="text-muted-foreground">#{i}</span>
                      <code className="font-mono truncate">
                        {output.address.slice(0, 10)}...
                      </code>
                      {output.isChange && (
                        <span className="text-[9px] sm:text-xs bg-accent/20 text-accent px-1 sm:px-1.5 py-0.5 rounded shrink-0">
                          change
                        </span>
                      )}
                    </div>
                    <span className="font-medium shrink-0 ml-2">
                      {output.satoshis.toLocaleString()} sats
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Raw Transaction — compact: no full hex to avoid huge scroll */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-foreground">Raw transaction hex</p>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                ({txDetails.size.toLocaleString()} bytes)
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(txDetails.hex, "Raw transaction hex")}
                className="gap-1 h-8 sm:h-9 text-xs"
                aria-label="Copy raw transaction hex"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="gap-1 h-8 sm:h-9 text-xs"
                aria-label="Download raw transaction hex file"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>

          {isOfflineMode && !broadcastSuccess && (
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      What to do with the downloaded hex file
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      When you're back online, broadcast the raw transaction hex using the Bitails API or Bitails explorer tools only.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                      The hex file contains the complete signed transaction ready to broadcast.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {!broadcastSuccess ? (
            <div className={isOfflineMode ? "grid grid-cols-1 gap-2 sm:gap-3" : "grid grid-cols-2 gap-2 sm:gap-3"}>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-1.5 sm:gap-2 bg-transparent text-xs sm:text-sm"
                size="lg"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Download TX
              </Button>
              {!isOfflineMode && (
                <Button
                  onClick={() => setConfirmBroadcastOpen(true)}
                  disabled={broadcasting}
                  className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
                  size="lg"
                >
                  {broadcasting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {broadcastError ? "Retry Broadcast" : "Broadcast"}
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <Card className="border-accent bg-accent/10">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-full shrink-0">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      Transaction Broadcast!
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your UTXOs have been successfully split
                    </p>
                  </div>
                  <a
                    href={`https://bitails.io/tx/${txDetails.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline flex items-center gap-1 text-xs sm:text-sm shrink-0"
                  >
                    View on Bitails
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {broadcastError && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
              <span className="break-all">{broadcastError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
