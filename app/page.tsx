"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { BitailsUtxo, SplitConfig as SplitConfigType } from "@/lib/bsv";
import { CheckCircle, Heart, Copy, ExternalLink, RotateCcw, Mail, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

const DONATION_BSV = "12smcX7jymSNSyq35JE8AhV1s3jV45rszz";
const DONATION_BTC = "bc1q2x9hzq8tl0stlrsfyxsyehuh59m08ghcl9rwxa";
const CONTACT_EMAIL = "msmrz@proton.me";

type Step = "keys" | "utxos" | "config" | "build";

const KeyManager = dynamic(
  () => import("@/components/saibun/key-manager").then((m) => m.KeyManager),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  }
);

const UTXOFetcher = dynamic(
  () => import("@/components/saibun/utxo-fetcher").then((m) => m.UTXOFetcher),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-32 w-full" />
      </div>
    ),
  }
);

const SplitConfig = dynamic(
  () => import("@/components/saibun/split-config").then((m) => m.SplitConfig),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  }
);

const TransactionBuilder = dynamic(
  () =>
    import("@/components/saibun/transaction-builder").then(
      (m) => m.TransactionBuilder
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  }
);

interface StepIndicatorProps {
  steps: { id: Step; label: string }[];
  currentStep: Step;
  completedSteps: Step[];
  onStepClick: (step: Step) => void;
}

