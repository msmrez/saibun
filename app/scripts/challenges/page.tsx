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
    description: "An IF/ELSE branch. One path pushes 3, the other pushes 7. The lock checks for 3.",
    lockingASM: "OP_IF OP_3 OP_ELSE OP_7 OP_ENDIF OP_3 OP_EQUAL",
    hints: [
      "OP_IF pops the top item. If truthy, it enters the IF branch.",
      "Push TRUE (OP_TRUE or OP_1) to take the IF path that pushes 3.",
    ],
    solutions: ["OP_TRUE", "OP_1"],
  },
  {
    id: 5,
    title: "Reverse Order",
    difficulty: "intermediate",
    description: "Push two numbers. The lock swaps them and subtracts. Result must be 3.",
    lockingASM: "OP_SWAP OP_SUB OP_3 OP_EQUAL",
    hints: [
      "OP_SWAP exchanges the top two stack items.",
      "After SWAP, SUB computes second - first (original order).",
      "If you push A then B: after SWAP stack is [B, A]. SUB gives B - A = 3.",
    ],
    solutions: ["OP_2 OP_5", "OP_1 OP_4", "OP_3 OP_6", "OP_4 OP_7", "OP_5 OP_8"],
  },
  {
    id: 6,
    title: "Twin Values",
    difficulty: "intermediate",
    description: "Push two identical numbers. The lock verifies they match, then adds them. Sum must be 8.",
    lockingASM: "OP_2DUP OP_EQUALVERIFY OP_ADD OP_8 OP_EQUAL",
    hints: [
      "OP_2DUP copies the top two items.",
      "EQUALVERIFY checks the copies are identical.",
      "Then ADD sums the originals. What two identical numbers sum to 8?",
    ],
    solutions: ["OP_4 OP_4"],
  },
  {
    id: 7,
    title: "Secret Word",
    difficulty: "intermediate",
    description: "Find the preimage. The lock hashes your input with SHA256 and checks the digest.",
    lockingASM: "OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL",
    hints: [
      "You need to push data whose SHA256 hash matches the embedded digest.",
      'Think of a common 5-letter English greeting...',
      'The answer is "hello" encoded as hex: 68656c6c6f',
    ],
    solutions: ["68656c6c6f"],
  },
  // ── Advanced ──────────────────────────────────────────────────────────
  {
    id: 8,
    title: "String Builder",
    difficulty: "advanced",
    description: 'Push two byte strings that concatenate to "helloworld" (hex: 68656c6c6f776f726c64).',
    lockingASM: "OP_CAT 68656c6c6f776f726c64 OP_EQUAL",
    hints: [
      "OP_CAT pops two items and concatenates them (second-to-top + top).",
      '"hello" = 68656c6c6f, "world" = 776f726c64',
      "Push the first half, then the second half.",
    ],
    solutions: ["68656c6c6f 776f726c64"],
  },
  {
    id: 9,
    title: "Alt Stack Trick",
    difficulty: "advanced",
    description: "Push two numbers. One goes to the alt stack, the other is doubled, then the alt value is added. Result: 11.",
    lockingASM: "OP_TOALTSTACK OP_2 OP_MUL OP_FROMALTSTACK OP_ADD OP_11 OP_EQUAL",
    hints: [
      "The top item goes to the alt stack. The remaining item is multiplied by 2.",
      "Then the alt stack item comes back and is added.",
      "You need: (first_push * 2) + second_push = 11",
      "Try pushing 3 then 5: 3*2 + 5 = 11",
    ],
    solutions: ["OP_3 OP_5", "OP_4 OP_3", "OP_5 OP_1", "OP_2 OP_7", "OP_1 OP_9"],
  },
  {
    id: 10,
    title: "Rabin Check",
    difficulty: "advanced",
    description: "Verify a Rabin signature. The lock computes s\u00B2 mod n and checks it equals 4. Find the signature s.",
    lockingASM: "OP_DUP OP_MUL 4d OP_MOD OP_4 OP_EQUAL",
    hints: [
      "The public key n = 77 (0x4d). The expected message digest m = 4.",
      "You need s where s\u00B2 mod 77 = 4.",
      "Try s = 9: 9\u00B2 = 81, 81 mod 77 = 4. Push OP_9.",
    ],
    solutions: ["OP_9"],
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
