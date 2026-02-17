/**
 * Build R-puzzle lock + unlock transactions and optionally test broadcast.
 * Usage: npx tsx scripts/rpuzzle-tx-and-broadcast.ts [--broadcast]
 * Uses TEST_WIF env var or the key below (for testing only).
 */

const WIF = process.env.TEST_WIF ?? "L4WorgVk41cq9efKwcQwaHT3kZjzrXLwVAyLnkWmy52HSuF8wJAS";
const BROADCAST = process.argv.includes("--broadcast");

async function main() {
  const { importFromWif } = await import("../lib/bsv");
  const {
    generateRPuzzle,
    buildCustomLockTransaction,
    buildRPuzzleUnlockTransaction,
    broadcastTransaction,
  } = await import("../lib/script-playground");

  const { address } = importFromWif(WIF);
  const feeRate = 0.5;
  const lockAmountSatoshis = 700; // enough so unlock output after fee >= 546

  console.log("Address:", address);
  console.log("Fetching UTXOs...");

  const { fetchUtxosWithRawTx } = await import("../lib/bsv");
  const utxos = await fetchUtxosWithRawTx(address);
  if (utxos.length === 0) {
    console.error("No UTXOs. Fund the address first.");
    process.exit(1);
  }

  const minRequired = lockAmountSatoshis + 200; // lock + rough fee
  const utxo = utxos.find((u) => u.satoshis >= minRequired) ?? utxos.reduce((a, b) => (a.satoshis >= b.satoshis ? a : b));
  if (!utxo.rawTxHex) {
    console.error("Missing rawTxHex for UTXO");
    process.exit(1);
  }
  if (utxo.satoshis < minRequired) {
    console.error(`No UTXO with >= ${minRequired} sats. Largest: ${utxo.satoshis} sats.`);
    process.exit(1);
  }

  console.log("Using UTXO:", utxo.txid + ":" + utxo.vout, "satoshis:", utxo.satoshis);

  const rpuzzle = generateRPuzzle("raw");
  console.log("\n--- R-Puzzle generated ---");
  console.log("Locking ASM:", rpuzzle.lockingASM);

  console.log("\nBuilding lock transaction...");
  const lockResult = await buildCustomLockTransaction(
    WIF,
    utxo.rawTxHex,
    utxo.vout,
    rpuzzle.lockingASM,
    lockAmountSatoshis,
    feeRate
  );
  console.log("Lock txid:", lockResult.txid);
  console.log("Lock tx size:", lockResult.size, "bytes, fee:", lockResult.fee);

  console.log("\nBuilding unlock transaction...");
  const unlockResult = await buildRPuzzleUnlockTransaction(
    WIF,
    rpuzzle.kHex,
    "raw",
    lockResult.hex,
    0,
    address,
    feeRate
  );
  console.log("Unlock txid:", unlockResult.txid);

  if (BROADCAST) {
    console.log("\nBroadcasting lock tx...");
    const lockTxid = await broadcastTransaction(lockResult.hex);
    console.log("Lock tx broadcasted:", lockTxid);
    console.log("Broadcasting unlock tx...");
    const unlockTxid = await broadcastTransaction(unlockResult.hex);
    console.log("Unlock tx broadcasted:", unlockTxid);
  } else {
    console.log("\n(Skip broadcast: run with --broadcast to push to network)");
  }

  console.log("\n========== K VALUE (save this to unlock later) ==========");
  console.log(rpuzzle.kHex);
  console.log("==========================================================");
  console.log("\nLock tx hex (first 80 chars):", lockResult.hex.slice(0, 80) + "...");
  console.log("Unlock tx hex (first 80 chars):", unlockResult.hex.slice(0, 80) + "...");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
