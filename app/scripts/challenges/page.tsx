"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Code2,
  BookOpen,
  Lightbulb,
  Lock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Play,
  Puzzle,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { simulateScript } from "@/lib/script-playground";

// ---------------------------------------------------------------------------
//  Challenge data
// ---------------------------------------------------------------------------

interface Challenge {
  id: number;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  lockingASM: string;
  hints: string[];
  solutions: string[]; // multiple valid answers
}

const CHALLENGES: Challenge[] = [
  // ── Beginner ──────────────────────────────────────────────────────────
  {
    id: 1,
    title: "The Number",
    difficulty: "beginner",
    description: "The lock expects a specific number. Can you push the right one?",
    lockingASM: "OP_5 OP_EQUAL",
    hints: [
      "The lock pushes 5, then checks equality.",
      "You need to push the number 5 in your unlock.",
    ],
    solutions: ["OP_5"],
  },
  {
    id: 2,
    title: "Quick Math",
    difficulty: "beginner",
    description: "Push two numbers that add up to 9.",
    lockingASM: "OP_ADD OP_9 OP_EQUAL",
    hints: [
      "OP_ADD pops two items and pushes their sum.",
      "Any two numbers that sum to 9 will work: 4+5, 3+6, 1+8...",
    ],
    solutions: ["OP_4 OP_5", "OP_5 OP_4", "OP_3 OP_6", "OP_6 OP_3", "OP_1 OP_8", "OP_8 OP_1", "OP_2 OP_7", "OP_7 OP_2"],
  },
  {
    id: 3,
    title: "Double Up",
    difficulty: "beginner",
    description: "Push one number. The lock duplicates it and adds both copies. Result must be 10.",
    lockingASM: "OP_DUP OP_ADD OP_10 OP_EQUAL",
    hints: [
      "OP_DUP duplicates the top stack item.",
      "If x + x = 10, then x = 5.",
    ],
    solutions: ["OP_5"],
  },
  // ── Intermediate ──────────────────────────────────────────────────────
  {
    id: 4,
    title: "Choose Wisely",
    difficulty: "intermediate",
    description: "A nested IF/ELSE: two booleans select one of four outcomes (2, 3, 4, or 5). The lock checks for 4. Which two booleans open the path that pushes 4?",
    lockingASM: "OP_IF OP_IF OP_2 OP_ELSE OP_3 OP_ENDIF OP_ELSE OP_IF OP_4 OP_ELSE OP_5 OP_ENDIF OP_ENDIF OP_4 OP_EQUAL",
    hints: [
      "The top of the stack is consumed by the outer OP_IF first. So the second value you push is the outer branch selector.",
      "Outer IF truthy → inner runs (2 or 3). Outer IF falsy → outer ELSE runs (4 or 5). We need 4, so outer must be falsy.",
      "Push inner selector first, then outer. For 4: inner must be IF (true), outer must be ELSE (false). So push OP_TRUE then OP_FALSE.",
    ],
    solutions: ["OP_TRUE OP_FALSE", "OP_1 OP_0"],
  },
  {
    id: 5,
    title: "Reverse Order",
    difficulty: "intermediate",
    description: "Push two numbers A and B. The lock swaps them, subtracts (B − A), verifies the result is positive, then checks it equals 3.",
    lockingASM: "OP_SWAP OP_SUB OP_DUP OP_0 OP_GREATERTHAN OP_VERIFY OP_3 OP_EQUAL",
    hints: [
      "OP_SWAP then OP_SUB gives (second - first). So you need B − A = 3 with B > A.",
      "OP_GREATERTHAN pushes 1 if the result is > 0; OP_VERIFY then consumes that.",
      "Pairs like (2,5), (1,4), (4,7) work: push the smaller first, then the larger.",
    ],
    solutions: ["OP_2 OP_5", "OP_1 OP_4", "OP_3 OP_6", "OP_4 OP_7", "OP_5 OP_8"],
  },
  {
    id: 6,
    title: "Twin Values",
    difficulty: "intermediate",
    description: "Push two identical numbers. The lock duplicates the top, copies the second (OP_OVER), verifies they match, then adds the two originals. Sum must be 8.",
    lockingASM: "OP_DUP OP_OVER OP_EQUALVERIFY OP_ADD OP_8 OP_EQUAL",
    hints: [
      "OP_DUP duplicates the top; OP_OVER copies the second-to-top to the top.",
      "EQUALVERIFY checks the two copies are equal and removes them, leaving the two originals.",
      "Then ADD sums them. Two identical numbers that sum to 8: 4 and 4.",
    ],
    solutions: ["OP_4 OP_4"],
  },
  {
    id: 7,
    title: "Secret Word (HASH160)",
    difficulty: "intermediate",
    description: "Find the preimage. The lock hashes your input with HASH160 (RIPEMD160(SHA256(x))) and checks the digest — the same hash used in Bitcoin addresses.",
    lockingASM: "OP_HASH160 b6a9c8c230722b7c748331a8b450f05566dc7d0f OP_EQUAL",
    hints: [
      "HASH160(x) = RIPEMD160(SHA256(x)). You need data whose HASH160 matches the embedded digest.",
      "It's the same 5-letter word as the SHA256 puzzle: a common English greeting.",
      "Hex encoding of that word: 68656c6c6f",
    ],
    solutions: ["68656c6c6f"],
  },
  {
    id: 11,
    title: "Range Gate",
    difficulty: "intermediate",
    description: "Push one number. The lock checks it is in the range [3, 10) (≥ 3 and < 10), then multiplies it by 2. The result must equal 10.",
    lockingASM: "OP_DUP OP_3 OP_10 OP_WITHIN OP_VERIFY OP_2 OP_MUL OP_10 OP_EQUAL",
    hints: [
      "OP_WITHIN checks if the value is in the half-open interval [min, max): min ≤ x < max.",
      "So your number must be 3, 4, 5, 6, 7, 8, or 9. Then the lock does × 2 and checks for 10.",
      "Only 5 × 2 = 10. Push OP_5.",
    ],
    solutions: ["OP_5"],
  },
  {
    id: 12,
    title: "Two Paths",
    difficulty: "intermediate",
    description: "The lock has two paths: IF checks SHA256(preimage), ELSE checks HASH160(preimage). We want the ELSE path. Push the preimage and the boolean that selects ELSE.",
    lockingASM: "OP_IF OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL OP_ELSE OP_HASH160 b6a9c8c230722b7c748331a8b450f05566dc7d0f OP_EQUAL OP_ENDIF",
    hints: [
      "OP_IF pops the top: truthy → IF (SHA256 path), falsy → ELSE (HASH160 path).",
      "We want ELSE, so push FALSE (OP_FALSE or OP_0) as the second item.",
      "The preimage is the same for both hashes: \"hello\" = 68656c6c6f. Push preimage first, then FALSE.",
    ],
    solutions: ["68656c6c6f OP_FALSE", "68656c6c6f OP_0"],
  },
  // ── Advanced ──────────────────────────────────────────────────────────
  {
    id: 8,
    title: "String Builder",
    difficulty: "advanced",
    description: 'Push two byte strings that concatenate to "helloworld" (hex: 68656c6c6f776f726c64). OP_CAT is restored on BSV.',
    lockingASM: "OP_CAT 68656c6c6f776f726c64 OP_EQUAL",
    hints: [
      "OP_CAT pops two items and concatenates (second-to-top + top). Result must match the locked hash.",
      '"hello" = 68656c6c6f, "world" = 776f726c64. Order on stack: first half, then second half.',
      "Push 68656c6c6f then 776f726c64.",
    ],
    solutions: ["68656c6c6f 776f726c64"],
  },
  {
    id: 9,
    title: "Alt Stack Trick",
    difficulty: "advanced",
    description: "Push two numbers. One goes to the alt stack, the other is doubled, then the alt value is added. Result must be 11.",
    lockingASM: "OP_TOALTSTACK OP_2 OP_MUL OP_FROMALTSTACK OP_ADD OP_11 OP_EQUAL",
    hints: [
      "The top item goes to the alt stack. The remaining item is multiplied by 2.",
      "Then the alt stack value comes back and is added. So (first × 2) + second = 11.",
      "Examples: 3 and 5, 4 and 3, 5 and 1. Push first number, then second.",
    ],
    solutions: ["OP_3 OP_5", "OP_4 OP_3", "OP_5 OP_1", "OP_2 OP_7", "OP_1 OP_9"],
  },
  {
    id: 10,
    title: "Rabin Check",
    difficulty: "advanced",
    description: "Verify a Rabin signature: the lock computes s² mod n and checks it equals 4. Public key n = 77 (0x4d). Find a valid signature s.",
    lockingASM: "OP_DUP OP_MUL 4d OP_MOD OP_4 OP_EQUAL",
    hints: [
      "Rabin verification: s² mod n must equal the message digest m = 4. Here n = 77.",
      "So you need s such that s² ≡ 4 (mod 77). Try small values.",
      "s = 9: 81 mod 77 = 4. Push OP_9.",
    ],
    solutions: ["OP_9"],
  },
  {
    id: 13,
    title: "Dual Secret",
    difficulty: "advanced",
    description: "The lock requires two different SHA256 preimages. The first (top of stack) must hash to one digest, the second to another. Push both in order.",
    lockingASM: "OP_SHA256 2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90 OP_EQUALVERIFY OP_SHA256 81b637d8fcd2c6da6359e6963113a1170de795e4b725b84d1e0b4cfd9ec58ce9 OP_EQUAL",
    hints: [
      "The lock checks the top value's hash first (EQUALVERIFY), then the next value's hash.",
      "So push the second preimage first, then the first (stack is LIFO).",
      "First preimage is \"bob\" (626f62), second is \"alice\" (616c696365). Unlock: 626f62 616c696365",
    ],
    solutions: ["626f62 616c696365"],
  },
  {
    id: 14,
    title: "Byte Split",
    difficulty: "advanced",
    description: "Push one 10-byte value. The lock splits it at position 5 (OP_5 OP_SPLIT), then verifies the left half is \"hello\" and the right half is \"world\".",
    lockingASM: "OP_5 OP_SPLIT 776f726c64 OP_EQUALVERIFY 68656c6c6f OP_EQUAL",
    hints: [
      "OP_SPLIT splits the top value at the given byte index: [left, right].",
      "Left 5 bytes must equal 68656c6c6f (\"hello\"), right 5 bytes must equal 776f726c64 (\"world\").",
      "Push the concatenation: 68656c6c6f776f726c64",
    ],
    solutions: ["68656c6c6f776f726c64"],
  },
  {
    id: 15,
    title: "Stack Depth",
    difficulty: "advanced",
    description: "Push exactly three numbers. The lock verifies stack depth is 3 (OP_DEPTH), then adds all three. The sum must equal 12.",
    lockingASM: "OP_DEPTH OP_3 OP_EQUALVERIFY OP_ADD OP_ADD OP_12 OP_EQUAL",
    hints: [
      "OP_DEPTH pushes the current number of stack items. The lock requires exactly 3.",
      "Then it adds them: first + second + third = 12. Any triple that sums to 12 works.",
      "Examples: 3, 4, 5 or 4, 4, 4 or 2, 5, 5. Use OP_3 OP_4 OP_5 etc.",
    ],
    solutions: ["OP_3 OP_4 OP_5", "OP_4 OP_3 OP_5", "OP_5 OP_3 OP_4", "OP_4 OP_4 OP_4", "OP_2 OP_5 OP_5", "OP_5 OP_5 OP_2", "OP_1 OP_5 OP_6", "OP_6 OP_5 OP_1"],
  },
  {
    id: 16,
    title: "Message Auth",
    difficulty: "advanced",
    description: "The lock concatenates two fields (sender and message) with OP_CAT, hashes with SHA256, and checks the digest. Find a valid [sender, message] pair that matches the locked hash.",
    lockingASM: "OP_CAT OP_SHA256 b5f2cf84fd46833a53045e8952af76ec501feb9254ab4fa0a000126a424bac6b OP_EQUAL",
    hints: [
      "OP_CAT joins second-to-top with top. So push sender first, then message; CAT gives sender||message.",
      "SHA256(sender||message) must equal the locked digest. This is the EDI / message-auth pattern.",
      "Sender \"alice\" (616c696365) and message \"invoice\" (696e766f696365) hash to that digest.",
    ],
    solutions: ["616c696365 696e766f696365"],
  },
  {
    id: 17,
    title: "Conditional Dual Hash",
    difficulty: "advanced",
    description: "Same lock as Two Paths: IF = SHA256(preimage), ELSE = HASH160(preimage). This time we want the IF path. Push the preimage and the boolean that selects IF.",
    lockingASM: "OP_IF OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL OP_ELSE OP_HASH160 b6a9c8c230722b7c748331a8b450f05566dc7d0f OP_EQUAL OP_ENDIF",
    hints: [
      "To take the IF branch, the value consumed by OP_IF must be truthy. Push OP_TRUE or OP_1 second.",
      "The preimage for the SHA256 path is \"hello\" (68656c6c6f).",
      "Unlock: push preimage first, then TRUE. So: 68656c6c6f OP_TRUE",
    ],
    solutions: ["68656c6c6f OP_TRUE", "68656c6c6f OP_1"],
  },
];

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ---------------------------------------------------------------------------
//  Page component
// ---------------------------------------------------------------------------

