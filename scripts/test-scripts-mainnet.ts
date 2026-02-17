/**
 * Comprehensive mainnet test for all Script Lab templates.
 *
 * For each testable template:
 *   1. Builds a locking transaction (custom script output)
 *   2. Broadcasts the lock TX
 *   3. Builds an unlocking transaction (spends the custom output)
 *   4. Broadcasts the unlock TX
 *   5. Reports results with TXIDs for on-chain verification
 *
 * Chains through change outputs so only one initial UTXO is needed.
 *
 * Run:  npx tsx scripts/test-scripts-mainnet.ts
 */

const WIF = "L4WorgVk41cq9efKwcQwaHT3kZjzrXLwVAyLnkWmy52HSuF8wJAS";
const FEE_RATE = 0.5;
const LOCK_AMOUNT = 700; // satoshis per lock output
const DELAY_MS = 500; // delay between broadcasts to avoid rate limits

// Templates that cannot be tested on mainnet
const SKIP_IDS = new Set([
  "always-fail",       // fails by design
  "anyone-can-spend",  // empty unlock not supported + risky
  "r-puzzle-raw",      // needs special RPuzzle handler (tested separately below)
  "nlock-time",        // educational (TX-level feature)
  "nsequence",         // educational (TX-level feature)
  "htlc-redeem",       // requires OP_CHECKSIG
  "htlc-refund",       // requires OP_CHECKSIG
  "escrow-release",    // requires OP_CHECKSIG
  "p2pkh",             // requires OP_CHECKSIG
  "p2pk",              // requires OP_CHECKSIG
  "multisig-1of2",     // requires OP_CHECKSIG
  "op-return",         // unspendable
  "op-return-multi",   // unspendable
  "op-push-tx",        // educational + requires TX context
]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: "PASS" | "FAIL" | "SKIP";
  lockTxid?: string;
  unlockTxid?: string;
  error?: string;
}

