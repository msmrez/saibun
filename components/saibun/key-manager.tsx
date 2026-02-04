"use client";

import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  generateKeyPair,
  importFromWif,
  isValidWif,
} from "@/lib/bsv";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Wallet,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";

interface KeyManagerProps {
  onKeyReady: (privateKeyWif: string, address: string) => void;
}

export function KeyManager({ onKeyReady }: KeyManagerProps) {
  const [mode, setMode] = useState<"generate" | "import">("generate");
  const [wif, setWif] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [importWif, setImportWif] = useState("");
  const [importError, setImportError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [hasImported, setHasImported] = useState(false);
  const [qrPreview, setQrPreview] = useState<null | "address" | "wif">(null);
  const { toast } = useToast();

  const generateNewKey = useCallback(() => {
    try {
      const keyPair = generateKeyPair();
      setWif(keyPair.privateKeyWif);
      setAddress(keyPair.address);
      setHasGenerated(true);
      setHasImported(false);
      onKeyReady(keyPair.privateKeyWif, keyPair.address);
    } catch (err) {
      console.error("[v0] Key generation error:", err);
    }
  }, [onKeyReady]);

  const handleImport = () => {
    setImportError("");
    try {
      if (!isValidWif(importWif.trim())) {
        setImportError("Invalid WIF format. Please check and try again.");
        return;
      }
      
      const result = importFromWif(importWif.trim());
      setWif(result.privateKeyWif);
      setAddress(result.address);
      setHasImported(true);
      setHasGenerated(false);
      onKeyReady(result.privateKeyWif, result.address);
    } catch (err) {
      setImportError("Invalid WIF format. Please check and try again.");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    });
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as "generate" | "import");
    if (newMode === "import") {
      setImportWif("");
      setImportError("");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Dialog
        open={qrPreview !== null}
        onOpenChange={(v) => {
          if (!v) setQrPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {qrPreview === "wif" ? "Private Key (WIF) QR" : "Deposit Address QR"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="p-4 bg-card rounded-xl border border-border">
              <QRCodeSVG
                value={qrPreview === "wif" ? wif : address}
                size={240}
                level="M"
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-medium tracking-tight text-foreground">
          Key Management
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Generate a new key pair or import an existing WIF to get started.
        </p>
      </div>

      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList className="grid w-full grid-cols-2 bg-secondary h-10 sm:h-11">
          <TabsTrigger value="generate" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Key className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Import WIF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4 sm:mt-6">
          {!hasGenerated ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm sm:text-base font-medium text-foreground">Generate a New Key Pair</p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  Create a fresh private key and address for splitting your UTXOs.
                </p>
              </div>
              <Button onClick={generateNewKey} className="gap-2 mt-2">
                <Sparkles className="h-4 w-4" />
                Generate Key Pair
              </Button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Address Card */}
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                        <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Deposit Address
                      </div>
                      <button
                        type="button"
                        onClick={() => setQrPreview("address")}
                        className="bg-card p-2 sm:p-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        aria-label="Enlarge deposit address QR"
                      >
                        <QRCodeSVG
                          value={address}
                          size={160}
                          level="M"
                          bgColor="transparent"
                          fgColor="currentColor"
                          className="text-foreground w-[140px] h-[140px]"
                        />
                      </button>
                      <div className="w-full">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] sm:text-xs bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono break-all">
                            {address}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-10 w-10"
                            onClick={() => copyToClipboard(address, "Address")}
                            aria-label="Copy address"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Private Key Card */}
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                        <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Private Key (WIF)
                      </div>
                      <div className="bg-card p-2 sm:p-3 rounded-lg border border-border relative">
                        {showPrivateKey ? (
                          <button
                            type="button"
                            onClick={() => setQrPreview("wif")}
                            className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded"
                            aria-label="Enlarge private key QR"
                          >
                            <QRCodeSVG
                              value={wif}
                              size={160}
                              level="M"
                              bgColor="transparent"
                              fgColor="currentColor"
                              className="text-foreground w-[140px] h-[140px]"
                            />
                          </button>
                        ) : (
                          <div className="w-[140px] h-[140px] flex items-center justify-center bg-muted/50 rounded">
                            <EyeOff className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] sm:text-xs bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono break-all">
                            {showPrivateKey
                              ? wif
                              : "••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-10 w-10"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            aria-label={showPrivateKey ? "Hide private key" : "Show private key"}
                          >
                            {showPrivateKey ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-10 w-10"
                            onClick={() => copyToClipboard(wif, "Private key (WIF)")}
                            aria-label="Copy private key (WIF)"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={generateNewKey}
                  className="gap-2 bg-transparent text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Generate New Key
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="mt-4 sm:mt-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="import-wif" className="text-xs sm:text-sm font-medium">
                WIF Private Key
              </Label>
              <Input
                id="import-wif"
                type="password"
                placeholder="Enter your WIF private key (starts with K, L, or 5)"
                value={importWif}
                onChange={(e) => {
                  setImportWif(e.target.value);
                  setImportError("");
                }}
                className="font-mono text-xs sm:text-sm"
              />
              {importError && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {importError}
                </div>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!importWif.trim()}
              className="w-full text-xs sm:text-sm"
            >
              Import Key
            </Button>

            {hasImported && address && wif && (
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="p-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="bg-card p-2 rounded-lg border border-border">
                      <QRCodeSVG
                        value={address}
                        size={80}
                        level="M"
                        bgColor="transparent"
                        fgColor="currentColor"
                        className="text-foreground"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          Imported Successfully
                        </p>
                      </div>
                      <code className="text-[10px] sm:text-xs text-muted-foreground font-mono break-all">
                        {address}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => copyToClipboard(address, "Address")}
                      aria-label="Copy address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">Security Notice</p>
            <p>
              Your private key is generated entirely in your browser and never
              leaves your device. Always backup your WIF before funding the
              address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