export default function ScriptChallengesPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean | null>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});

  const solvedCount = Object.values(results).filter((r) => r === true).length;

  const handleValidate = useCallback((challenge: Challenge) => {
    const unlock = (answers[challenge.id] || "").trim();
    if (!unlock) return;
    try {
      const sim = simulateScript(challenge.lockingASM, unlock);
      setResults((r) => ({ ...r, [challenge.id]: sim.valid }));
    } catch {
      setResults((r) => ({ ...r, [challenge.id]: false }));
    }
  }, [answers]);

  const handleReset = useCallback((id: number) => {
    setAnswers((a) => { const n = { ...a }; delete n[id]; return n; });
    setResults((r) => { const n = { ...r }; delete n[id]; return n; });
    setShowHints((h) => { const n = { ...h }; delete n[id]; return n; });
    setShowSolution((s) => { const n = { ...s }; delete n[id]; return n; });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Saibun</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Script Challenges
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        {/* Hero */}
        <section className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            Script Challenges
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Test your Bitcoin Script knowledge. Each challenge shows you a locking script &mdash;
            your job is to figure out the unlocking script that makes it pass.
          </p>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Trophy className="h-3 w-3" />
              {solvedCount} / {CHALLENGES.length} solved
            </Badge>
            {solvedCount === CHALLENGES.length && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5">
                <CheckCircle className="h-3 w-3" />
                All challenges complete!
              </Badge>
            )}
          </div>
        </section>

        <Separator />

        {/* Challenges */}
        <div className="space-y-6">
          {(["beginner", "intermediate", "advanced"] as const).map((difficulty) => {
            const group = CHALLENGES.filter((c) => c.difficulty === difficulty);
            return (
              <section key={difficulty} className="space-y-4">
                <h2 className="text-lg font-medium text-foreground capitalize">{difficulty}</h2>
                <div className="space-y-3">
                  {group.map((challenge) => {
                    const solved = results[challenge.id] === true;
                    const failed = results[challenge.id] === false;
                    return (
                      <Card
                        key={challenge.id}
                        className={`border-border transition-colors ${
                          solved ? "border-emerald-500/30 bg-emerald-500/5" : ""
                        }`}
                      >
                        <CardContent className="p-4 sm:p-5 space-y-4">
                          {/* Challenge header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-medium text-foreground">
                                  #{challenge.id}. {challenge.title}
                                </h3>
                                <Badge variant="secondary" className={DIFFICULTY_COLORS[challenge.difficulty]}>
                                  {challenge.difficulty}
                                </Badge>
                                {solved && (
                                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{challenge.description}</p>
                            </div>
                          </div>

                          {/* Locking script */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Lock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Locking Script
                              </span>
                            </div>
                            <div className="bg-muted/40 border border-border rounded-lg p-3 font-mono text-sm leading-relaxed break-all whitespace-pre-wrap text-foreground">
                              {challenge.lockingASM}
                            </div>
                          </div>

                          {/* Answer input */}
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Type your unlocking script..."
                                value={answers[challenge.id] || ""}
                                onChange={(e) => setAnswers((a) => ({ ...a, [challenge.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") handleValidate(challenge); }}
                                className={`font-mono text-sm flex-1 ${
                                  solved ? "border-emerald-500/30" : failed ? "border-red-500/30" : ""
                                }`}
                                disabled={solved}
                              />
                              {!solved ? (
                                <Button
                                  onClick={() => handleValidate(challenge)}
                                  disabled={!(answers[challenge.id] || "").trim()}
                                  size="sm"
                                  className="gap-1.5 shrink-0"
                                >
                                  <Play className="h-3.5 w-3.5" />
                                  Check
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 shrink-0"
                                  onClick={() => handleReset(challenge.id)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Reset
                                </Button>
                              )}
                            </div>

                            {/* Result feedback */}
                            {failed && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                Not quite &mdash; the script didn&apos;t validate. Try again!
                              </div>
                            )}
                            {solved && (
                              <div className="flex items-center gap-2 text-sm text-emerald-500">
                                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                Correct! The script validates.
                              </div>
                            )}
                          </div>

                          {/* Hints & Solution toggle */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setShowHints((h) => ({ ...h, [challenge.id]: !h[challenge.id] }))}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Lightbulb className="h-3 w-3" />
                              {showHints[challenge.id] ? "Hide hints" : "Show hints"}
                              {showHints[challenge.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {!solved && (
                              <button
                                type="button"
                                onClick={() => setShowSolution((s) => ({ ...s, [challenge.id]: !s[challenge.id] }))}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showSolution[challenge.id] ? "Hide solution" : "Show solution"}
                              </button>
                            )}
                          </div>

                          {/* Hints */}
                          {showHints[challenge.id] && (
                            <div className="space-y-1.5 pl-1">
                              {challenge.hints.map((hint, i) => (
                                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-1" />
                                  {hint}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Solution */}
                          {showSolution[challenge.id] && !solved && (
                            <div className="bg-muted/30 border border-border rounded-lg p-3">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Solution</p>
                              <code className="text-sm font-mono text-foreground">{challenge.solutions[0]}</code>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <Separator />
        <section className="text-center space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Want to experiment with custom scripts?
          </p>
          <Button asChild>
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
            <p>Saibun &mdash; Script Challenges</p>
            <div className="flex items-center gap-4">
              <Link href="/scripts" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                Script Lab
              </Link>
              <Link href="/scripts/learn" className="hover:text-foreground transition-colors flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Guide
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