async function main() {
  const { PrivateKey } = await import("@bsv/sdk");
  const { importFromWif, fetchUtxosWithRawTx } = await import("../lib/bsv");
  const {
    TEMPLATES,
    buildCustomLockTransaction,
    buildCustomUnlockTransaction,
    buildRPuzzleUnlockTransaction,
    generateRPuzzle,
    broadcastTransaction,
    simulateScript,
  } = await import("../lib/script-playground");

  const priv = PrivateKey.fromWif(WIF);
  const { address } = importFromWif(WIF);

  console.log("=".repeat(70));
  console.log("  SAIBUN SCRIPT LAB — COMPREHENSIVE MAINNET TEST");
  console.log("=".repeat(70));
  console.log(`Address : ${address}`);
  console.log(`WIF     : ...${WIF.slice(-6)}`);
  console.log(`Fee rate: ${FEE_RATE} sat/byte`);
  console.log(`Lock amt: ${LOCK_AMOUNT} sats per template`);
  console.log("");

  // ── 1. Fetch UTXOs ────────────────────────────────────────────────────
  console.log("Fetching UTXOs...");
  const utxos = await fetchUtxosWithRawTx(address);

  if (utxos.length === 0) {
    console.error("No UTXOs found. Fund the address first.");
    process.exit(1);
  }

  const totalBalance = utxos.reduce((s, u) => s + u.satoshis, 0);
  console.log(`Found ${utxos.length} UTXO(s), total: ${totalBalance} sats (${(totalBalance / 1e8).toFixed(8)} BSV)`);

  // Filter testable templates
  const testable = TEMPLATES.filter((t) => {
    if (SKIP_IDS.has(t.id)) return false;
    if (t.requiresTxContext || t.educational) return false;
    if (t.lockingASM.includes("OP_RETURN")) return false;
    if (!t.unlockingASM || t.unlockingASM.includes("<")) return false;
    return true;
  });

  const estimatedCost = testable.length * (LOCK_AMOUNT + 200); // rough estimate
  console.log(`\nTestable templates: ${testable.length}`);
  console.log(`Estimated cost   : ~${estimatedCost} sats (~${(estimatedCost / 1e8).toFixed(8)} BSV)`);

  if (totalBalance < estimatedCost) {
    console.error(`\nInsufficient balance. Need ~${estimatedCost} sats, have ${totalBalance} sats.`);
    console.error(`Fund ${address} with at least ${estimatedCost} sats to run all tests.`);
    process.exit(1);
  }

  // Pick the largest UTXO to start the chain
  const startUtxo = utxos.reduce((a, b) => (a.satoshis > b.satoshis ? a : b));
  if (!startUtxo.rawTxHex) {
    console.error("Missing raw TX hex for UTXO. Cannot proceed.");
    process.exit(1);
  }

  console.log(`\nUsing UTXO: ${startUtxo.txid}:${startUtxo.vout} (${startUtxo.satoshis} sats)`);
  console.log("");

  // ── 2. Pre-validate all templates offline ──────────────────────────────
  console.log("-".repeat(70));
  console.log("  PHASE 1: OFFLINE VALIDATION");
  console.log("-".repeat(70));

  let offlinePass = 0;
  let offlineFail = 0;
  for (const t of testable) {
    try {
      const sim = simulateScript(t.lockingASM, t.unlockingASM);
      if (sim.valid) {
        console.log(`  [PASS] ${t.id} (${t.name}) — ${sim.steps.length} steps`);
        offlinePass++;
      } else {
        console.log(`  [FAIL] ${t.id} (${t.name}) — ${sim.error}`);
        offlineFail++;
      }
    } catch (e: any) {
      console.log(`  [FAIL] ${t.id} (${t.name}) — ${e.message}`);
      offlineFail++;
    }
  }
  console.log(`\nOffline: ${offlinePass} pass, ${offlineFail} fail\n`);

  // ── 3. Mainnet lock + unlock for each template ────────────────────────
  console.log("-".repeat(70));
  console.log("  PHASE 2: MAINNET BROADCAST (lock + unlock)");
  console.log("-".repeat(70));
  console.log("");

  let currentSourceHex = startUtxo.rawTxHex;
  let currentVout = startUtxo.vout;
  const results: TestResult[] = [];

  for (let i = 0; i < testable.length; i++) {
    const t = testable[i];
    const label = `[${i + 1}/${testable.length}] ${t.category} / ${t.name}`;
    console.log(`${"─".repeat(60)}`);
    console.log(`  ${label}`);
    console.log(`  Lock ASM : ${t.lockingASM.length > 80 ? t.lockingASM.slice(0, 77) + "..." : t.lockingASM}`);
    console.log(`  Unlock   : ${t.unlockingASM.length > 80 ? t.unlockingASM.slice(0, 77) + "..." : t.unlockingASM}`);

    const result: TestResult = {
      id: t.id,
      name: t.name,
      category: t.category,
      status: "FAIL",
    };

    let lockResultHex: string | null = null;

    try {
      // ── Lock TX ──
      const lockResult = await buildCustomLockTransaction(
        WIF,
        currentSourceHex,
        currentVout,
        t.lockingASM,
        LOCK_AMOUNT,
        FEE_RATE
      );
      lockResultHex = lockResult.hex;
      console.log(`  Lock TX  : ${lockResult.txid}`);
      console.log(`             ${lockResult.size} bytes, fee: ${lockResult.fee} sats`);

      // Broadcast lock TX
      const lockBroadcastTxid = await broadcastTransaction(lockResult.hex);
      console.log(`  Lock     : BROADCAST OK (${lockBroadcastTxid})`);
      result.lockTxid = lockBroadcastTxid;

      // Update chain immediately — change output at index 1 is always P2PKH
      currentSourceHex = lockResult.hex;
      currentVout = 1;

      await sleep(DELAY_MS);

      // ── Unlock TX ──
      const unlockResult = await buildCustomUnlockTransaction(
        lockResult.hex,
        0, // custom lock output is always at index 0
        t.unlockingASM,
        address,
        FEE_RATE
      );
      console.log(`  Unlock TX: ${unlockResult.txid}`);
      console.log(`             ${unlockResult.size} bytes, fee: ${unlockResult.fee} sats`);

      // Broadcast unlock TX
      const unlockBroadcastTxid = await broadcastTransaction(unlockResult.hex);
      console.log(`  Unlock   : BROADCAST OK (${unlockBroadcastTxid})`);
      result.unlockTxid = unlockBroadcastTxid;

      result.status = "PASS";
      console.log(`  Result   : ✓ PASS`);

      await sleep(DELAY_MS);
    } catch (e: any) {
      result.status = "FAIL";
      result.error = e.message;
      console.log(`  Result   : ✗ FAIL — ${e.message}`);

      if (result.lockTxid && lockResultHex) {
        // Lock was broadcast but unlock failed.
        // Chain continues via the change output (index 1) which is still spendable.
        console.log(`  Recovery : Lock was broadcast, chain continues via change output.`);
        console.log(`             Locked funds at ${result.lockTxid}:0 need manual recovery.`);
        currentSourceHex = lockResultHex;
        currentVout = 1;
      } else {
        // Lock itself failed — cannot continue chain
        console.log(`  Recovery : Lock failed. Cannot continue chain.`);
        console.log(`             Remaining ${testable.length - i - 1} tests will be skipped.`);
        results.push(result);
        for (let j = i + 1; j < testable.length; j++) {
          results.push({
            id: testable[j].id,
            name: testable[j].name,
            category: testable[j].category,
            status: "SKIP",
            error: "Chain broken by previous failure",
          });
        }
        break;
      }
    }

    results.push(result);
    console.log("");
  }

  // ── 4. R-Puzzle test (special handling) ───────────────────────────────
  console.log(`${"─".repeat(60)}`);
  console.log("  R-Puzzle Test (special handler)");

  const rpuzzleResult: TestResult = {
    id: "r-puzzle-raw",
    name: "R-Puzzle (raw)",
    category: "R-Puzzle",
    status: "FAIL",
  };

  try {
    // Generate a fresh R-Puzzle
    const rpuzzle = generateRPuzzle("raw");
    console.log(`  Lock ASM : ${rpuzzle.lockingASM}`);

    // Build lock TX
    const lockResult = await buildCustomLockTransaction(
      WIF,
      currentSourceHex,
      currentVout,
      rpuzzle.lockingASM,
      LOCK_AMOUNT,
      FEE_RATE
    );
    console.log(`  Lock TX  : ${lockResult.txid}`);

    const lockBroadcastTxid = await broadcastTransaction(lockResult.hex);
    console.log(`  Lock     : BROADCAST OK (${lockBroadcastTxid})`);
    rpuzzleResult.lockTxid = lockBroadcastTxid;

    await sleep(DELAY_MS);

    // Build R-Puzzle unlock TX (uses special handler with K value)
    const unlockResult = await buildRPuzzleUnlockTransaction(
      WIF,
      rpuzzle.kHex,
      "raw",
      lockResult.hex,
      0,
      address,
      FEE_RATE
    );
    console.log(`  Unlock TX: ${unlockResult.txid}`);

    const unlockBroadcastTxid = await broadcastTransaction(unlockResult.hex);
    console.log(`  Unlock   : BROADCAST OK (${unlockBroadcastTxid})`);
    rpuzzleResult.unlockTxid = unlockBroadcastTxid;
    rpuzzleResult.status = "PASS";
    console.log(`  Result   : ✓ PASS`);

    currentSourceHex = lockResult.hex;
    currentVout = 1;
  } catch (e: any) {
    rpuzzleResult.status = "FAIL";
    rpuzzleResult.error = e.message;
    console.log(`  Result   : ✗ FAIL — ${e.message}`);
  }
  results.push(rpuzzleResult);

  // ── 5. Summary ────────────────────────────────────────────────────────
  console.log("");
  console.log("=".repeat(70));
  console.log("  RESULTS SUMMARY");
  console.log("=".repeat(70));
  console.log("");

  const passed = results.filter((r) => r.status === "PASS");
  const failed = results.filter((r) => r.status === "FAIL");
  const skipped = results.filter((r) => r.status === "SKIP");

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    console.log(`  ${cat}:`);
    for (const r of catResults) {
      const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "○";
      const txInfo = r.lockTxid ? ` [lock: ${r.lockTxid.slice(0, 12)}...]` : "";
      const unlockInfo = r.unlockTxid ? ` [unlock: ${r.unlockTxid.slice(0, 12)}...]` : "";
      const errInfo = r.error ? ` — ${r.error.slice(0, 60)}` : "";
      console.log(`    ${icon} ${r.status.padEnd(4)} ${r.name}${txInfo}${unlockInfo}${errInfo}`);
    }
    console.log("");
  }

  console.log("-".repeat(70));
  console.log(`  PASSED : ${passed.length}`);
  console.log(`  FAILED : ${failed.length}`);
  console.log(`  SKIPPED: ${skipped.length}`);
  console.log(`  TOTAL  : ${results.length}`);
  console.log("-".repeat(70));

  if (passed.length > 0) {
    console.log(`\n  Verify on-chain: https://bitails.io/tx/<txid>`);
  }

  console.log("");
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
