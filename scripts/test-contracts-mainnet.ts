/**
 * Mainnet test for the 4 Smart Contract templates.
 *
 * NOTE on BSV time-locks:
 *   OP_CHECKLOCKTIMEVERIFY (0xB1) was REVERTED TO A NOP at the BSV Genesis
 *   upgrade (Feb 4 2020). It is purely a no-op for all post-Genesis UTXOs.
 *   Time-locks are NOT enforced by Script on BSV. The contracts page no longer
 *   includes CLTV-based contracts. See CLAUDE.md § "BSV Opcode Reference".
 *
 * Five test cases in one chained run:
 *   1. Computation Bounty  — OP_DUP OP_MUL OP_MOD OP_EQUAL
 *   2. Hash Bounty         — OP_SHA256 OP_SPLIT OP_DROP OP_EQUAL (difficulty 1)
 *   3. Dual-Secret HTLC A  — Seller reveals preimage (OP_IF path)
 *   4. Dual-Secret HTLC B  — Buyer reveals refund key (OP_ELSE path)
 *   5. OP_CAT Treasury     — OP_CAT OP_SHA256 OP_EQUAL (BSV-unique)
 *
 * Each test:
 *   a) Builds + broadcasts a locking transaction
 *   b) Builds + broadcasts the corresponding unlocking transaction
 *   c) Chains the change output into the next test
 *
 * Run:  npx tsx scripts/test-contracts-mainnet.ts
 */

import { createHash } from "crypto";

const WIF = "L4WorgVk41cq9efKwcQwaHT3kZjzrXLwVAyLnkWmy52HSuF8wJAS";
const FEE_RATE = 0.5;
const LOCK_AMOUNT = 700; // satoshis per lock output
const DELAY_MS = 500;   // ms between broadcasts to avoid rate-limit

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Helpers (mirrors the app-side logic)
// ---------------------------------------------------------------------------

function textToHex(s: string): string {
  return Buffer.from(s, "utf8").toString("hex");
}

/** SHA256 of the bytes represented by a hex string. */
function sha256HexSync(hexInput: string): string {
  return createHash("sha256")
    .update(Buffer.from(hexInput, "hex"))
    .digest("hex");
}

