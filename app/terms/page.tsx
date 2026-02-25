"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Saibun</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-transparent">
              <Link href="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Title */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
              Terms of Service
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: February 16, 2026
          </p>
        </div>

        {/* Warning Card */}
        <Card className="border-amber-500/20 bg-amber-500/5 mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  Important: Please read these terms carefully
                </p>
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Do not use this tool with more than a small amount of BSV. There is always a risk of losing funds.
                </p>
                <p className="text-muted-foreground">
                  By using Saibun tools, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                  Bitcoin transactions are <strong className="text-foreground">irreversible</strong> and cannot be undone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          {/* 1. Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">1.</span> Acceptance of Terms
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using Saibun (&quot;the Service&quot;), including but not limited to the UTXO Splitter, 
              Script Lab, and any related tools or features, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, you must not use the Service.
            </p>
          </section>

          <Separator />

          {/* 2. Description of Service */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">2.</span> Description of Service
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Saibun provides open-source tools for interacting with the Bitcoin SV (BSV) blockchain, including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
              <li>UTXO splitting and management</li>
              <li>Bitcoin Script creation, testing, and validation</li>
              <li>Transaction building and broadcasting</li>
              <li>Educational resources and guides</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              The Service operates entirely in your browser. Private keys and sensitive data are processed locally 
              and never transmitted to our servers except when explicitly broadcasting transactions to the BSV network.
            </p>
          </section>

          <Separator />

          {/* 3. User Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">3.</span> User Responsibilities
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are solely responsible for:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
              <li>
                <strong className="text-foreground">Use only small amounts</strong> — Do not use this tool with more than a small amount of BSV. There is always a risk of losing funds.
              </li>
              <li>
                <strong className="text-foreground">Security of your private keys</strong> — Never share your private keys
                with anyone or enter them on untrusted websites
              </li>
              <li>
                <strong className="text-foreground">Verifying all transaction details</strong> — Double-check addresses, 
                amounts, and script parameters before broadcasting
              </li>
              <li>
                <strong className="text-foreground">Testing with small amounts</strong> — Always test scripts and 
                transactions with minimal funds before using significant amounts
              </li>
              <li>
                <strong className="text-foreground">Understanding Bitcoin Script</strong> — Ensure you understand 
                the scripts you create and their implications
              </li>
              <li>
                <strong className="text-foreground">Compliance with laws</strong> — Use the Service in compliance 
                with all applicable local, state, national, and international laws
              </li>
              <li>
                <strong className="text-foreground">Backup and recovery</strong> — Maintain secure backups of your 
                private keys and transaction data
              </li>
            </ul>
          </section>

          <Separator />

          {/* 4. Risks and Disclaimers */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">4.</span> Risks and Disclaimers
            </h2>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Bitcoin transactions are <strong>irreversible</strong>. Once broadcast to the network, 
                  transactions cannot be undone, reversed, or cancelled.
                </p>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              You acknowledge and agree that:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
              <li>
                <strong className="text-foreground">Script validation limitations</strong> — Script validation in 
                the playground may not catch all real-world issues. Scripts that validate in the playground may still 
                fail on-chain due to network conditions, fee requirements, or other factors
              </li>
              <li>
                <strong className="text-foreground">Network fees</strong> — All transactions incur network fees that 
                are deducted from your balance. Insufficient funds will result in transaction failure
              </li>
              <li>
                <strong className="text-foreground">No guarantee of execution</strong> — We do not guarantee that 
                transactions will be included in blocks or executed by miners
              </li>
              <li>
                <strong className="text-foreground">Third-party services</strong> — The Service uses third-party APIs 
                (e.g., Bitails) for blockchain data. We are not responsible for their availability, accuracy, or actions
              </li>
              <li>
                <strong className="text-foreground">Loss of funds</strong> — You may lose funds due to errors, 
                mistakes, bugs, network issues, or malicious actors. We are not responsible for any such losses
              </li>
              <li>
                <strong className="text-foreground">Private key compromise</strong> — If your private keys are 
                compromised, lost, or stolen, you may permanently lose access to your funds
              </li>
            </ul>
          </section>

          <Separator />

          {/* 5. Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">5.</span> Limitation of Liability
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SAIBUN AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
              <li>Any direct, indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or other intangible losses</li>
              <li>Loss or theft of private keys, funds, or digital assets</li>
              <li>Errors, bugs, or malfunctions in the Service</li>
              <li>Transactions that fail, are rejected, or result in loss of funds</li>
              <li>Actions of third parties, including miners, network nodes, or API providers</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
              PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <Separator />

          {/* 6. No Financial Advice */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">6.</span> No Financial Advice
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Saibun does not provide financial, investment, legal, or tax advice. The Service is a technical tool 
              for interacting with the Bitcoin blockchain. You are solely responsible for your financial decisions 
              and should consult with qualified professionals before making significant financial transactions.
            </p>
          </section>

          <Separator />

          {/* 7. Open Source License */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">7.</span> Open Source License
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Saibun is open-source software. The source code is available on GitHub and is provided under the 
              applicable open-source license. You may review, modify, and distribute the code in accordance with 
              the license terms.
            </p>
          </section>

          <Separator />

          {/* 8. Privacy and Data */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">8.</span> Privacy and Data
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Saibun operates as a client-side application. We do not collect, store, or transmit your private keys, 
              transaction data, or personal information except:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
              <li>When you explicitly broadcast transactions to the BSV network (via third-party APIs)</li>
              <li>Standard web analytics and error reporting (which may include anonymized usage data)</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              All processing occurs in your browser. For maximum security, use the Service in offline mode on an 
              air-gapped device when handling significant funds.
            </p>
          </section>

          <Separator />

          {/* 9. Changes to Terms */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">9.</span> Changes to Terms
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Material changes will be indicated 
              by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of the Service 
              after such changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <Separator />

          {/* 10. Termination */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">10.</span> Termination
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your access to the Service at any time, with or without 
              cause or notice, for any reason, including but not limited to violation of these Terms.
            </p>
          </section>

          <Separator />

          {/* 11. Governing Law */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">11.</span> Governing Law
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to 
              conflict of law principles. Any disputes arising from these Terms or your use of the Service shall be 
              resolved in accordance with applicable jurisdiction.
            </p>
          </section>

          <Separator />

          {/* 12. Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">12.</span> Contact
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:contact@saibun.io" className="text-primary hover:underline">
                contact@saibun.io
              </a>
              {" "}or visit our{" "}
              <a 
                href="https://github.com/msmrez/saibun" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-16 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Saibun Terms of Service</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/scripts" className="hover:text-foreground transition-colors">
                Script Lab
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
