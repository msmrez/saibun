/**
 * Debug R-puzzle transaction validation issue
 */

import { Transaction, PrivateKey, BigNumber, RPuzzle } from "@bsv/sdk";

const spendingTxHex =
  "0100000001e4738d8b4ca946aebb42964815140e1040a25dd7c157379fc067d1e46c0cc174000000006b4830450221008da0c203dcae2f9c949560f7bd933d1a90e1722e1943f5cd3131f9dacbdf2bc002203052974b9ccfdd06b47f2b93f41f71b55b278416790440d20b35a42b69252fa0412102ae912ff4cf65d91f8174fc8620ea4c627fb9ae282a915ff2fa3dd31044971177ffffffff01a2030000000000001976a9140a37274e86e8e60ad1b5ce1be5f203594462c49488ac00000000";
const sourceTxHex =
  "0100000001890cc2eb725fecc150192f0b8997075441932c6c75e84b0fb62e6a9c4e726d16020000006a473044022046f16fbdc20258f1e9575622585f2423c85cf6e80f7d0a51376e3a0768b5996c02203a0264bd103e6ef4ab6763593fbc0336b6ecc5fee79bc8ebbef5efcc480876cd412102ae912ff4cf65d91f8174fc8620ea4c627fb9ae282a915ff2fa3dd31044971177ffffffff01b6030000000000002c78537f77517f7c7f75208da0c203dcae2f9c949560f7bd933d1a90e1722e1943f5cd3131f9dacbdf2bc088ac00000000";
const kHex = "58a537009cfb0f2312073f7d09032e24e33d11ffe6f37ad5a15197ba9da63dde";

async function main() {
  const spendingTx = Transaction.fromHex(spendingTxHex);
  const sourceTx = Transaction.fromHex(sourceTxHex);

  console.log("=== Transaction Analysis ===\n");
  console.log("Spending TXID:", spendingTx.id("hex"));
  console.log("Source TXID:", sourceTx.id("hex"));
  console.log("Source output 0 satoshis:", sourceTx.outputs[0].satoshis);
  console.log("Spending output 0 satoshis:", spendingTx.outputs[0].satoshis);
  console.log(
    "Source lock script:",
    sourceTx.outputs[0].lockingScript.toASM()
  );
  console.log(
    "Spending unlock script:",
    spendingTx.inputs[0].unlockingScript?.toASM()
  );

  // Derive expected R from K
  const kAsKey = PrivateKey.fromHex(kHex);
  const pubKey = kAsKey.toPublicKey();
  const compressed = pubKey.encode(true) as number[];
  const rBytes = compressed.slice(1); // Skip 0x02/0x03 prefix
  const rHex = rBytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  console.log("\n=== R Value Check ===\n");
  console.log("Expected R (from K):", rHex);

  // Extract R from signature in spending transaction
  const unlockScriptHex =
    spendingTx.inputs[0].unlockingScript?.toHex() ?? "";
  // Signature is first part (DER encoded)
  // Format: 30 [total_len] 45 [r_marker] 02 21 [r_len] [r] 02 20 [s_len] [s] [sighash]
  const sigStart = unlockScriptHex.indexOf("30");
  if (sigStart === -1) {
    console.error("Could not find signature in unlock script");
    return;
  }

  const sigHex = unlockScriptHex.substring(sigStart, sigStart + 144); // Approx length
  console.log("Signature hex:", sigHex);

  // Parse DER signature to extract R
  const sigBytes = Buffer.from(sigHex, "hex");
  // DER layout: 30 [seq_len] 02 [r_len] [r_bytes…]
  // sigBytes[3] = r_len, sigBytes[4] = first byte of R
  let offset = 3;
  const rLen = sigBytes[offset];
  offset++;
  const rWithPadding = Array.from(sigBytes.slice(offset, offset + rLen));
  // Remove leading zero padding
  const rActual =
    rWithPadding[0] === 0 ? rWithPadding.slice(1) : rWithPadding;
  const rFromSigHex = rActual
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  console.log("R from signature:", rFromSigHex);
  console.log("R matches:", rHex.toLowerCase() === rFromSigHex.toLowerCase());

  // Now rebuild the transaction correctly
  console.log("\n=== Rebuilding Transaction ===\n");
  const kBN = BigNumber.fromHex(kHex);
  const rpuzzle = new RPuzzle("raw");
  const anyPrivateKey = PrivateKey.fromRandom(); // Any key works for R-puzzle

  const unlockTemplate = rpuzzle.unlock(kBN, anyPrivateKey, "all", false);

  const rebuiltTx = new Transaction(1, [], [], 0);
  rebuiltTx.addInput({
    sourceTXID: sourceTx.id("hex"),
    sourceOutputIndex: 0,
    unlockingScriptTemplate: unlockTemplate,
    sequence: 0xffffffff,
  });

  rebuiltTx.addOutput({
    lockingScript: spendingTx.outputs[0].lockingScript,
    satoshis: 930,
  });

  // Set source transaction for signing
  rebuiltTx.inputs[0].sourceTransaction = sourceTx;

  // Sign
  const unlockScript = await unlockTemplate.sign(rebuiltTx, 0);
  rebuiltTx.inputs[0].unlockingScript = unlockScript;

  console.log("Rebuilt TXID:", rebuiltTx.id("hex"));
  console.log("Rebuilt hex:", rebuiltTx.toHex());
  console.log("Rebuilt unlock script ASM:", unlockScript.toASM());

  // Compare
  console.log("\n=== Comparison ===\n");
  console.log("Original TXID:", spendingTx.id("hex"));
  console.log("Rebuilt TXID:", rebuiltTx.id("hex"));
  console.log("TXIDs match:", spendingTx.id("hex") === rebuiltTx.id("hex"));
  console.log(
    "Original unlock:",
    spendingTx.inputs[0].unlockingScript?.toASM()
  );
  console.log("Rebuilt unlock:", unlockScript.toASM());
}

main().catch(console.error);
