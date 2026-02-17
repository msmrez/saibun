import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Code2, BookOpen, Layers, Lock, Unlock, AlertTriangle, Lightbulb, Zap, Clock, Shield, Hash, Calculator, GitBranch, Database, Puzzle, Wrench } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function ScriptBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="bg-muted/40 border border-border rounded-lg p-3 font-mono text-sm leading-relaxed break-all whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function Concept({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/10 rounded-lg p-3">
      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function CategoryIcon({ cat }: { cat: string }) {
  const cls = "h-4 w-4 text-primary";
  switch (cat) {
    case "Basic": return <Zap className={cls} />;
    case "Puzzle": return <Hash className={cls} />;
    case "Lock Funds": return <Hash className={cls} />;
    case "Arithmetic": return <Calculator className={cls} />;
    case "R-Puzzle": return <Lock className={cls} />;
    case "Control Flow": return <GitBranch className={cls} />;
    case "Stack": return <Layers className={cls} />;
    case "Time Lock": return <Clock className={cls} />;
    case "Escrow": return <Shield className={cls} />;
    case "Escrow & Swaps": return <Shield className={cls} />;
    case "Standard": return <Lock className={cls} />;
    case "Standard Payments": return <Lock className={cls} />;
    case "Data": return <Database className={cls} />;
    case "Data Embedding": return <Database className={cls} />;
    case "Data Manipulation": return <Layers className={cls} />;
    case "Combination": return <Zap className={cls} />;
    case "Advanced": return <Shield className={cls} />;
    case "Covenants": return <Shield className={cls} />;
    default: return <Code2 className={cls} />;
  }
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ScriptGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Saibun</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Script Guide
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-12">

        {/* ================================================================ */}
        {/*  HERO                                                            */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            Script Guide
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            A deep walkthrough of every template in the Script Lab. Each pattern is explained
            opcode-by-opcode with real-world context, so you understand not just <em>what</em> the
            script does, but <em>why</em> it exists and <em>when</em> you&apos;d use it on-chain.
          </p>
        </section>

        {/* ================================================================ */}
        {/*  HOW BITCOIN SCRIPT WORKS                                        */}
        {/* ================================================================ */}
        <section className="space-y-6">
          <h2 className="text-lg font-medium text-foreground">How Bitcoin Script Works</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">Locking Script</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Placed on a transaction output when you send funds. It defines the
                  <strong className="text-foreground"> conditions</strong> required to spend those funds.
                  Think of it as the lock on a safe &mdash; it encodes the puzzle that must be solved.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">Unlocking Script</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provided in the transaction input that spends the output. It supplies the
                  <strong className="text-foreground"> solution</strong> &mdash; the key that opens the lock.
                  The network executes both scripts together to verify the spend.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-muted/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Execution Model</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Bitcoin Script is a <strong className="text-foreground">stack-based</strong> language.
                  There is no memory, no variables, no loops &mdash; only a stack of byte arrays.
                  Execution happens in two phases:
                </p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>
                    <strong className="text-foreground">Unlocking script runs first</strong> &mdash; it pushes
                    data (secrets, signatures, values) onto the stack.
                  </li>
                  <li>
                    <strong className="text-foreground">Locking script runs second</strong> &mdash; it reads
                    those values and performs checks (hash comparisons, signature verification, arithmetic).
                  </li>
                </ol>
                <p>
                  If the final stack has exactly <strong className="text-foreground">one truthy element</strong>,
                  the spend is valid. This is called the <em>clean stack rule</em>.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-1">Stack-based</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every opcode either pushes data onto the stack, pops data off it, or does both.
                For example, OP_ADD pops two numbers, adds them, pushes the result.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-1">No state</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Scripts can&apos;t read the blockchain, call APIs, or store persistent data.
                The only input is what&apos;s on the stack and the transaction being validated.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-1">Restored opcodes</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BSV restored disabled opcodes (OP_MUL, OP_CAT, OP_SPLIT, etc.) and removed
                script size limits, enabling much more expressive scripts than BTC.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  BASIC                                                           */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Basic" />
            <h2 className="text-lg font-medium text-foreground">Basic</h2>
            <Badge variant="outline" className="text-xs">2 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The most minimal scripts &mdash; useful for understanding how script validation works
            at the most fundamental level, and for special-purpose outputs like provably unspendable burns.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* Anyone Can Spend */}
            <AccordionItem value="anyone-can-spend" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Anyone Can Spend
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  The locking script unconditionally pushes TRUE. Since the only validation
                  requirement is &quot;the top of the stack is truthy,&quot; any unlocking script
                  (even empty) will satisfy it.
                </Concept>
                <Concept title="Real-world use">
                  Almost never used to hold real funds &mdash; anyone monitoring the mempool could
                  sweep the coins instantly. However, it appears in test scenarios, in OP_RETURN
                  protocol outputs that need a spendable &quot;anchor&quot; output, and as the
                  conceptual starting point for understanding script validation.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_TRUE</span>
                  {"\n"}
                  {/* annotation */}
                  <span className="text-muted-foreground text-xs">
                    Pushes 0x01 (truthy) onto the stack. That&apos;s the entire script.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-muted-foreground text-xs">(empty &mdash; nothing needed)</span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Unlocking script runs &mdash; nothing happens (it&apos;s empty).{"\n"}
                  2. Locking script runs &mdash; <code className="text-xs">OP_TRUE</code> pushes 0x01.{"\n"}
                  3. Final stack: [0x01] &mdash; one truthy element. Valid.
                </Concept>
                <Tip>
                  In the Script Lab, this is the fastest way to verify the playground is working.
                  Load it, click Run &mdash; instant pass.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Always Fail */}
            <AccordionItem value="always-fail" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Always Fail
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  The locking script pushes FALSE. Since the top of the stack must be truthy
                  for validation to pass, this script always fails &mdash; by design.
                </Concept>
                <Concept title="Real-world use">
                  <strong>Provably unspendable outputs.</strong> If you send coins to an output
                  with this script, everyone can verify that no one can ever spend them. This is
                  used for permanent token burns, data anchoring (combined with OP_RETURN), and
                  protocol markers that must never be spent.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_FALSE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Pushes an empty byte array (falsy). No unlocking script can make this truthy.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Unlocking script runs &mdash; nothing useful can change the outcome.{"\n"}
                  2. Locking script runs &mdash; <code className="text-xs">OP_FALSE</code> pushes 0x (empty).{"\n"}
                  3. Final stack: [0x] &mdash; falsy. Validation fails. Always.
                </Concept>
                <Warning>
                  Funds sent to this output are permanently destroyed. There is no private
                  key, no secret, no trick that can recover them. That&apos;s the point.
                </Warning>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  LOCK FUNDS                                                      */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Lock Funds" />
            <h2 className="text-lg font-medium text-foreground">Lock Funds</h2>
            <Badge variant="outline" className="text-xs">9 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lock funds to a mathematical or cryptographic condition. Anyone who
            can solve the puzzle can spend the coins &mdash; no private key required. Hash puzzles
            are the foundation of atomic swaps, HTLCs, and most DeFi primitives.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* Addition Puzzle */}
            <AccordionItem value="math-add" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Addition Puzzle
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Two numbers must be pushed onto the stack, and their sum must equal 5.
                </Concept>
                <Concept title="Real-world use">
                  Purely educational &mdash; arithmetic puzzles demonstrate how stack operations work.
                  In practice, arithmetic opcodes are used inside larger scripts for fee calculations,
                  threshold checks, and counting operations.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_ADD</span> <span className="text-primary">OP_5</span> <span className="text-primary">OP_EQUAL</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Pop two values, add them, compare result to 5.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_2</span> <span className="text-primary">OP_3</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push 2 then 3. Any pair summing to 5 works (0+5, 1+4, etc.).
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. <code className="text-xs">OP_2</code> pushes 2. Stack: [2]{"\n"}
                  2. <code className="text-xs">OP_3</code> pushes 3. Stack: [2, 3]{"\n"}
                  3. <code className="text-xs">OP_ADD</code> pops 3 and 2, pushes 5. Stack: [5]{"\n"}
                  4. <code className="text-xs">OP_5</code> pushes 5. Stack: [5, 5]{"\n"}
                  5. <code className="text-xs">OP_EQUAL</code> pops both, pushes TRUE (they match). Stack: [1]{"\n"}
                  6. One truthy element &mdash; valid.
                </Concept>
              </AccordionContent>
            </AccordionItem>

            {/* Multiplication Puzzle */}
            <AccordionItem value="math-multiply" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Multiplication Puzzle
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Two values must multiply to 12. Demonstrates OP_MUL, which is enabled in BSV
                  but disabled in BTC since 2010.
                </Concept>
                <Concept title="Real-world use">
                  OP_MUL is one of the &quot;restored opcodes&quot; that makes BSV Script more expressive
                  than BTC Script. In production it&apos;s used for rate calculations, scaling, and
                  complex arithmetic in smart contracts &mdash; things impossible on chains that
                  disabled it.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_MUL</span> <span className="text-primary">OP_12</span> <span className="text-primary">OP_EQUAL</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_3</span> <span className="text-primary">OP_4</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Any factor pair of 12 works: 1x12, 2x6, 3x4.
                  </span>
                </ScriptBlock>
                <Tip>
                  Try different factor pairs in the Script Lab to verify they all pass.
                  OP_2 OP_6, OP_1 OP_12, even OP_1NEGATE OP_12 OP_MUL OP_1NEGATE OP_MUL (double negate trick).
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Hash Puzzle SHA256 */}
            <AccordionItem value="hash-sha256" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Hash Puzzle (SHA256)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  The locking script contains a SHA256 hash. To spend, you provide the
                  preimage &mdash; the original data that produces that hash. The script hashes
                  your input and compares.
                </Concept>
                <Concept title="Real-world use">
                  <strong>Hash puzzles are the core of atomic swaps and HTLCs.</strong> Alice locks
                  funds to a hash. She tells Bob the hash (but not the preimage). Bob locks funds
                  on another chain to the same hash. Alice reveals the preimage to claim Bob&apos;s funds,
                  and Bob can then use that revealed preimage to claim Alice&apos;s funds. This is how
                  cross-chain trading works without a trusted third party.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_SHA256</span>{" "}
                  <span className="text-xs">2cf24dba...938b9824</span>{" "}
                  <span className="text-primary">OP_EQUAL</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Hash the top stack item with SHA256, compare to the embedded hash digest.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">68656c6c6f</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Hex for &quot;hello&quot;. This is the preimage whose SHA256 matches the hash in the lock.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push preimage hex <code className="text-xs">68656c6c6f</code> (&quot;hello&quot;). Stack: [68656c6c6f]{"\n"}
                  2. <code className="text-xs">OP_SHA256</code> pops, hashes, pushes digest. Stack: [2cf24d...9824]{"\n"}
                  3. Push the embedded hash <code className="text-xs">2cf24d...9824</code>. Stack: [digest, digest]{"\n"}
                  4. <code className="text-xs">OP_EQUAL</code> compares. They match. Stack: [1]. Valid.
                </Concept>
                <Warning>
                  On mainnet, the preimage is revealed when you broadcast the spending TX. Anyone
                  monitoring the mempool sees it. That&apos;s fine for atomic swaps (it&apos;s the design)
                  but means hash puzzles alone are NOT secure for holding funds long-term. Combine
                  with signatures for real security.
                </Warning>
              </AccordionContent>
            </AccordionItem>

            {/* Hash Puzzle HASH160 */}
            <AccordionItem value="hash-hash160" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Hash Puzzle (HASH160)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Same concept as SHA256 hash puzzle but uses HASH160 = RIPEMD160(SHA256(x)).
                  This is the same hash function used in Bitcoin addresses (P2PKH).
                </Concept>
                <Concept title="Real-world use">
                  HASH160 produces a 20-byte digest (vs SHA256&apos;s 32 bytes), saving 12 bytes per
                  output. In high-volume protocols where many hash-locked outputs are created,
                  this space saving adds up. It&apos;s also the hash used in P2PKH, so developers
                  working with address-related scripts will encounter it constantly.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_HASH160</span>{" "}
                  <span className="text-xs">b6a9c8c2...dc7d0f</span>{" "}
                  <span className="text-primary">OP_EQUAL</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">68656c6c6f</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Hex for &quot;hello&quot;. HASH160(&quot;hello&quot;) = b6a9c8...dc7d0f.
                  </span>
                </ScriptBlock>
                <Tip>
                  HASH160 is a double hash (SHA256 first, then RIPEMD160). This provides resistance
                  against both SHA256 weaknesses and RIPEMD160 weaknesses &mdash; an attacker would
                  need to break both.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Hash Puzzle RIPEMD160 */}
            <AccordionItem value="hash-ripemd160" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Hash Puzzle (RIPEMD160)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Direct RIPEMD160 hash puzzle (without the SHA256 pre-hash that HASH160 uses).
                  Produces a 20-byte digest.
                </Concept>
                <Concept title="Real-world use">
                  Rarely used alone in production. It&apos;s a building block &mdash; understanding
                  RIPEMD160 helps you understand why HASH160 exists (it adds SHA256 as a first pass
                  for extra collision resistance). Useful in academic exercises and niche protocols
                  that specifically need the RIPEMD160 digest.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_RIPEMD160</span>{" "}
                  <span className="text-xs">108f07b8...445acd</span>{" "}
                  <span className="text-primary">OP_EQUAL</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">68656c6c6f</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Hex for &quot;hello&quot;. RIPEMD160(&quot;hello&quot;) = 108f07...445acd.
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>

            {/* Dual Secret */}
            <AccordionItem value="hash-dual-secret" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Dual Secret (AND)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Requires TWO different preimages to unlock. Both SHA256 hashes must match.
                  Uses OP_EQUALVERIFY for the first check (fails immediately if wrong) and
                  OP_EQUAL for the second (leaves the result on the stack).
                </Concept>
                <Concept title="Real-world use">
                  <strong>Dual-party escrow without a trusted third party.</strong> Alice knows
                  secret A, Bob knows secret B. Funds are locked requiring both secrets. Neither
                  can spend alone. They must cooperate (or one reveals first in an atomic protocol).
                  This pattern extends to N-of-N secret schemes for multi-party coordination.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_SHA256</span> <span className="text-xs">2bd806c9...6d6e90</span> <span className="text-primary">OP_EQUALVERIFY</span>
                  {"\n"}
                  <span className="text-primary">OP_SHA256</span> <span className="text-xs">81b637d8...c58ce9</span> <span className="text-primary">OP_EQUAL</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    First check: SHA256(&quot;alice&quot;) via EQUALVERIFY (fails fast if wrong).{"\n"}
                    Second check: SHA256(&quot;bob&quot;) via EQUAL (leaves TRUE/FALSE on stack).
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">626f62 616c696365</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push &quot;bob&quot; then &quot;alice&quot; (hex). Stack is LIFO, so &quot;alice&quot; is on top
                    and gets checked first by the locking script.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push <code className="text-xs">626f62</code> (&quot;bob&quot;) and <code className="text-xs">616c696365</code> (&quot;alice&quot;). Stack: [bob, alice]{"\n"}
                  2. <code className="text-xs">OP_SHA256</code> hashes &quot;alice&quot; (top). Stack: [bob, hash_alice]{"\n"}
                  3. Push expected alice hash. Stack: [bob, hash_alice, expected_alice]{"\n"}
                  4. <code className="text-xs">OP_EQUALVERIFY</code> &mdash; match! Both consumed. Stack: [bob]{"\n"}
                  5. <code className="text-xs">OP_SHA256</code> hashes &quot;bob&quot;. Stack: [hash_bob]{"\n"}
                  6. Push expected bob hash. Stack: [hash_bob, expected_bob]{"\n"}
                  7. <code className="text-xs">OP_EQUAL</code> &mdash; match! Stack: [1]. Valid.
                </Concept>
                <Tip>
                  The difference between OP_EQUAL and OP_EQUALVERIFY: EQUAL leaves TRUE/FALSE
                  on the stack. EQUALVERIFY checks equality AND immediately fails the script if
                  they don&apos;t match (it&apos;s OP_EQUAL + OP_VERIFY combined). Use EQUALVERIFY for
                  intermediate checks, EQUAL for the final check.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Range Check */}
            <AccordionItem value="range-check" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Range Check
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  The input value must be in the range [3, 10) &mdash; at least 3 and less than 10.
                  Demonstrates OP_WITHIN for numeric range validation.
                </Concept>
                <Concept title="Real-world use">
                  Range validation is essential in any smart contract with numeric parameters &mdash;
                  ensuring bid amounts, vote counts, or configuration values stay within acceptable
                  bounds. OP_WITHIN does it in a single opcode instead of two separate comparisons.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_DUP</span> <span className="text-primary">OP_3</span> <span className="text-primary">OP_10</span> <span className="text-primary">OP_WITHIN</span> <span className="text-primary">OP_VERIFY</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    DUP preserves the value. WITHIN checks [3, 10). VERIFY consumes TRUE.
                    The DUP-ed value remains as the truthy stack result.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_5</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push any value in [3, 10). Try OP_3 (minimum), OP_9 (maximum), or OP_10 (fails &mdash; upper bound is exclusive).
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push 5. Stack: [5]{"\n"}
                  2. <code className="text-xs">OP_DUP</code> duplicates. Stack: [5, 5]{"\n"}
                  3. <code className="text-xs">OP_3</code>, <code className="text-xs">OP_10</code> push bounds. Stack: [5, 5, 3, 10]{"\n"}
                  4. <code className="text-xs">OP_WITHIN</code> checks 5 in [3,10). TRUE. Stack: [5, 1]{"\n"}
                  5. <code className="text-xs">OP_VERIFY</code> consumes TRUE (passes). Stack: [5]{"\n"}
                  6. Stack: [5] &mdash; truthy. Valid.
                </Concept>
                <Tip>
                  OP_WITHIN uses half-open interval [min, max). The max value itself is excluded.
                  To include 10, you&apos;d use OP_11 as the upper bound.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Absolute Value */}
            <AccordionItem value="abs-value" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Absolute Value
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  The absolute value of the input must equal 7. Both 7 and -7 satisfy the puzzle.
                </Concept>
                <Concept title="Real-world use">
                  OP_ABS and OP_NEGATE are useful in scripts that need to handle signed values
                  (e.g., price differences that could be positive or negative) while enforcing
                  magnitude constraints.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_ABS</span> <span className="text-primary">OP_7</span> <span className="text-primary">OP_EQUAL</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_7</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push 7 (or -7 via <code className="text-xs">OP_1NEGATE OP_7 OP_MUL</code>). OP_ABS converts both to 7.
                  </span>
                </ScriptBlock>
                <Tip>
                  Bitcoin Script numbers are sign-magnitude encoded. The highest bit of the last
                  byte is the sign bit. OP_ABS clears this bit, converting negative to positive.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* R-Puzzle (Raw) */}
            <AccordionItem value="rpuzzle-raw" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                R-Puzzle (Raw)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  The locking script extracts the R value from a provided ECDSA signature and
                  compares it to a committed R value. The signature must also pass OP_CHECKSIG,
                  binding it to the spending transaction. The public key can be anything.
                </Concept>
                <Concept title="Real-world use">
                  <strong>Transferable spending rights.</strong> Unlike P2PKH (locked to a specific
                  public key), an R-Puzzle is locked to knowledge of K. You can give K to anyone and
                  they can spend using their own key. Use cases:{"\n"}{"\n"}
                  &bull; Coupons/vouchers: generate K, give it to a customer, they redeem with their own wallet.{"\n"}
                  &bull; Anonymous authorization: prove you know a secret without revealing your identity.{"\n"}
                  &bull; Key rotation: the &quot;right to spend&quot; transfers without changing the output.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_OVER</span> <span className="text-primary">OP_3</span> <span className="text-primary">OP_SPLIT</span> <span className="text-primary">OP_NIP</span> <span className="text-primary">OP_1</span> <span className="text-primary">OP_SPLIT</span> <span className="text-primary">OP_SWAP</span> <span className="text-primary">OP_SPLIT</span> <span className="text-primary">OP_DROP</span>
                  {"\n"}
                  <span className="text-xs">f01d6b90...23a80f</span>
                  {"\n"}
                  <span className="text-primary">OP_EQUALVERIFY</span> <span className="text-primary">OP_CHECKSIG</span>
                  {"\n\n"}
                  <span className="text-muted-foreground text-xs">
                    The first 9 opcodes extract the R value from a DER-encoded signature:{"\n"}
                    1. OP_OVER copies the signature (2nd item) to top{"\n"}
                    2. OP_3 OP_SPLIT skips the DER prefix (30 len 02){"\n"}
                    3. OP_NIP removes the prefix{"\n"}
                    4. OP_1 OP_SPLIT reads the R length byte{"\n"}
                    5. OP_SWAP OP_SPLIT extracts exactly R-length bytes{"\n"}
                    6. OP_DROP discards the remainder{"\n"}
                    Then compares R to the committed value and verifies the full signature.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">&lt;signature&gt; &lt;public key&gt;</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    The signature must be generated using the specific K nonce. The public key
                    can be any valid key &mdash; the lock doesn&apos;t check which key, only that
                    the signature&apos;s R matches.
                  </span>
                </ScriptBlock>
                <Concept title="How ECDSA nonces relate to R values">
                  In ECDSA, the signature is (R, S) where R = x-coordinate of (K * G) and G is the
                  generator point. If you know K, you can produce a signature with the correct R
                  using any private key. The locking script commits to R (derived from K). Only
                  someone who knows K can produce a matching signature. OP_CHECKSIG then verifies
                  the signature is valid for the spending transaction, preventing replay attacks.
                </Concept>
                <Warning>
                  R-Puzzles require real transaction context (OP_CHECKSIG). They cannot be fully
                  validated in the playground simulator. Use the Transaction Builder to create and
                  spend real R-Puzzle transactions on testnet or mainnet.
                </Warning>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  CONTROL FLOW                                                    */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Control Flow" />
            <h2 className="text-lg font-medium text-foreground">Control Flow</h2>
            <Badge variant="outline" className="text-xs">3 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            OP_IF/OP_ELSE/OP_ENDIF enable conditional execution. This is how scripts offer
            multiple spending paths &mdash; the foundation of HTLCs, dispute resolution, and
            any &quot;either Alice OR Bob can spend&quot; pattern.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* If/Else */}
            <AccordionItem value="if-else" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                If / Else Branch
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  If the unlocking script pushes TRUE, the IF branch executes (result: 2).
                  If it pushes FALSE, the ELSE branch executes (result: 3).
                </Concept>
                <Concept title="Real-world use">
                  Every multi-path script uses OP_IF. The HTLC pattern is literally: IF (hash
                  preimage path) ELSE (timeout refund path) ENDIF. Conditional branching is
                  how you build scripts with multiple spending conditions.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_IF</span> <span className="text-primary">OP_2</span> <span className="text-primary">OP_ELSE</span> <span className="text-primary">OP_3</span> <span className="text-primary">OP_ENDIF</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    OP_IF consumes the top stack value. Truthy → execute IF block. Falsy → execute ELSE block.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution (TRUE path)">
                  1. Push TRUE. Stack: [1]{"\n"}
                  2. <code className="text-xs">OP_IF</code> pops TRUE &mdash; enters IF block. Stack: []{"\n"}
                  3. <code className="text-xs">OP_2</code> pushes 2. Stack: [2]{"\n"}
                  4. OP_ELSE/OP_ENDIF are structural &mdash; skipped.{"\n"}
                  5. Stack: [2] &mdash; truthy. Valid.
                </Concept>
                <Tip>
                  In the Script Lab, try changing the unlock to OP_FALSE and use the step-by-step
                  simulator to watch the execution take the ELSE branch instead.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Nested If */}
            <AccordionItem value="nested-if" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Nested If/Else
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Two-level conditional with four possible outcomes. Two boolean inputs select
                  which branch executes: TRUE+TRUE&rarr;2, FALSE+TRUE&rarr;3, TRUE+FALSE&rarr;4, FALSE+FALSE&rarr;5.
                </Concept>
                <Concept title="Real-world use">
                  Multi-path contracts. A dispute resolution script might have: (1) both parties
                  agree, (2) Alice proves fault, (3) Bob proves fault, (4) timeout &mdash; four
                  paths selected by two condition flags. Nesting IF/ELSE is how you build
                  arbitrarily complex decision trees.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_IF</span>{"\n"}
                  {"  "}<span className="text-primary">OP_IF</span> <span className="text-primary">OP_2</span> <span className="text-primary">OP_ELSE</span> <span className="text-primary">OP_3</span> <span className="text-primary">OP_ENDIF</span>{"\n"}
                  <span className="text-primary">OP_ELSE</span>{"\n"}
                  {"  "}<span className="text-primary">OP_IF</span> <span className="text-primary">OP_4</span> <span className="text-primary">OP_ELSE</span> <span className="text-primary">OP_5</span> <span className="text-primary">OP_ENDIF</span>{"\n"}
                  <span className="text-primary">OP_ENDIF</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_TRUE</span> <span className="text-primary">OP_TRUE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    TRUE TRUE → 2. Try FALSE TRUE → 3, TRUE FALSE → 4, FALSE FALSE → 5.
                  </span>
                </ScriptBlock>
                <Tip>
                  Remember: the stack is LIFO. <code className="text-xs">OP_TRUE OP_TRUE</code> means the
                  second TRUE (pushed last) is consumed by the outer IF, and the first TRUE
                  is consumed by the inner IF. The order matters.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* NOTIF */}
            <AccordionItem value="notif-pattern" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                OP_NOTIF Pattern
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  OP_NOTIF is the inverse of OP_IF &mdash; it executes its block when the top
                  value is falsy. Push FALSE to get 7, push TRUE to get 8.
                </Concept>
                <Concept title="Real-world use">
                  Sometimes the &quot;default&quot; path is the falsy one (e.g., &quot;if NO timeout has
                  occurred, execute normally&quot;). Using OP_NOTIF makes the intent clearer and
                  avoids an extra OP_NOT before OP_IF.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_NOTIF</span> <span className="text-primary">OP_7</span> <span className="text-primary">OP_ELSE</span> <span className="text-primary">OP_8</span> <span className="text-primary">OP_ENDIF</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Falsy input → OP_NOTIF block (7). Truthy input → OP_ELSE block (8).
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_FALSE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push FALSE → enters NOTIF block (result 7). Change to OP_TRUE for ELSE block (result 8).
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  STACK                                                           */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Stack" />
            <h2 className="text-lg font-medium text-foreground">Stack</h2>
            <Badge variant="outline" className="text-xs">3 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The alt stack is a secondary stack used as scratch space. Moving values to the alt stack
            and back lets you perform operations that would be awkward with just the main stack.
            These patterns are essential for complex BSV smart contracts.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* Alt Stack Arithmetic */}
            <AccordionItem value="alt-stack" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Alt Stack Arithmetic
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Takes two input values, moves one to the alt stack, doubles the other, retrieves
                  the stashed value, and adds them. Result: val1 &times; 2 + val2.
                </Concept>
                <Concept title="Real-world use">
                  The alt stack is Bitcoin Script&apos;s only &quot;variable storage.&quot; Any time you need to
                  save a value, do work with other values, then bring it back, you use
                  OP_TOALTSTACK / OP_FROMALTSTACK. It&apos;s the equivalent of a temporary variable
                  in conventional programming.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_TOALTSTACK</span> <span className="text-primary">OP_2</span> <span className="text-primary">OP_MUL</span> <span className="text-primary">OP_FROMALTSTACK</span> <span className="text-primary">OP_ADD</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_3</span> <span className="text-primary">OP_4</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push 3 then 4. Result: 3 &times; 2 + 4 = 10. Try different values to see the formula in action.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution (with inputs 3, 4)">
                  1. Push 3, then 4. Stack: [3, 4]. Alt: []{"\n"}
                  2. <code className="text-xs">OP_TOALTSTACK</code> moves 4 to alt. Stack: [3]. Alt: [4]{"\n"}
                  3. <code className="text-xs">OP_2</code> pushes 2. Stack: [3, 2]{"\n"}
                  4. <code className="text-xs">OP_MUL</code> multiplies. Stack: [6]. Alt: [4]{"\n"}
                  5. <code className="text-xs">OP_FROMALTSTACK</code> retrieves 4. Stack: [6, 4]. Alt: []{"\n"}
                  6. <code className="text-xs">OP_ADD</code> adds. Stack: [10]. Valid.
                </Concept>
                <Tip>
                  Use the Script Lab&apos;s step-by-step simulator for this template &mdash; it shows
                  the alt stack panel, so you can watch values move between the two stacks in real time.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Alt Stack Accumulator */}
            <AccordionItem value="alt-accumulator" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Alt Stack Accumulator
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Sums three input values using the alt stack as a running total. This demonstrates
                  the &quot;unrolled loop&quot; pattern &mdash; Bitcoin Script has no loops, so you repeat
                  operations explicitly for each iteration.
                </Concept>
                <Concept title="Real-world use">
                  BSV scripts that process multiple data items (verifying a Merkle proof, summing
                  token amounts, checking a list of conditions) use this unrolled-loop pattern.
                  Since BSV removed script size limits, these can scale to thousands of iterations.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_ADD</span> <span className="text-primary">OP_TOALTSTACK</span> <span className="text-primary">OP_FROMALTSTACK</span> <span className="text-primary">OP_ADD</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Add top two (3+4=7) → stash on alt → retrieve → add to remaining value (7+2=9).
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_2</span> <span className="text-primary">OP_3</span> <span className="text-primary">OP_4</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push 2, 3, 4. Result: 2 + 3 + 4 = 9.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution (with inputs 2, 3, 4)">
                  1. Push 2, 3, 4. Stack: [2, 3, 4]{"\n"}
                  2. <code className="text-xs">OP_ADD</code> pops 4 and 3, pushes 7. Stack: [2, 7]{"\n"}
                  3. <code className="text-xs">OP_TOALTSTACK</code> moves 7 to alt. Stack: [2]. Alt: [7]{"\n"}
                  4. <code className="text-xs">OP_FROMALTSTACK</code> retrieves 7. Stack: [2, 7]{"\n"}
                  5. <code className="text-xs">OP_ADD</code> adds. Stack: [9]. Valid.
                </Concept>
              </AccordionContent>
            </AccordionItem>

            {/* Stack Depth */}
            <AccordionItem value="stack-depth-check" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Stack Depth Check
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Verifies that exactly 3 items are on the stack, then sums them all.
                  OP_DEPTH pushes the current stack size as a number.
                </Concept>
                <Concept title="Real-world use">
                  Input validation. If a script expects exactly N parameters from the unlocking
                  script, OP_DEPTH at the start of the locking script can enforce this. Prevents
                  someone from providing extra or fewer arguments than expected, which could cause
                  unexpected behavior in complex scripts.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_DEPTH</span> <span className="text-primary">OP_3</span> <span className="text-primary">OP_EQUALVERIFY</span> <span className="text-primary">OP_ADD</span> <span className="text-primary">OP_ADD</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Check depth is 3 (EQUALVERIFY fails fast if not), then sum all three values.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_1</span> <span className="text-primary">OP_2</span> <span className="text-primary">OP_3</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push exactly 3 items: 1 + 2 + 3 = 6. Fewer or more items will fail the depth check.
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  TIME LOCK                                                       */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Time Lock" />
            <h2 className="text-lg font-medium text-foreground">Time Lock</h2>
            <Badge variant="outline" className="text-xs">2 templates</Badge>
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">Educational</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Timelocks on BSV work at the <strong className="text-foreground">transaction level</strong>,
            not via script opcodes. The nLockTime and nSequence fields of a transaction control
            when miners will accept it. This is the original Satoshi design.
          </p>
          <Warning>
            OP_CHECKLOCKTIMEVERIFY (CLTV) and OP_CHECKSEQUENCEVERIFY (CSV) are <strong>disabled on BSV</strong>.
            They were reverted to OP_NOP2 and OP_NOP3 at the Genesis upgrade (Feb 2020). These opcodes
            only work on BTC and BCH. On BSV, timelocks are enforced by miners via the transaction&apos;s
            nLockTime field &mdash; no script opcode needed.
          </Warning>

          <Accordion type="multiple" className="space-y-2">
            {/* nLockTime */}
            <AccordionItem value="nlocktime-intro" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                nLockTime (Absolute)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  nLockTime is a 32-bit field in every Bitcoin transaction. When set to a non-zero
                  value, miners will not include the transaction in a block until the specified
                  condition is met. This is enforced at the consensus level &mdash; it&apos;s not a script
                  opcode, it&apos;s a property of the transaction itself.
                </Concept>
                <Concept title="How it works">
                  &bull; <strong className="text-foreground">nLockTime &lt; 500,000,000</strong>: interpreted as a block height. TX cannot be mined until that block.{"\n"}
                  &bull; <strong className="text-foreground">nLockTime &ge; 500,000,000</strong>: interpreted as a Unix timestamp. TX cannot be mined until that time.{"\n"}
                  &bull; <strong className="text-foreground">nLockTime = 0</strong>: no restriction, TX can be mined immediately.{"\n"}{"\n"}
                  <strong className="text-foreground">Critical requirement:</strong> nLockTime is only enforced if at least one input has
                  nSequence &lt; 0xFFFFFFFF. If all inputs have nSequence = max, the TX is &quot;final&quot;
                  and nLockTime is ignored entirely.
                </Concept>
                <Concept title="Real-world use">
                  <strong>Vesting:</strong> create a TX that sends tokens but set nLockTime to a future block &mdash; it can&apos;t be mined early.{"\n"}
                  <strong>HTLC refunds:</strong> the refund TX uses nLockTime so it can only be broadcast after the timeout.{"\n"}
                  <strong>Scheduled payments:</strong> sign a TX now, but it only becomes valid at a future time.
                </Concept>
                <Tip>
                  Unlike CLTV on BTC (which checks nLockTime inside the script), BSV&apos;s approach is
                  simpler and more powerful: the transaction field itself is the lock. Advanced contracts
                  that need to read nLockTime inside a script can use the OP_PUSH_TX technique (sighash
                  preimage inspection) to access the transaction&apos;s fields at runtime.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* nLockTime + nSequence */}
            <AccordionItem value="nlocktime-sequence" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                nLockTime + nSequence
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  nSequence is a 32-bit per-input field. On BSV, it retains its original Satoshi-era
                  meaning: <strong className="text-foreground">transaction finality</strong>. The combination of nSequence
                  and nLockTime creates BSV&apos;s native timelock mechanism.
                </Concept>
                <Concept title="How it works">
                  &bull; <strong className="text-foreground">nSequence = 0xFFFFFFFF</strong> (max): the input is &quot;final.&quot;{"\n"}
                  &bull; If ALL inputs are final, the TX is final and <strong className="text-foreground">nLockTime is ignored</strong>.{"\n"}
                  &bull; If ANY input has nSequence &lt; max, nLockTime is enforced.{"\n"}
                  &bull; A TX with lower nSequence can be &quot;replaced&quot; by a TX spending the same input with a higher nSequence (original Satoshi replacement mechanism).
                </Concept>
                <Concept title="BSV vs BTC/BCH">
                  On BTC and BCH, BIP-68 repurposed the nSequence field for relative timelocks
                  (encoding a delay in blocks or time units). <strong className="text-foreground">This does NOT apply to BSV.</strong>{" "}
                  BSV&apos;s Genesis upgrade explicitly restored nSequence to its original meaning. On BSV:{"\n"}{"\n"}
                  &bull; No BIP-68 relative timelocks{"\n"}
                  &bull; No BIP-112 (OP_CHECKSEQUENCEVERIFY){"\n"}
                  &bull; nSequence controls finality and nLockTime activation only
                </Concept>
                <Concept title="Real-world use">
                  <strong>Payment channels (original design):</strong> Satoshi designed nSequence for
                  off-chain payment channels. Two parties create TXes spending the same output, each
                  with incrementing nSequence and a future nLockTime. Only the latest version (highest
                  nSequence) gets mined after the locktime expires. This was the original Layer-2 vision
                  &mdash; no new opcodes needed.
                </Concept>
                <Warning>
                  These are transaction-level fields, not script opcodes. The Script Lab&apos;s validator
                  does not check nLockTime or nSequence &mdash; these are templates explaining BSV&apos;s
                  timelock mechanism. Use them with the Transaction Builder for real transactions.
                </Warning>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  ESCROW                                                          */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Escrow & Swaps" />
            <h2 className="text-lg font-medium text-foreground">Escrow & Swaps</h2>
            <Badge variant="outline" className="text-xs">5 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Escrow and swap patterns combine hash puzzles, multisig, and transaction-level timelocks to
            create trustless agreements. HTLCs (Hash Time-Locked Contracts) are the foundation
            of atomic swaps. On BSV, the &quot;time-locked&quot; part uses nLockTime at the transaction
            level, while the script handles the hash puzzle and branching logic.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* HTLC Claim */}
            <AccordionItem value="htlc-redeem" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                HTLC (Claim Path)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  A Hash Time-Locked Contract with two spending paths. The claim path (IF branch):
                  reveal the SHA256 preimage to take the funds. The refund path (ELSE branch):
                  provide a different preimage. On BSV, the refund timing is enforced via nLockTime
                  on the spending transaction &mdash; not via a script opcode.
                </Concept>
                <Concept title="Real-world use">
                  <strong>This is the atomic swap primitive.</strong> The full BSV-native flow:{"\n"}{"\n"}
                  1. Alice generates a random secret S and computes H = SHA256(S).{"\n"}
                  2. Alice locks BSV to this HTLC script (claim hash = H, refund hash = H2).{"\n"}
                  3. Alice tells Bob H (but NOT S). Bob locks funds on another chain to the same H.{"\n"}
                  4. Alice reveals S to claim Bob&apos;s funds.{"\n"}
                  5. Bob sees S on-chain and uses it to claim Alice&apos;s BSV via the IF path.{"\n"}{"\n"}
                  If Bob never claims, Alice broadcasts the refund TX (which has nLockTime set to
                  a future block). Miners only accept it after the timeout.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_IF</span>{"\n"}
                  {"  "}<span className="text-primary">OP_SHA256</span> <span className="text-xs">2bb80d53...27a25b</span> <span className="text-primary">OP_EQUAL</span>{"\n"}
                  <span className="text-primary">OP_ELSE</span>{"\n"}
                  {"  "}<span className="text-primary">OP_SHA256</span> <span className="text-xs">2cf24dba...9824</span> <span className="text-primary">OP_EQUAL</span>{"\n"}
                  <span className="text-primary">OP_ENDIF</span>
                  {"\n\n"}
                  <span className="text-muted-foreground text-xs">
                    IF branch: SHA256 hash puzzle for claim (preimage: &quot;secret&quot;).{"\n"}
                    ELSE branch: SHA256 hash puzzle for refund (preimage: &quot;hello&quot;).{"\n"}
                    In production, add OP_CHECKSIG to each path for signature verification.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script (Claim)">
                  <span className="text-xs">736563726574</span> <span className="text-primary">OP_TRUE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push preimage &quot;secret&quot; (hex) + TRUE to select the IF (claim) branch.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution (Claim path)">
                  1. Push <code className="text-xs">736563726574</code> (&quot;secret&quot;) and TRUE.{"\n"}
                  2. OP_IF consumes TRUE &mdash; enters IF block.{"\n"}
                  3. OP_SHA256 hashes &quot;secret&quot; &mdash; produces the matching digest.{"\n"}
                  4. Push the committed hash. OP_EQUAL compares &mdash; match! Stack: [1]. Valid.
                </Concept>
                <Tip>
                  In production BSV HTLCs, both paths add OP_CHECKSIG and the refund TX sets
                  nLockTime to enforce timing. The script handles WHO can spend (hash puzzle +
                  signature), while the transaction controls WHEN (nLockTime + nSequence).
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* HTLC Refund */}
            <AccordionItem value="htlc-refund" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                HTLC (Refund Path)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Same locking script as the HTLC Claim, but takes the ELSE (refund) branch.
                  Push FALSE to skip the IF block and provide the refund preimage instead.
                </Concept>
                <Concept title="Real-world use">
                  The safety net. If the counterparty never claims, the sender broadcasts
                  a refund TX. On BSV, this TX would have nLockTime set to a future block height.
                  Miners reject it until the timeout passes, giving the counterparty time to claim
                  first. After the timeout, the refund TX becomes valid and can be mined.
                </Concept>
                <ScriptBlock label="Unlocking Script (Refund)">
                  <span className="text-xs">68656c6c6f</span> <span className="text-primary">OP_FALSE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push preimage &quot;hello&quot; (hex) + FALSE to take the ELSE (refund) branch.
                    On-chain, this TX would have nLockTime &ge; the agreed timeout block.
                  </span>
                </ScriptBlock>
                <Concept title="BSV vs BTC approach">
                  On BTC, the HTLC refund uses OP_CHECKLOCKTIMEVERIFY (CLTV) inside the script
                  to enforce the timeout. On BSV, CLTV is disabled (it&apos;s OP_NOP2). Instead,
                  the refund TX itself carries the timelock via nLockTime. The script doesn&apos;t
                  need to know about time &mdash; it only verifies the hash and branch selection.
                  The miner consensus rules handle the timing.
                </Concept>
              </AccordionContent>
            </AccordionItem>

            {/* 2-of-2 Escrow */}
            <AccordionItem value="escrow-2of2" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                2-of-2 Escrow (Reference)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  A bare 2-of-2 multisig &mdash; both parties must sign for the funds to move. Neither
                  can spend unilaterally. Uses OP_CHECKMULTISIG.
                </Concept>
                <Concept title="Real-world use">
                  <strong>Joint custody.</strong> Two-party escrow, shared wallets, payment channel
                  funding outputs, or any scenario where both parties must agree before funds move.
                  Often combined with a nLockTime-based refund TX so funds aren&apos;t stuck forever if
                  one party disappears.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_2</span> <span className="text-xs">&lt;pubkey_A&gt;</span> <span className="text-xs">&lt;pubkey_B&gt;</span> <span className="text-primary">OP_2</span> <span className="text-primary">OP_CHECKMULTISIG</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    OP_2 ... OP_2 OP_CHECKMULTISIG: require 2 of 2 signatures.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_0</span> <span className="text-xs">&lt;sig_A&gt;</span> <span className="text-xs">&lt;sig_B&gt;</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    OP_0 is the CHECKMULTISIG dummy element (a historical off-by-one bug in Bitcoin
                    that consumes one extra stack item). Both signatures must be valid.
                  </span>
                </ScriptBlock>
                <Warning>
                  Reference only &mdash; uses placeholder keys. OP_CHECKMULTISIG requires real
                  signatures and transaction context.
                </Warning>
              </AccordionContent>
            </AccordionItem>

            {/* Conditional Hash (SHA256 or HASH160) */}
            <AccordionItem value="conditional-hash" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Conditional Hash (SHA256 or HASH160)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  An IF/ELSE branch where each path uses a different hash algorithm. Push TRUE to
                  prove knowledge of the SHA256 preimage, or FALSE for the HASH160 preimage.
                  Both paths use the same preimage (&quot;hello&quot;) but verify different hash digests.
                </Concept>
                <Concept title="Real-world use">
                  Demonstrates how to create scripts with alternative verification methods. In
                  practice, this pattern appears in protocols where different parties use different
                  hash algorithms, or where an upgrade path transitions from one hash function to
                  another while keeping the same output.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_IF</span>{"\n"}
                  {"  "}<span className="text-primary">OP_SHA256</span> <span className="text-xs">2cf24d...9824</span> <span className="text-primary">OP_EQUAL</span>{"\n"}
                  <span className="text-primary">OP_ELSE</span>{"\n"}
                  {"  "}<span className="text-primary">OP_HASH160</span> <span className="text-xs">b6a9c8...7d0f</span> <span className="text-primary">OP_EQUAL</span>{"\n"}
                  <span className="text-primary">OP_ENDIF</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">68656c6c6f</span> <span className="text-primary">OP_TRUE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push &quot;hello&quot; + TRUE for SHA256 path. Change to FALSE for HASH160 path &mdash;
                    same preimage satisfies both because the lock commits to both hash digests.
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>

            {/* Dual Hash Path */}
            <AccordionItem value="hash-dual-path" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Dual Hash Path
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Two-path contract: claim with one preimage (IF) or refund with a different
                  preimage (ELSE). This is the BSV-native HTLC structure &mdash; the script handles
                  the branching and hash verification, while timing is enforced via nLockTime
                  at the transaction level.
                </Concept>
                <Concept title="Real-world use">
                  This is the HTLC pattern adapted for BSV. On BTC, the ELSE branch would use
                  OP_CHECKLOCKTIMEVERIFY to enforce a timeout in script. On BSV, CLTV is disabled,
                  so the refund TX itself carries a nLockTime value &mdash; miners reject it until
                  the timeout. The script only needs to verify which hash is provided.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_IF</span>{"\n"}
                  {"  "}<span className="text-primary">OP_SHA256</span> <span className="text-xs">2cf24d...9824</span> <span className="text-primary">OP_EQUAL</span>{"\n"}
                  <span className="text-primary">OP_ELSE</span>{"\n"}
                  {"  "}<span className="text-primary">OP_SHA256</span> <span className="text-xs">2bb80d...a25b</span> <span className="text-primary">OP_EQUAL</span>{"\n"}
                  <span className="text-primary">OP_ENDIF</span>
                  {"\n\n"}
                  <span className="text-muted-foreground text-xs">
                    IF: claim with SHA256(&quot;hello&quot;). ELSE: refund with SHA256(&quot;secret&quot;).
                    Both paths are fully testable in the playground.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script (Claim)">
                  <span className="text-xs">68656c6c6f</span> <span className="text-primary">OP_TRUE</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Claim: push &quot;hello&quot; + TRUE. Refund: push &quot;secret&quot; + FALSE.
                    On-chain, the refund TX would have nLockTime set to a future block.
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  STANDARD                                                        */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Standard Payments" />
            <h2 className="text-lg font-medium text-foreground">Standard Payments</h2>
            <Badge variant="outline" className="text-xs">3 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The script patterns used by almost every Bitcoin transaction. P2PKH (pay-to-public-key-hash)
            is the most common &mdash; it&apos;s what your wallet uses when you &quot;send to an address.&quot;
            These are reference templates; they require real signatures to validate.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* P2PKH */}
            <AccordionItem value="p2pkh-ref" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                P2PKH (Reference)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Pay-to-Public-Key-Hash. The standard Bitcoin payment. Locks funds to a public
                  key hash (= Bitcoin address). To spend, provide a signature and the matching public key.
                </Concept>
                <Concept title="Real-world use">
                  <strong>This is how ~99% of BSV transactions work.</strong> When you send BSV to an
                  address like <code className="text-xs">1A1zP1...</code>, the output uses a P2PKH script.
                  Your wallet creates P2PKH outputs for every payment and P2PKH inputs for every spend.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_DUP</span> <span className="text-primary">OP_HASH160</span> <span className="text-xs">&lt;pubkey_hash_20bytes&gt;</span> <span className="text-primary">OP_EQUALVERIFY</span> <span className="text-primary">OP_CHECKSIG</span>
                  {"\n\n"}
                  <span className="text-muted-foreground text-xs">
                    Step by step:{"\n"}
                    1. OP_DUP duplicates the provided public key{"\n"}
                    2. OP_HASH160 hashes the copy → produces the pubkey hash{"\n"}
                    3. Compare to the embedded hash → verifies the right key{"\n"}
                    4. OP_CHECKSIG verifies the signature against the TX → proves ownership
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">&lt;signature&gt; &lt;public_key&gt;</span>
                </ScriptBlock>
                <Concept title="Why hash the public key?">
                  Hashing adds a layer of security. If SHA256 or ECDSA is ever partially
                  broken, the hash still protects unspent outputs. The public key is only
                  revealed when spending, minimizing exposure. This is also why address reuse
                  is discouraged &mdash; after spending, the public key is known.
                </Concept>
              </AccordionContent>
            </AccordionItem>

            {/* P2PK */}
            <AccordionItem value="p2pk-ref" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                P2PK (Reference)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Pay-to-Public-Key. The original Bitcoin payment script used in the earliest
                  transactions. The public key is embedded directly in the locking script.
                </Concept>
                <Concept title="Real-world use">
                  The very first Bitcoin transaction (block 1 reward) used P2PK. It was replaced
                  by P2PKH because embedding the full public key (33 bytes compressed) in the output
                  is larger and reveals the key before spending. P2PK is still valid and occasionally
                  used in specialized protocols where the public key is already known.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-xs">&lt;public_key&gt;</span> <span className="text-primary">OP_CHECKSIG</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Simpler than P2PKH: no hashing, no DUP/EQUALVERIFY. Just verify the signature
                    against the embedded public key.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">&lt;signature&gt;</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Just the ECDSA signature. The public key is already in the locking script &mdash;
                    no need to provide it again (unlike P2PKH).
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>

            {/* 1-of-2 Multisig */}
            <AccordionItem value="bare-multisig-ref" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                1-of-2 Multisig (Reference)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  A bare 1-of-2 multisig. Either of two parties can sign alone to spend.
                  Uses OP_CHECKMULTISIG with threshold M=1 out of N=2.
                </Concept>
                <Concept title="Real-world use">
                  <strong>Shared access.</strong> A joint account where either partner can spend
                  independently. Also used for backup keys &mdash; if your primary key is compromised
                  or lost, the backup key can still access funds. The M-of-N pattern generalizes:
                  2-of-3 for &quot;any two of three parties,&quot; 3-of-5 for corporate treasuries, etc.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_1</span> <span className="text-xs">&lt;pubkey_A&gt;</span> <span className="text-xs">&lt;pubkey_B&gt;</span> <span className="text-primary">OP_2</span> <span className="text-primary">OP_CHECKMULTISIG</span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-primary">OP_0</span> <span className="text-xs">&lt;sig_A_or_B&gt;</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    OP_0 dummy element + one valid signature (from either key A or key B).
                  </span>
                </ScriptBlock>
                <Tip>
                  The CHECKMULTISIG off-by-one bug: it pops one more item than it should from the
                  stack. That&apos;s why unlocking scripts start with OP_0 (a dummy element). This
                  bug exists since 2009 and is kept for backwards compatibility.
                </Tip>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  DATA MANIPULATION                                              */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Data Manipulation" />
            <h2 className="text-lg font-medium text-foreground">Data Manipulation</h2>
            <Badge variant="outline" className="text-xs">2 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            BSV restored OP_CAT, OP_SPLIT, and other byte-manipulation opcodes that were disabled
            on BTC in 2010. These enable scripts to concatenate, split, and transform byte strings &mdash;
            essential building blocks for advanced patterns like OP_PUSH_TX (sighash preimage inspection).
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* OP_CAT */}
            <AccordionItem value="string-concat" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                String Concatenation (OP_CAT)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  OP_CAT pops two byte strings from the stack and pushes their concatenation.
                  The second-to-top item becomes the prefix, the top item becomes the suffix.
                </Concept>
                <Concept title="Real-world use">
                  <strong>OP_CAT is arguably the most important restored opcode on BSV.</strong> It enables:{"\n"}{"\n"}
                  &bull; <strong className="text-foreground">OP_PUSH_TX:</strong> reconstructing the sighash preimage on-stack to inspect transaction fields (nLockTime, output amounts, etc.) inside a script.{"\n"}
                  &bull; <strong className="text-foreground">Merkle proofs:</strong> verifying inclusion in a Merkle tree by concatenating and hashing pairs.{"\n"}
                  &bull; <strong className="text-foreground">Token protocols:</strong> building complex data structures from smaller pieces.{"\n"}
                  &bull; <strong className="text-foreground">Dynamic script construction:</strong> assembling scripts at spend time.{"\n"}{"\n"}
                  OP_CAT was disabled on BTC in 2010 as a precautionary measure (along with OP_MUL, OP_DIV, and others). BSV restored it at the Genesis upgrade.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_CAT</span>{" "}
                  <span className="text-xs">68656c6c6f776f726c64</span>{" "}
                  <span className="text-primary">OP_EQUAL</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Concatenate the top two stack items, compare to &quot;helloworld&quot;.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">68656c6c6f 776f726c64</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push &quot;hello&quot; then &quot;world&quot;. OP_CAT joins them: [hello, world] → [helloworld].
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push <code className="text-xs">68656c6c6f</code> (&quot;hello&quot;). Stack: [hello]{"\n"}
                  2. Push <code className="text-xs">776f726c64</code> (&quot;world&quot;). Stack: [hello, world]{"\n"}
                  3. <code className="text-xs">OP_CAT</code> pops both, pushes &quot;helloworld&quot;. Stack: [helloworld]{"\n"}
                  4. Push expected value <code className="text-xs">68656c6c6f776f726c64</code>. Stack: [helloworld, helloworld]{"\n"}
                  5. <code className="text-xs">OP_EQUAL</code> compares. Match! Stack: [1]. Valid.
                </Concept>
                <Tip>
                  OP_CAT concatenation order: second-to-top || top. So [A, B] → OP_CAT → [AB].
                  The deeper item is the prefix, the top item is the suffix.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* OP_SPLIT */}
            <AccordionItem value="byte-split" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Byte Extraction (OP_SPLIT)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  OP_SPLIT pops a position number and a byte string, then splits the string at
                  that byte position. It pushes two results: the left half (first n bytes) and
                  the right half (remaining bytes).
                </Concept>
                <Concept title="Real-world use">
                  OP_SPLIT is the inverse of OP_CAT. Together they enable arbitrary byte-level
                  data manipulation in BSV scripts:{"\n"}{"\n"}
                  &bull; <strong className="text-foreground">Parsing structured data:</strong> extract specific fields from a data blob.{"\n"}
                  &bull; <strong className="text-foreground">Signature inspection:</strong> R-Puzzle scripts use OP_SPLIT to extract the R value from a DER-encoded signature.{"\n"}
                  &bull; <strong className="text-foreground">Protocol parsing:</strong> split protocol messages into header and payload.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_5</span> <span className="text-primary">OP_SPLIT</span>{" "}
                  <span className="text-xs">776f726c64</span>{" "}
                  <span className="text-primary">OP_EQUALVERIFY</span>{" "}
                  <span className="text-xs">68656c6c6f</span>{" "}
                  <span className="text-primary">OP_EQUAL</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Split at byte 5, verify right half = &quot;world&quot;, verify left half = &quot;hello&quot;.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">68656c6c6f776f726c64</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push &quot;helloworld&quot; (10 bytes). The lock splits it at position 5.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push <code className="text-xs">68656c6c6f776f726c64</code> (&quot;helloworld&quot;). Stack: [helloworld]{"\n"}
                  2. <code className="text-xs">OP_5</code> pushes 5. Stack: [helloworld, 5]{"\n"}
                  3. <code className="text-xs">OP_SPLIT</code> splits at byte 5. Stack: [hello, world]{"\n"}
                  4. Push &quot;world&quot;. Stack: [hello, world, &quot;world&quot;]{"\n"}
                  5. <code className="text-xs">OP_EQUALVERIFY</code> &mdash; match! Stack: [hello]{"\n"}
                  6. Push &quot;hello&quot;. Stack: [hello, &quot;hello&quot;]{"\n"}
                  7. <code className="text-xs">OP_EQUAL</code> &mdash; match! Stack: [1]. Valid.
                </Concept>
                <Tip>
                  OP_SPLIT is how the R-Puzzle template extracts the R value from a DER signature.
                  The R-Puzzle lock script uses OP_3 OP_SPLIT to skip the DER prefix, OP_1 OP_SPLIT
                  to read the R length, then OP_SWAP OP_SPLIT to extract exactly R-length bytes.
                </Tip>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  DATA                                                            */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Data Embedding" />
            <h2 className="text-lg font-medium text-foreground">Data Embedding</h2>
            <Badge variant="outline" className="text-xs">4 templates</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            OP_RETURN outputs embed arbitrary data on the blockchain. They are provably unspendable
            (the script always fails), so nodes can safely prune them. This is the backbone of
            on-chain data protocols like B://, MAP, Bitcom, and tokenization standards.
          </p>

          <Accordion type="multiple" className="space-y-2">
            {/* OP_RETURN */}
            <AccordionItem value="op-return" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                OP_RETURN Data
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  OP_FALSE OP_RETURN marks an output as unspendable and embeds arbitrary data.
                  The OP_FALSE ensures the script always fails. OP_RETURN terminates execution.
                  Everything after OP_RETURN is treated as data pushes.
                </Concept>
                <Concept title="Real-world use">
                  On BSV, OP_RETURN has no size limit. This enables:{"\n"}{"\n"}
                  &bull; On-chain file storage (images, documents, code){"\n"}
                  &bull; Token protocols (STAS, RUN, 1Sat Ordinals){"\n"}
                  &bull; Social media (Twetch, RelayX posts){"\n"}
                  &bull; Timestamping and notarization{"\n"}
                  &bull; Any application that needs permanent, immutable data storage
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_FALSE</span> <span className="text-primary">OP_RETURN</span> <span className="text-xs">48656c6c6f20576f726c64</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Data: &quot;Hello World&quot; in hex. The output is unspendable by design.
                  </span>
                </ScriptBlock>
                <Tip>
                  OP_FALSE OP_RETURN (not just OP_RETURN) is the current standard. The leading
                  OP_FALSE ensures the output is definitely unspendable. Some older transactions
                  used just OP_RETURN, which technically could be satisfied by a cleverly crafted
                  unlocking script in edge cases.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* OP_RETURN Multi */}
            <AccordionItem value="op-return-multi" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                OP_RETURN Multi-Push
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Multiple data fields in a single OP_RETURN output. Each push is a separate
                  field that protocols can parse individually.
                </Concept>
                <Concept title="Real-world use">
                  On-chain protocols use multiple pushes to structure data. The B:// protocol
                  for file uploads uses: <code className="text-xs">[prefix] [data] [content-type] [encoding]</code>.
                  MAP (Magic Attribute Protocol) uses: <code className="text-xs">[prefix] [SET] [key] [value]</code>.
                  The multi-push pattern lets any indexer parse the fields without custom logic &mdash;
                  just read each push as a separate field.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_FALSE</span> <span className="text-primary">OP_RETURN</span> <span className="text-xs">48656c6c6f</span> <span className="text-xs">576f726c64</span> <span className="text-xs">313233</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Three pushes: &quot;Hello&quot;, &quot;World&quot;, &quot;123&quot;. Each is a separate field in the output.
                  </span>
                </ScriptBlock>
              </AccordionContent>
            </AccordionItem>

            {/* Data Integrity Proof */}
            <AccordionItem value="data-integrity" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Data Integrity Proof
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Commits to a document hash in a spendable output. To spend, you must provide the
                  original document data. The script hashes it and verifies the match &mdash; proving
                  the data existed when the output was created. Unlike OP_RETURN, the output is spendable
                  and the data lives in the spending TX&apos;s input script.
                </Concept>
                <Concept title="Why not OP_RETURN?">
                  OP_RETURN creates unspendable outputs &mdash; the satoshis are burned. The Bitcoin scripting
                  system was designed to push, verify, and process data using opcodes like OP_SHA256,
                  OP_EQUALVERIFY, and OP_PUSHDATA. Data can be embedded in spendable scripts that combine
                  data storage with spending conditions &mdash; the output retains value while carrying
                  verifiable data on-chain.
                </Concept>
                <Concept title="Real-world use">
                  <strong>EDI and enterprise data verification.</strong> Electronic Data Interchange (EDI)
                  is the standard for B2B document exchange &mdash; purchase orders, invoices, shipping
                  notices. Instead of dumping EDI data into OP_RETURN, the document hash is committed in a
                  spendable output. When the business counterparty provides the original document to spend,
                  it&apos;s permanently recorded on-chain with cryptographic proof of integrity.{"\n"}{"\n"}
                  &bull; <strong className="text-foreground">Immutable audit trail:</strong> the spending TX proves the document existed at a specific time.{"\n"}
                  &bull; <strong className="text-foreground">Spendable:</strong> the UTXO retains value &mdash; no satoshis burned.{"\n"}
                  &bull; <strong className="text-foreground">Peer-to-peer:</strong> no intermediary (VAN) needed &mdash; parties exchange data directly.
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_DUP</span>{" "}
                  <span className="text-primary">OP_SHA256</span>{" "}
                  <span className="text-xs">d0276bec...e3eea5</span>{" "}
                  <span className="text-primary">OP_EQUALVERIFY</span>{" "}
                  <span className="text-primary">OP_SIZE</span>{" "}
                  <span className="text-primary">OP_NIP</span>{" "}
                  <span className="text-primary">OP_0</span>{" "}
                  <span className="text-primary">OP_GREATERTHAN</span>
                  {"\n\n"}
                  <span className="text-muted-foreground text-xs">
                    DUP the data, SHA256 hash it, verify against the committed hash (EQUALVERIFY).{"\n"}
                    SIZE pushes the byte length, NIP removes the data copy, GREATERTHAN ensures non-empty.{"\n"}
                    Result: the data&apos;s length (truthy) remains on stack.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">504f2d323032342d303031</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    The original document: &quot;PO-2024-001&quot; (a purchase order ID). Its SHA256 matches the committed hash.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push <code className="text-xs">504f2d323032342d303031</code> (&quot;PO-2024-001&quot;). Stack: [data]{"\n"}
                  2. <code className="text-xs">OP_DUP</code>: Stack: [data, data]{"\n"}
                  3. <code className="text-xs">OP_SHA256</code> hashes the copy. Stack: [data, hash]{"\n"}
                  4. Push committed hash. <code className="text-xs">OP_EQUALVERIFY</code> &mdash; match! Stack: [data]{"\n"}
                  5. <code className="text-xs">OP_SIZE</code> pushes 11 (byte length). Stack: [data, 11]{"\n"}
                  6. <code className="text-xs">OP_NIP</code> removes data. Stack: [11]{"\n"}
                  7. <code className="text-xs">OP_0 OP_GREATERTHAN</code> &mdash; 11 &gt; 0 = TRUE. Stack: [1]. Valid.
                </Concept>
                <Tip>
                  This pattern extends to full EDI documents. BSV&apos;s removed script size limits
                  mean the unlocking script can push megabytes of data (invoices, shipping manifests,
                  contracts) &mdash; all verified against the committed hash, all in a spendable output.
                  The original Bitcoin protocol included IP-to-IP transactions for direct peer-to-peer
                  data exchange &mdash; this pattern brings that vision back using script verification.
                </Tip>
              </AccordionContent>
            </AccordionItem>

            {/* Message Authentication */}
            <AccordionItem value="message-auth" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                Message Authentication (OP_CAT)
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <Concept title="What it does">
                  Verifies a structured message by concatenating sender + payload using OP_CAT and
                  checking the combined hash. Both pieces must be correct &mdash; the right sender AND
                  the right data &mdash; or the hash won&apos;t match.
                </Concept>
                <Concept title="Real-world use">
                  <strong>On-chain EDI and messaging.</strong> This pattern enables structured B2B data
                  exchange directly in spendable scripts:{"\n"}{"\n"}
                  &bull; <strong className="text-foreground">Structured data:</strong> sender + payload are separate pushes, composed by OP_CAT before hashing.{"\n"}
                  &bull; <strong className="text-foreground">Authentication:</strong> the sender ID is part of the hash commitment &mdash; wrong sender = wrong hash.{"\n"}
                  &bull; <strong className="text-foreground">No OP_RETURN:</strong> data lives in the spending TX&apos;s input script. The output is spendable.{"\n"}
                  &bull; <strong className="text-foreground">Extensible:</strong> chain multiple OP_CATs to compose multi-field messages (sender + type + payload + timestamp).
                </Concept>
                <ScriptBlock label="Locking Script">
                  <span className="text-primary">OP_CAT</span>{" "}
                  <span className="text-primary">OP_SHA256</span>{" "}
                  <span className="text-xs">b5f2cf84...4bac6b</span>{" "}
                  <span className="text-primary">OP_EQUAL</span>
                  {"\n\n"}
                  <span className="text-muted-foreground text-xs">
                    Concatenate the two pushed values, SHA256 the result, compare to the committed hash.
                  </span>
                </ScriptBlock>
                <ScriptBlock label="Unlocking Script">
                  <span className="text-xs">616c696365 696e766f696365</span>
                  {"\n"}
                  <span className="text-muted-foreground text-xs">
                    Push &quot;alice&quot; (sender) + &quot;invoice&quot; (payload). OP_CAT joins them to &quot;aliceinvoice&quot;.
                  </span>
                </ScriptBlock>
                <Concept title="Step-by-step execution">
                  1. Push <code className="text-xs">616c696365</code> (&quot;alice&quot;) and <code className="text-xs">696e766f696365</code> (&quot;invoice&quot;). Stack: [alice, invoice]{"\n"}
                  2. <code className="text-xs">OP_CAT</code> concatenates. Stack: [aliceinvoice]{"\n"}
                  3. <code className="text-xs">OP_SHA256</code> hashes. Stack: [hash]{"\n"}
                  4. Push committed hash. <code className="text-xs">OP_EQUAL</code> &mdash; match! Stack: [1]. Valid.
                </Concept>
                <Tip>
                  This is how BSV enables on-chain EDI without OP_RETURN. Instead of burning
                  satoshis in unspendable outputs, data is pushed and verified using opcodes.
                  In production, add OP_CHECKSIG to bind the message to a specific authorized sender.
                </Tip>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  CUSTOM                                                          */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CategoryIcon cat="Custom" />
            <h2 className="text-lg font-medium text-foreground">Custom</h2>
            <Badge variant="outline" className="text-xs">1 template</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The blank canvas. Write your own locking and unlocking scripts from scratch. Combine
            any of the patterns you&apos;ve learned above &mdash; or invent entirely new ones.
          </p>

          <Card className="border-border bg-muted/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Tips for writing custom scripts</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>&bull; <strong className="text-foreground">Start simple.</strong> Get the basic logic working with hardcoded values, then make it more complex.</p>
                <p>&bull; <strong className="text-foreground">Use the simulator.</strong> The step-by-step execution view shows exactly what&apos;s on the stack after each opcode. This is the fastest way to debug.</p>
                <p>&bull; <strong className="text-foreground">Remember the clean stack rule.</strong> After execution, there must be exactly one truthy value on the stack. Use OP_DROP to remove extra items. Use OP_VERIFY to consume TRUE from intermediate checks.</p>
                <p>&bull; <strong className="text-foreground">OP_EQUALVERIFY vs OP_EQUAL.</strong> Use EQUALVERIFY for intermediate checks (it fails fast and removes both items). Use EQUAL for the final check (it leaves TRUE/FALSE as the result).</p>
                <p>&bull; <strong className="text-foreground">Stack order matters.</strong> The stack is LIFO (last in, first out). The first thing pushed in the unlock script is the deepest item when the lock script runs.</p>
                <p>&bull; <strong className="text-foreground">Hex data pushes.</strong> In ASM, hex strings like <code className="text-xs">68656c6c6f</code> are automatically pushed as data. You don&apos;t need a PUSH opcode.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* ================================================================ */}
        {/*  CTA                                                             */}
        {/* ================================================================ */}
        <section className="text-center py-6 space-y-4">
          <h2 className="text-lg font-medium text-foreground">Ready to build?</h2>
          <p className="text-sm text-muted-foreground">
            Try any of these patterns in the Script Lab. Load a template, modify it, step
            through the execution, and build real transactions.
          </p>
          <Button asChild size="lg">
            <Link href="/scripts">
              Open Script Lab <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Saibun &mdash; Script Guide</p>
            <div className="flex items-center gap-4">
              <Link href="/scripts" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                Script Lab
              </Link>
              <Link href="/learn" className="hover:text-foreground transition-colors flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Learn
              </Link>
              <Link href="/" className="hover:text-foreground transition-colors">
                Splitter
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