function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isClickable = isCompleted || isCurrent;

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-2 transition-all ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : isCompleted
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`hidden sm:inline text-sm ${
                  isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-px ${
                  completedSteps.includes(steps[index + 1].id) ||
                  currentStep === steps[index + 1].id
                    ? "bg-accent"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DonationDialog() {
  const [activeTab, setActiveTab] = useState<"bsv" | "btc">("bsv");
  const { toast } = useToast();

  const copyAddress = async (address: string, type: "bsv" | "btc") => {
    await navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: `${type.toUpperCase()} donation address copied to clipboard.`,
    });
  };

  const currentAddress = activeTab === "bsv" ? DONATION_BSV : DONATION_BTC;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="hover:text-foreground transition-colors flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Heart className="h-3 w-3 text-[#2F6F5E]" />
          Support
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Support Saibun</DialogTitle>
          <DialogDescription className="text-center">
            Your donation is an anchor of support that helps the project continue to grow (•‿•)
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("bsv")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "bsv"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              BSV
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("btc")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "btc"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              BTC
            </button>
          </div>

          <div className="p-4 bg-card rounded-xl border border-border">
            <QRCodeSVG
              value={activeTab === "bsv" ? `bitcoin:${currentAddress}` : `bitcoin:${currentAddress}`}
              size={160}
              level="M"
              bgColor="transparent"
              fgColor="currentColor"
              className="text-foreground"
            />
          </div>
          <div className="w-full space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              {activeTab === "bsv" ? "BSV" : "BTC"} Address
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] bg-muted px-3 py-2.5 rounded-lg font-mono break-all text-center text-foreground">
                {currentAddress}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyAddress(currentAddress, activeTab)}
                className="shrink-0 bg-transparent hover:bg-secondary"
                aria-label={`Copy ${activeTab.toUpperCase()} donation address`}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const key = "saibun_welcome_v1";
      const seen = window.localStorage.getItem(key);
      if (!seen) setOpen(true);
    } catch {}
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem("saibun_welcome_v1", "1");
    } catch {}
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to Saibun</DialogTitle>
          <DialogDescription>
            A minimal tool for splitting BSV UTXOs. Signing happens locally in your
            browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Quick start</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Generate or import a key.</li>
              <li>Fetch UTXOs online or paste raw tx hex offline.</li>
              <li>Choose output count, satoshis per output, and fee rate.</li>
              <li>Build, review, then broadcast or download.</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/learn">Learn how it works</Link>
            </Button>
            <Button onClick={dismiss}>Got it</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SaibunPage() {
  const [currentStep, setCurrentStep] = useState<Step>("keys");
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);

  // State for each step
  const [privateKeyWif, setPrivateKeyWif] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [utxos, setUtxos] = useState<BitailsUtxo[]>([]);
  const [splitConfig, setSplitConfig] = useState<SplitConfigType | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const steps: { id: Step; label: string }[] = [
    { id: "keys" as Step, label: "Keys" },
    { id: "utxos" as Step, label: "UTXOs" },
    { id: "config" as Step, label: "Configure" },
    { id: "build" as Step, label: "Build" },
  ];

  const handleKeyReady = (wif: string, addr: string) => {
    setPrivateKeyWif(wif);
    setAddress(addr);
    if (!completedSteps.includes("keys")) {
      setCompletedSteps([...completedSteps, "keys"]);
    }
  };

  const handleUTXOsReady = (fetchedUtxos: BitailsUtxo[], mode: "online" | "offline") => {
    setUtxos(fetchedUtxos);
    setIsOfflineMode(mode === "offline");
    if (!completedSteps.includes("utxos")) {
      setCompletedSteps([...completedSteps, "utxos"]);
    }
  };

  const handleConfigReady = (config: SplitConfigType, updatedUtxos: BitailsUtxo[]) => {
    setSplitConfig(config);
    setUtxos(updatedUtxos);
    if (!completedSteps.includes("config")) {
      setCompletedSteps([...completedSteps, "config"]);
    }
    setCurrentStep("build");
  };

  const goToNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleRestart = () => {
    setCurrentStep("keys");
    setCompletedSteps([]);
    setPrivateKeyWif("");
    setAddress("");
    setUtxos([]);
    setSplitConfig(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo.png"
                alt="Saibun"
                width={200}
                height={80}
                className="dark:invert h-12 sm:h-16 w-auto"
                priority
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button asChild variant="outline" size="sm" className="gap-1.5 border-border bg-transparent text-foreground hover:bg-secondary hover:text-foreground">
                <Link href="/learn">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Learn</span>
                </Link>
              </Button>
              {completedSteps.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-1.5 border-border bg-transparent text-foreground hover:bg-secondary hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Start Over</span>
                </Button>
              )}
              <ThemeToggle />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">Offline-capable</span>
                <div className="w-2 h-2 rounded-full bg-[#2F6F5E]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={setCurrentStep}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          {currentStep === "keys" && (
            <div className="space-y-6">
              <KeyManager onKeyReady={handleKeyReady} />
              {completedSteps.includes("keys") && (
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={goToNextStep}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continue to Fetch UTXOs
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === "utxos" && (
            <div className="space-y-6">
              <UTXOFetcher address={address} onUTXOsReady={handleUTXOsReady} />
              {completedSteps.includes("utxos") && (
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={goToNextStep}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continue to Configure Split
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === "config" && (
            <SplitConfig
              utxos={utxos}
              sourceAddress={address}
              onConfigReady={(config, updatedUtxos) => handleConfigReady(config, updatedUtxos)}
            />
          )}

          {currentStep === "build" && privateKeyWif && splitConfig && (
            <TransactionBuilder
              privateKeyWif={privateKeyWif}
              sourceAddress={address}
              utxos={utxos}
              config={splitConfig}
              isOfflineMode={isOfflineMode}
            />
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-1">
              Client-Side Only
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All cryptographic operations happen in your browser. Your keys
              never leave your device.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-1">
              Offline Capable
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste UTXO data and raw transactions manually to build and sign
              without network access.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Saibun - Precision UTXO splitting</p>
            <div className="flex items-center gap-4">
              <Link
                href="/learn"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" />
                Learn
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Contact
              </a>
              <a
                href="https://docs.bitails.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                Bitails API
                <ExternalLink className="h-3 w-3" />
              </a>
              <DonationDialog />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