/** Encode a non-negative integer as a Bitcoin script number ASM token. */
function numToASMToken(n: number): string {
  if (n < 0) throw new Error("Negative numbers not supported");
  if (n === 0) return "OP_0";
  if (n >= 1 && n <= 16) return `OP_${n}`;
  const bytes: number[] = [];
  let rem = n;
  while (rem > 0) {
    bytes.push(rem & 0xff);
    rem = Math.floor(rem / 256);
  }
  if (bytes[bytes.length - 1] & 0x80) bytes.push(0x00);
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Find a preimage whose SHA256 starts with `difficulty` zero bytes.
 * Uses Node's synchronous crypto — much faster than async Web Crypto.
 */
function findHashBountyPreimage(difficulty: number): string {
  console.log(`  Solving Hash Bounty (difficulty=${difficulty} leading zero byte${difficulty > 1 ? "s" : ""})…`);
  for (let i = 0; i < 10_000_000; i++) {
    const text = `saibun-${i}`;
    const hash = createHash("sha256").update(Buffer.from(text, "utf8")).digest();
    let valid = true;
    for (let j = 0; j < difficulty; j++) {
      if (hash[j] !== 0) { valid = false; break; }
    }
    if (valid) {
      const hexHash = hash.toString("hex");
      console.log(`  Found : "${text}" after ${(i + 1).toLocaleString()} attempts`);
      console.log(`  SHA256: ${hexHash}`);
      return text;
    }
  }
  throw new Error("Hash Bounty solver: no preimage found within 10M attempts");
}

// ---------------------------------------------------------------------------
// Test-case type
// ---------------------------------------------------------------------------

interface TestCase {
  name: string;
  lockASM: string;
  unlockASM: string;
}

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  lockTxid?: string;
  unlockTxid?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { importFromWif, fetchUtxosWithRawTx } = await import("../lib/bsv");
  const {
    buildCustomLockTransaction,
    buildCustomUnlockTransaction,
    broadcastTransaction,
  } = await import("../lib/script-playground");

  const { address } = importFromWif(WIF);

  console.log("=".repeat(70));
  console.log("  SAIBUN SMART CONTRACTS — MAINNET TEST");
  console.log("=".repeat(70));
  console.log(`Address    : ${address}`);
  console.log(`Fee rate   : ${FEE_RATE} sat/byte`);
  console.log(`Lock amount: ${LOCK_AMOUNT} sats per contract`);
  console.log("");

  // ── Step 1: solve Hash Bounty up-front (CPU work) ────────────────────────
  const bountyPreimage = findHashBountyPreimage(1);
  const bountyPreimageHex = textToHex(bountyPreimage);
  console.log("");

  // ── Step 2: build contract parameters ────────────────────────────────────

  // Computation Bounty: x² ≡ M (mod N)
  const N = 101, x = 9;
  const M = ((x * x) % N + N) % N; // 81

  // Dual-Secret HTLC: seller holds dataSecret, buyer holds refundSecret
  const dataSecret    = "saibun-data-sale";
  const refundSecret  = "saibun-buyer-refund";
  const hashData      = sha256HexSync(textToHex(dataSecret));
  const hashRefund    = sha256HexSync(textToHex(refundSecret));

  // OP_CAT Treasury: funds require both part1 and part2
  const part1 = "saibun-part-one";
  const part2 = "saibun-part-two";
  const catHash = sha256HexSync(textToHex(part1) + textToHex(part2));

  const testCases: TestCase[] = [
    // ── 1. Computation Bounty ─────────────────────────────────────────────
    {
      name: `Computation Bounty  (x=${x}, N=${N}, M=${M})`,
      lockASM:   `OP_DUP OP_MUL ${numToASMToken(N)} OP_MOD ${numToASMToken(M)} OP_EQUAL`,
      unlockASM: numToASMToken(x),
    },
    // ── 2. Hash Bounty ────────────────────────────────────────────────────
    {
      name: `Hash Bounty         (SHA256 prefix 0x00, preimage="${bountyPreimage}")`,
      lockASM:   `OP_SHA256 OP_1 OP_SPLIT OP_DROP 00 OP_EQUAL`,
      unlockASM: bountyPreimageHex,
    },
    // ── 3. Dual-Secret HTLC — Seller claim ───────────────────────────────
    {
      name: `Dual-Secret HTLC A  (seller reveals "${dataSecret}")`,
      lockASM:   `OP_IF OP_SHA256 ${hashData} OP_EQUAL OP_ELSE OP_SHA256 ${hashRefund} OP_EQUAL OP_ENDIF`,
      unlockASM: `${textToHex(dataSecret)} OP_1`,
    },
    // ── 4. Dual-Secret HTLC — Buyer refund ────────────────────────────────
    {
      name: `Dual-Secret HTLC B  (buyer reveals "${refundSecret}")`,
      lockASM:   `OP_IF OP_SHA256 ${hashData} OP_EQUAL OP_ELSE OP_SHA256 ${hashRefund} OP_EQUAL OP_ENDIF`,
      unlockASM: `${textToHex(refundSecret)} OP_0`,
    },
    // ── 5. OP_CAT Treasury ────────────────────────────────────────────────
    {
      name: `OP_CAT Treasury     (parts "${part1}" + "${part2}")`,
      lockASM:   `OP_CAT OP_SHA256 ${catHash} OP_EQUAL`,
      unlockASM: `${textToHex(part1)} ${textToHex(part2)}`,
    },
  ];

  // ── Step 3: fetch UTXOs ──────────────────────────────────────────────────
  console.log("Fetching UTXOs…");
  const utxos = await fetchUtxosWithRawTx(address);

  if (!utxos.length) {
    console.error(`\nNo UTXOs found. Fund ${address} with at least ${(testCases.length * (LOCK_AMOUNT + 500)).toLocaleString()} sats.`);
    process.exit(1);
  }

  const bestUtxo = utxos.reduce((a, b) => (a.satoshis > b.satoshis ? a : b));
  if (!bestUtxo.rawTxHex) {
    console.error("Missing raw TX hex for UTXO.");
    process.exit(1);
  }

  const totalBalance = utxos.reduce((s, u) => s + u.satoshis, 0);
  const estimatedCost = testCases.length * (LOCK_AMOUNT + 500);
  console.log(`Balance  : ${totalBalance.toLocaleString()} sats (need ~${estimatedCost.toLocaleString()})`);

  if (totalBalance < estimatedCost) {
    console.error(`Insufficient balance. Add ${estimatedCost - totalBalance} more sats.`);
    process.exit(1);
  }

  let currentSourceHex = bestUtxo.rawTxHex;
  let currentVout = bestUtxo.vout;

  console.log(`Starting UTXO: ${bestUtxo.txid}:${bestUtxo.vout} (${bestUtxo.satoshis} sats)`);
  console.log("");

  // ── Step 4: lock + unlock each contract ──────────────────────────────────
  console.log("-".repeat(70));
  console.log("  MAINNET BROADCAST (lock → unlock)");
  console.log("-".repeat(70));
  console.log("");

  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`${"─".repeat(60)}`);
    console.log(`  [${i + 1}/${testCases.length}] ${tc.name}`);
    console.log(`  Lock  : ${tc.lockASM.length > 80 ? tc.lockASM.slice(0, 77) + "…" : tc.lockASM}`);
    console.log(`  Unlock: ${tc.unlockASM.length > 60 ? tc.unlockASM.slice(0, 57) + "…" : tc.unlockASM}`);

    const result: TestResult = { name: tc.name, status: "FAIL" };
    let lockHex: string | null = null;

    try {
      // ── Lock TX ──
      const lockResult = await buildCustomLockTransaction(
        WIF, currentSourceHex, currentVout, tc.lockASM, LOCK_AMOUNT, FEE_RATE
      );
      lockHex = lockResult.hex;
      console.log(`  Lock TX : ${lockResult.txid}`);
      console.log(`            ${lockResult.size} bytes | fee ${lockResult.fee} sats`);

      result.lockTxid = await broadcastTransaction(lockResult.hex);
      console.log(`  Lock    : BROADCAST OK`);

      // Change output (index 1) becomes source for next test
      currentSourceHex = lockResult.hex;
      currentVout = 1;

      await sleep(DELAY_MS);

      // ── Unlock TX ──
      const unlockResult = await buildCustomUnlockTransaction(
        lockResult.hex, 0, tc.unlockASM, address, FEE_RATE
      );
      console.log(`  Unlock TX: ${unlockResult.txid}`);
      console.log(`             ${unlockResult.size} bytes | fee ${unlockResult.fee} sats`);

      result.unlockTxid = await broadcastTransaction(unlockResult.hex);
      console.log(`  Unlock  : BROADCAST OK`);

      result.status = "PASS";
      console.log(`  Result  : ✓ PASS`);
      await sleep(DELAY_MS);

    } catch (e: any) {
      result.status = "FAIL";
      result.error = e.message;
      console.log(`  Result  : ✗ FAIL — ${e.message}`);

      if (result.lockTxid && lockHex) {
        // Lock broadcast but unlock failed — chain continues via change output
        currentSourceHex = lockHex;
        currentVout = 1;
        console.log(`  Recovery: lock is broadcast, continuing from change output`);
        console.log(`            Locked UTXO at ${result.lockTxid}:0 needs manual recovery`);
      } else {
        // Lock itself failed — cannot continue the chain
        console.log(`  Recovery: lock failed, cannot continue chain`);
        results.push(result);
        break;
      }
    }

    results.push(result);
    console.log("");
  }

  // ── Step 5: summary ──────────────────────────────────────────────────────
  console.log("=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  for (const r of results) {
    const icon = r.status === "PASS" ? "✓" : "✗";
    console.log(`  ${icon} ${r.name}`);
    if (r.lockTxid)   console.log(`      Lock  : https://whatsonchain.com/tx/${r.lockTxid}`);
    if (r.unlockTxid) console.log(`      Unlock: https://whatsonchain.com/tx/${r.unlockTxid}`);
    if (r.error)      console.log(`      Error : ${r.error}`);
  }

  console.log("");
  console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${results.length}`);
  console.log("");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nFatal error:", e);
  process.exit(1);
});
