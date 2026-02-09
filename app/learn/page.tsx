import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Shield, WifiOff, Split, Info } from "lucide-react";

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Saibun</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Learn
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/">
                Open Splitter <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        <section className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            What Saibun does
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Saibun helps you split one or more BSV UTXOs into many smaller UTXOs.
            It builds and signs the transaction <span className="font-medium text-foreground">in your browser</span>,
            so your private key never leaves your device.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="h-4 w-4 text-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Client-side only</p>
                  <p className="text-xs text-muted-foreground">
                    Signing happens locally. Online is only for fetching UTXOs or broadcasting.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <WifiOff className="h-4 w-4 text-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Offline-capable</p>
                  <p className="text-xs text-muted-foreground">
                    Paste raw transaction hex + output index (vout), sign offline, broadcast later.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-medium text-foreground">About the name</h2>
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl sm:text-3xl font-medium text-foreground shrink-0">
                  細分
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-sm sm:text-base font-medium text-foreground">
                    Saibun (細分)
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Japanese for "splitting into smaller parts" or "subdivision". The name reflects the tool's core purpose: 
                    breaking down larger UTXOs into many smaller, more manageable outputs.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Just as 細分 means precision division, Saibun helps you precisely control how your UTXOs are split.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-medium text-foreground">Why split UTXOs?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Split className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Batch operations</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pre-split into many small UTXOs so future transactions can spend in parallel without reorganizing funds.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Split className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Protocol “dust”</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create many tiny UTXOs for token/protocol workflows that need lots of small spends.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Split className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Wallet hygiene</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Organize funds into predictable chunks (for testing, spending policies, or operational separation).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-medium text-foreground">How it works</h2>
          <Card className="border-border/50">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { title: "Keys", desc: "Generate or import a WIF for signing." },
                  { title: "UTXOs", desc: "Fetch online or paste raw tx hex offline." },
                  { title: "Configure", desc: "Choose output count, satoshis, fee rate, recipient." },
                  { title: "Build", desc: "Sign, download hex, and broadcast when ready." },
                ].map((item, idx) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-medium shrink-0">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-3">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Saibun uses standard P2PKH transactions and computes fees from an estimated byte size.
                  Any remaining balance returns to a change output (your source address).
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-foreground">Glossary</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="utxo">
                <AccordionTrigger>UTXO</AccordionTrigger>
                <AccordionContent>
                  An “Unspent Transaction Output” — a spendable coin chunk. When you “split”, you create many new UTXOs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vout">
                <AccordionTrigger>vout (output index)</AccordionTrigger>
                <AccordionContent>
                  The output number inside a transaction (0, 1, 2…). In offline mode, you paste the raw tx hex and choose which output you want to spend.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rawhex">
                <AccordionTrigger>Raw transaction hex</AccordionTrigger>
                <AccordionContent>
                  The full source transaction (a long hex string, often starting with 01000000 or 02000000). Saibun needs it to sign inputs reliably.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="xpub">
                <AccordionTrigger>xPub</AccordionTrigger>
                <AccordionContent>
                  An extended public key used to derive many recipient addresses without exposing a private key. Useful when you want each output to go to a unique address.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="feerate">
                <AccordionTrigger>Fee rate (sat/byte)</AccordionTrigger>
                <AccordionContent>
                  How much fee you pay per byte of transaction size. Higher fee rate generally means faster propagation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-medium text-foreground">FAQ</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="safe">
                <AccordionTrigger>Is this safe?</AccordionTrigger>
                <AccordionContent>
                  Saibun signs in your browser and does not send private keys to any server. For maximum security, use offline mode on an air‑gapped device.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="offline">
                <AccordionTrigger>What do I need for offline mode?</AccordionTrigger>
                <AccordionContent>
                  For each UTXO you want to spend: the raw transaction hex of the source transaction and the output index (vout). Saibun extracts txid + satoshis automatically.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="change">
                <AccordionTrigger>Where does leftover balance go?</AccordionTrigger>
                <AccordionContent>
                  To a change output back to your source address. If change would be tiny, it may be added to the miner fee.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="broadcast">
                <AccordionTrigger>Do I have to broadcast from Saibun?</AccordionTrigger>
                <AccordionContent>
                  No. You can always download the raw transaction hex and broadcast later via Bitails or other inderxers and BSV nodes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section>
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Ready to split UTXOs?
                </p>
                <p className="text-xs text-muted-foreground">
                  Start with a small test amount, review the transaction, then broadcast.
                </p>
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/">
                  Open Saibun <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

