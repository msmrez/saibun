import {
  Script,
  LockingScript,
  UnlockingScript,
  Spend,
  PrivateKey,
  Transaction,
  P2PKH,
  RPuzzle,
  BigNumber,
  Hash,
  OP,
  type TransactionInput,
  type TransactionOutput,
} from "@bsv/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaygroundTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  lockingASM: string;
  unlockingASM: string;
  note?: string;
  /** Related templates share a group (e.g., htlc-redeem + htlc-refund) */
  group?: string;
  /** Script uses OP_CHECKSIG — needs real TX context to validate */
  requiresTxContext?: boolean;
  /** Conceptual template — demonstrates TX-level features or disabled opcodes; won't validate meaningfully in playground */
  educational?: boolean;
  /** Transaction Builder shows interactive parameter UI instead of raw ASM */
  interactiveConfig?: "hash-puzzle" | "r-puzzle" | "alt-stack";
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  lockingHex: string;
  unlockingHex: string;
  lockingSize: number;
  unlockingSize: number;
  finalStack: string[];
}

export interface OpcodeEntry {
  name: string;
  desc: string;
}

export interface OpcodeCategory {
  category: string;
  opcodes: OpcodeEntry[];
}

export interface BuildTransactionResult {
  txid: string;
  hex: string;
  size: number;
  fee: number;
  feeRate: number;
}

export interface RPuzzleGenerationResult {
  kHex: string;
  rHex: string;
  lockingASM: string;
  lockingHex: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Script helpers
// ---------------------------------------------------------------------------

/**
 * Convert hex script to ASM format
 */
export function hexToASM(hex: string): string {
  const cleaned = hex.replace(/\s/g, "");
  if (!cleaned || cleaned.length % 2 !== 0) {
    throw new Error("Invalid hex: must be even length");
  }
  try {
    const script = Script.fromHex(cleaned);
    return script.toASM();
  } catch (e) {
    throw new Error(`Failed to parse hex: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Detect if input is hex (vs ASM) and convert if needed
 */
export function detectAndConvertToASM(input: string): { asm: string; wasHex: boolean } {
  const trimmed = input.trim();
  if (!trimmed) return { asm: "", wasHex: false };
  
  // Check if it looks like hex (only hex chars, even length, reasonable length)
  const hexPattern = /^[0-9a-fA-F\s]+$/;
  const cleaned = trimmed.replace(/\s/g, "");
  
  // If it's pure hex and even length and not too short, try to convert
  if (hexPattern.test(trimmed) && cleaned.length % 2 === 0 && cleaned.length >= 2) {
    try {
      const asm = hexToASM(cleaned);
      return { asm, wasHex: true };
    } catch {
      // If conversion fails, treat as ASM
      return { asm: trimmed, wasHex: false };
    }
  }
  
  return { asm: trimmed, wasHex: false };
}

/**
 * Normalise human-readable opcode aliases that the BSV SDK doesn't register
 * by those names.  The underlying opcode bytes are identical; only the name
 * the SDK uses in its OP table differs.
 *
 * IMPORTANT — BSV Genesis upgrade (Feb 4 2020):
 *   OP_CHECKLOCKTIMEVERIFY (0xB1) was REVERTED TO A NOP (OP_NOP2) for all
 *   UTXOs created after Genesis activation.  It is purely a no-op on BSV
 *   today — time-locks are NOT enforced at the Script level.  The only
 *   available time constraint is nLockTime on the spending TX (miner-soft,
 *   not script-hard).  OP_CHECKSEQUENCEVERIFY (0xB2) was similarly reverted
 *   to OP_NOP3.  See CLAUDE.md § "BSV Opcode Reference" for full details.
 */
function normalizeOpcodeAliases(asm: string): string {
  return asm
    .replace(/\bOP_CHECKLOCKTIMEVERIFY\b/g, "OP_NOP2")
    .replace(/\bOP_CHECKSEQUENCEVERIFY\b/g, "OP_NOP3");
}

export function asmToLockingScript(asm: string): LockingScript {
  const trimmed = normalizeOpcodeAliases(asm.trim());
  if (!trimmed) return new LockingScript();
  const parsed = Script.fromASM(trimmed);
  return new LockingScript(parsed.chunks);
}

export function asmToUnlockingScript(asm: string): UnlockingScript {
  const trimmed = normalizeOpcodeAliases(asm.trim());
  if (!trimmed) return new UnlockingScript();
  const parsed = Script.fromASM(trimmed);
  return new UnlockingScript(parsed.chunks);
}

function formatStackItem(item: number[]): string {
  if (!item || item.length === 0) return "(empty)";
  return item.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Text / hex conversion helpers
// ---------------------------------------------------------------------------

/** Convert plain text to hex string. "hello" → "68656c6c6f" */
export function textToHex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Convert hex string to plain text. "68656c6c6f" → "hello" */
export function hexToText(hex: string): string {
  const clean = hex.replace(/\s/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Check if a string is valid hex */
export function isHex(str: string): boolean {
  return /^[0-9a-fA-F]*$/.test(str.replace(/\s/g, "")) && str.replace(/\s/g, "").length % 2 === 0;
}

/**
 * Build a hash puzzle locking script from a preimage (hex or text) and hash type.
 * Returns the locking ASM and the preimage hex (for the unlocking script).
 */
export function buildHashPuzzleLock(
  preimage: string,
  isPreimageHex: boolean,
  hashType: "SHA256" | "HASH160" | "HASH256" | "RIPEMD160" | "SHA1"
): { lockingASM: string; preimageHex: string; hashHex: string } {
  const preimageHex = isPreimageHex ? preimage.replace(/\s/g, "") : textToHex(preimage);
  if (!preimageHex) throw new Error("Preimage cannot be empty");
  const hashHex = computeHash(preimageHex, hashType);
  const opName = `OP_${hashType}`;
  return {
    lockingASM: `${opName} ${hashHex} OP_EQUAL`,
    preimageHex,
    hashHex,
  };
}

// ---------------------------------------------------------------------------
// Hash computation helpers
// ---------------------------------------------------------------------------

export function computeHash(
  data: string | number[],
  hashType: "SHA256" | "HASH160" | "HASH256" | "RIPEMD160" | "SHA1"
): string {
  let bytes: number[];
  if (typeof data === "string") {
    // Hex string
    bytes = [];
    const clean = data.replace(/\s/g, "");
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }
  } else {
    bytes = data;
  }

  let result: number[];
  switch (hashType) {
    case "SHA256":
      result = Array.from(Hash.sha256(bytes));
      break;
    case "HASH160":
      result = Array.from(Hash.hash160(bytes));
      break;
    case "HASH256":
      result = Array.from(Hash.hash256(bytes));
      break;
    case "RIPEMD160":
      result = Array.from(Hash.ripemd160(bytes));
      break;
    case "SHA1":
      result = Array.from(Hash.sha1(bytes));
      break;
    default:
      throw new Error(`Unknown hash type: ${hashType}`);
  }

  return result.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// R-Puzzle generation
// ---------------------------------------------------------------------------
//
// R-puzzle locks funds to "whoever can produce an ECDSA signature with a specific R".
// In ECDSA, R = x-coordinate of (k*G) where k is the signer's nonce. So only someone
// who knows k can produce a signature with that R.
//
// Why the lock script uses a signature + OP_CHECKSIG:
// 1. R lives inside a real signature — the only way to get that R on the stack is to
//    sign with the correct nonce K. So the puzzle is "prove you know K".
// 2. OP_CHECKSIG verifies the signature against the current spending transaction. So
//    the signature must be over *this* tx, not a reused one — that binds the solution
//    to this spend and prevents replay. The public key in the unlock script can be
//    any key; the lock does not restrict which key, only that (sig, pubkey) is valid
//    and that sig's R matches the committed R.

export function generateRPuzzle(
  type: "raw" | "SHA1" | "SHA256" | "HASH256" | "RIPEMD160" | "HASH160" = "raw"
): RPuzzleGenerationResult {
  // Generate random K value
  const kKey = PrivateKey.fromRandom();
  const kHex = kKey.toHex();

  // Extract R value from public key (x-coordinate)
  const pubKey = kKey.toPublicKey();
  const compressed = pubKey.encode(true) as number[];
  const rBytes = compressed.slice(1); // Skip 0x02/0x03 prefix
  const rHex = rBytes.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Create locking script
  const rpuzzle = new RPuzzle(type);
  let lockBytes: number[];
  if (type === "raw") {
    lockBytes = rBytes;
  } else {
    // Hash the R value
    let rHash: number[];
    switch (type) {
      case "SHA1":
        rHash = Hash.sha1(rBytes) as number[];
        break;
      case "SHA256":
        rHash = Hash.sha256(rBytes) as number[];
        break;
      case "HASH256":
        rHash = Hash.hash256(rBytes) as number[];
        break;
      case "RIPEMD160":
        rHash = Hash.ripemd160(rBytes) as number[];
        break;
      case "HASH160":
        rHash = Hash.hash160(rBytes) as number[];
        break;
      default:
        rHash = rBytes;
    }
    lockBytes = rHash;
  }

  const lockScript = rpuzzle.lock(lockBytes);
  const lockASM = lockScript.toASM();
  const lockHex = lockScript.toHex();

  const typeName =
    type === "raw"
      ? "raw R value"
      : type === "HASH160"
        ? "HASH160(R)"
        : `${type}(R)`;

  return {
    kHex,
    rHex,
    lockingASM: lockASM,
    lockingHex: lockHex,
    note: `K value: ${kHex.substring(0, 16)}... (save this to unlock!). R value: ${rHex.substring(0, 16)}... Locked to ${typeName}.`,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateScript(
  lockingASM: string,
  unlockingASM: string
): ValidationResult {
  let lockScript: LockingScript;
  let unlockScript: UnlockingScript;

  // Parse locking script
  try {
    lockScript = asmToLockingScript(lockingASM);
  } catch (e) {
    return {
      valid: false,
      error: `Locking script parse error: ${e instanceof Error ? e.message : String(e)}`,
      lockingHex: "",
      unlockingHex: "",
      lockingSize: 0,
      unlockingSize: 0,
      finalStack: [],
    };
  }

  // Parse unlocking script
  try {
    unlockScript = asmToUnlockingScript(unlockingASM);
  } catch (e) {
    return {
      valid: false,
      error: `Unlocking script parse error: ${e instanceof Error ? e.message : String(e)}`,
      lockingHex: lockScript.toHex(),
      unlockingHex: "",
      lockingSize: lockScript.toBinary().length,
      unlockingSize: 0,
      finalStack: [],
    };
  }

  const lockingHex = lockScript.toHex();
  const unlockingHex = unlockScript.toHex();
  const lockingSize = lockScript.toBinary().length;
  const unlockingSize = unlockScript.toBinary().length;

  // Validate via Spend interpreter
  try {
    const spend = new Spend({
      sourceTXID:
        "0000000000000000000000000000000000000000000000000000000000000000",
      sourceOutputIndex: 0,
      sourceSatoshis: 100000,
      lockingScript: lockScript,
      transactionVersion: 1,
      otherInputs: [],
      outputs: [],
      inputIndex: 0,
      unlockingScript: unlockScript,
      inputSequence: 0xffffffff,
      lockTime: 0,
    });

    const valid = spend.validate();

    // Read final stack - stack is a public property
    let finalStack: string[] = [];
    try {
      if (Array.isArray(spend.stack)) {
        finalStack = spend.stack.map((item: number[]) => formatStackItem(item));
      }
    } catch {
      // Stack access failed — not critical
    }

    return { valid, lockingHex, unlockingHex, lockingSize, unlockingSize, finalStack };
  } catch (e) {
    // Try to read stack even on failure
    let finalStack: string[] = [];
    try {
      const spend = new Spend({
        sourceTXID:
          "0000000000000000000000000000000000000000000000000000000000000000",
        sourceOutputIndex: 0,
        sourceSatoshis: 100000,
        lockingScript: lockScript,
        transactionVersion: 1,
        otherInputs: [],
        outputs: [],
        inputIndex: 0,
        unlockingScript: unlockScript,
        inputSequence: 0xffffffff,
        lockTime: 0,
      });
      if (Array.isArray(spend.stack)) {
        finalStack = spend.stack.map((item: number[]) => formatStackItem(item));
      }
    } catch {
      // Ignore
    }

    return {
      valid: false,
      error: e instanceof Error ? e.message : String(e),
      lockingHex,
      unlockingHex,
      lockingSize,
      unlockingSize,
      finalStack,
    };
  }
}

/**
 * Validate that a specific input in a spending transaction correctly spends the
 * designated output in the source transaction, using the FULL transaction context
 * (required for scripts containing OP_CHECKSIG — the signature commits to the
 * spending transaction's hash, so a dummy tx context would fail).
 */
export function validateTransactionSpend(
  sourceTxHex: string,
  spendingTxHex: string,
  sourceOutputIndex: number = 0,
  spendingInputIndex: number = 0
): ValidationResult {
  let sourceTx: Transaction;
  let spendingTx: Transaction;
  try {
    sourceTx = Transaction.fromHex(sourceTxHex.trim());
  } catch (e) {
    return { valid: false, error: `Source TX parse error: ${e instanceof Error ? e.message : String(e)}`, lockingHex: "", unlockingHex: "", lockingSize: 0, unlockingSize: 0, finalStack: [] };
  }
  try {
    spendingTx = Transaction.fromHex(spendingTxHex.trim());
  } catch (e) {
    return { valid: false, error: `Spending TX parse error: ${e instanceof Error ? e.message : String(e)}`, lockingHex: "", unlockingHex: "", lockingSize: 0, unlockingSize: 0, finalStack: [] };
  }

  if (sourceOutputIndex >= sourceTx.outputs.length) {
    return { valid: false, error: `Source output index ${sourceOutputIndex} out of range (tx has ${sourceTx.outputs.length} outputs).`, lockingHex: "", unlockingHex: "", lockingSize: 0, unlockingSize: 0, finalStack: [] };
  }
  if (spendingInputIndex >= spendingTx.inputs.length) {
    return { valid: false, error: `Spending input index ${spendingInputIndex} out of range (tx has ${spendingTx.inputs.length} inputs).`, lockingHex: "", unlockingHex: "", lockingSize: 0, unlockingSize: 0, finalStack: [] };
  }

  const sourceOutput = sourceTx.outputs[sourceOutputIndex];
  const spendingInput = spendingTx.inputs[spendingInputIndex];
  const lockScript = sourceOutput.lockingScript;
  const unlockScript = spendingInput.unlockingScript;

  if (!unlockScript) {
    return { valid: false, error: "Spending input has no unlocking script.", lockingHex: lockScript.toHex(), unlockingHex: "", lockingSize: lockScript.toBinary().length, unlockingSize: 0, finalStack: [] };
  }

  const sourceSatoshis =
    typeof sourceOutput.satoshis === "bigint"
      ? Number(sourceOutput.satoshis)
      : (sourceOutput.satoshis as number) ?? 0;

  const lockingHex = lockScript.toHex();
  const unlockingHex = unlockScript.toHex();
  const lockingSize = lockScript.toBinary().length;
  const unlockingSize = unlockScript.toBinary().length;

  // Build the other inputs (for SIGHASH computation — BSV uses SIGHASH_FORKID)
  const otherInputs: TransactionInput[] = spendingTx.inputs
    .filter((_, i) => i !== spendingInputIndex)
    .map((inp) => ({
      sourceTXID: inp.sourceTXID ?? "0".repeat(64),
      sourceOutputIndex: inp.sourceOutputIndex ?? 0,
      sequence: inp.sequence ?? 0xffffffff,
      unlockingScript: inp.unlockingScript,
    }));

  const outputs: TransactionOutput[] = spendingTx.outputs.map((out) => ({
    lockingScript: out.lockingScript,
    satoshis:
      typeof out.satoshis === "bigint"
        ? Number(out.satoshis)
        : (out.satoshis as number) ?? 0,
  }));

  try {
    const spend = new Spend({
      sourceTXID: sourceTx.id("hex") as string,
      sourceOutputIndex,
      sourceSatoshis,
      lockingScript: lockScript,
      transactionVersion: spendingTx.version ?? 1,
      otherInputs,
      outputs,
      inputIndex: spendingInputIndex,
      unlockingScript: unlockScript,
      inputSequence: spendingInput.sequence ?? 0xffffffff,
      lockTime: spendingTx.lockTime ?? 0,
    });

    const valid = spend.validate();
    let finalStack: string[] = [];
    try {
      if (Array.isArray(spend.stack)) {
        finalStack = spend.stack.map((item: number[]) => formatStackItem(item));
      }
    } catch { /* not critical */ }
    return { valid, lockingHex, unlockingHex, lockingSize, unlockingSize, finalStack };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e), lockingHex, unlockingHex, lockingSize, unlockingSize, finalStack: [] };
  }
}

// ---------------------------------------------------------------------------
// Hex preview (parse-only, no validation)
// ---------------------------------------------------------------------------

export function scriptHexPreview(asm: string): {
  hex: string;
  size: number;
  error?: string;
} {
  const trimmed = asm.trim();
  if (!trimmed) return { hex: "", size: 0 };
  try {
    const parsed = Script.fromASM(trimmed);
    const hex = parsed.toHex();
    return { hex, size: parsed.toBinary().length };
  } catch (e) {
    return {
      hex: "",
      size: 0,
      error: e instanceof Error ? e.message : "Invalid ASM",
    };
  }
}

// ---------------------------------------------------------------------------
// Broadcast transaction
// ---------------------------------------------------------------------------

/**
 * Broadcast a transaction to the BSV network using Bitails API.
 * Only returns when the API confirms with a txid; otherwise throws.
 */
export async function broadcastTransaction(hex: string): Promise<string> {
  // Bitails API: POST body with "raw" key, returns { "txid": "..." }
  const response = await fetch("https://api.bitails.io/tx/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw: hex }),
  });

  const text = await response.text();
  let result: Record<string, unknown>;
  try {
    result = JSON.parse(text) as Record<string, unknown>;
  } catch {
    if (!response.ok) throw new Error(`Broadcast failed: ${text || response.statusText}`);
    throw new Error("Broadcast failed: invalid response from server.");
  }

  if (!response.ok) {
    const msg = (result.error ?? result.message ?? result.msg ?? text) as string | undefined;
    throw new Error(msg ? `Broadcast failed: ${msg}` : `Broadcast failed: ${response.status} ${response.statusText}`);
  }

  const err = result.error ?? result.message ?? result.msg;
  if (err != null && typeof err === "string" && err.toLowerCase().includes("reject")) {
    throw new Error(`Broadcast rejected: ${err}`);
  }

  const txid = result.txid ?? result.txId ?? result.hash ?? result.id;
  if (txid != null && typeof txid === "string" && txid.length > 0) return txid;
  throw new Error(
    "Broadcast response did not include a transaction ID. The transaction may not have been broadcast. Try an explorer or another broadcast endpoint."
  );
}

/**
 * Extract locking script from a transaction output
 */
export function extractLockingScriptFromTx(txHex: string, outputIndex: number): { asm: string; hex: string } {
  const tx = Transaction.fromHex(txHex.trim());
  if (outputIndex >= tx.outputs.length) {
    throw new Error(`Output index ${outputIndex} out of range. Transaction has ${tx.outputs.length} outputs.`);
  }
  const output = tx.outputs[outputIndex];
  const script = output.lockingScript;
  return {
    asm: script.toASM(),
    hex: script.toHex(),
  };
}

/**
 * Extract unlocking script from a transaction input
 */
export function extractUnlockingScriptFromTx(txHex: string, inputIndex: number): { asm: string; hex: string } | null {
  const tx = Transaction.fromHex(txHex.trim());
  if (inputIndex >= tx.inputs.length) {
    throw new Error(`Input index ${inputIndex} out of range. Transaction has ${tx.inputs.length} inputs.`);
  }
  const input = tx.inputs[inputIndex];
  const script = input.unlockingScript;
  if (!script) return null;
  return {
    asm: script.toASM(),
    hex: script.toHex(),
  };
}

/**
 * Get the TXID of a raw transaction hex.
 */
export function parseTxIdFromHex(txHex: string): string {
  const tx = Transaction.fromHex(txHex.trim());
  return tx.id("hex") as string;
}

// ---------------------------------------------------------------------------
// Transaction builders
// ---------------------------------------------------------------------------

/**
 * Build a transaction that locks funds to a custom script.
 * User provides: private key (WIF), source UTXO, locking script ASM, amount, fee rate.
 */
export async function buildCustomLockTransaction(
  privateKeyWif: string,
  sourceTxHex: string,
  sourceVout: number,
  lockingScriptASM: string,
  lockAmountSatoshis: number,
  feeRateSatPerByte: number,
  changeAddress?: string
): Promise<BuildTransactionResult> {
  const privateKey = PrivateKey.fromWif(privateKeyWif);
  const p2pkh = new P2PKH();

  // Parse source transaction
  const sourceTx = Transaction.fromHex(sourceTxHex.trim());

  if (sourceVout >= sourceTx.outputs.length) {
    throw new Error(
      `Invalid output index ${sourceVout}. Transaction has ${sourceTx.outputs.length} outputs.`
    );
  }

  const sourceOutput = sourceTx.outputs[sourceVout];
  const sourceSatoshis =
    typeof sourceOutput.satoshis === "bigint"
      ? Number(sourceOutput.satoshis)
      : (sourceOutput.satoshis as number);

  // Ensure the source UTXO is P2PKH and pays to the key we're using (avoids "equal verify failed" on broadcast)
  const sourceLock = sourceOutput.lockingScript;
  const chunks = sourceLock.chunks;
  const isP2PKH =
    chunks.length >= 5 &&
    chunks[0].op === OP.OP_DUP &&
    chunks[1].op === OP.OP_HASH160 &&
    typeof chunks[2].op === "number" &&
    chunks[2].op === 20 &&
    Array.isArray(chunks[2].data) &&
    (chunks[2].data as number[]).length === 20 &&
    chunks[3].op === OP.OP_EQUALVERIFY &&
    chunks[4].op === OP.OP_CHECKSIG;
  if (!isP2PKH) {
    throw new Error(
      "The source UTXO must be a standard P2PKH output (pay-to-address). The selected output is not P2PKH. Use a normal spendable UTXO that pays to your address."
    );
  }
  const sourcePubkeyHash = chunks[2].data as number[];
  const ourPubkeyHash = Array.from(
    Hash.hash160(privateKey.toPublicKey().encode(true) as number[])
  );
  const hashMatch =
    sourcePubkeyHash.length === ourPubkeyHash.length &&
    sourcePubkeyHash.every((b, i) => b === ourPubkeyHash[i]);
  if (!hashMatch) {
    throw new Error(
      "The source UTXO does not pay to the address of the private key you entered. You can only spend outputs that belong to this key. Check that the source transaction hex and output index (vout) are correct — use the tx that sent funds TO your address, and the vout of the output that pays you."
    );
  }

  // Parse locking script
  const customLockScript = asmToLockingScript(lockingScriptASM);
  const customLockSize = customLockScript.toBinary().length;

  // Estimate transaction size
  const P2PKH_INPUT_SIZE = 148;
  const P2PKH_OUTPUT_SIZE = 34;
  const TX_OVERHEAD = 10;
  const hasChange = sourceSatoshis > lockAmountSatoshis;

  let estimatedSize =
    TX_OVERHEAD +
    P2PKH_INPUT_SIZE +
    customLockSize +
    8 + // satoshis for custom output
    1 + // varint for output count
    (hasChange ? P2PKH_OUTPUT_SIZE : 0);

  const estimatedFee = Math.ceil(estimatedSize * feeRateSatPerByte);
  const change = sourceSatoshis - lockAmountSatoshis - estimatedFee;

  if (change < 0) {
    throw new Error(
      `Insufficient funds. Need ${lockAmountSatoshis + estimatedFee} sats, have ${sourceSatoshis} sats.`
    );
  }

  // Build transaction
  const inputs: TransactionInput[] = [
    {
      sourceTransaction: sourceTx,
      sourceOutputIndex: sourceVout,
      unlockingScriptTemplate: p2pkh.unlock(privateKey),
      sequence: 0xffffffff,
    },
  ];

  const outputs: TransactionOutput[] = [
    {
      lockingScript: customLockScript,
      satoshis: lockAmountSatoshis,
    },
  ];

  // Add change output if needed
  if (change > 546) {
    // Dust threshold
    const changeAddr = changeAddress || privateKey.toPublicKey().toAddress();
    outputs.push({
      lockingScript: p2pkh.lock(changeAddr),
      satoshis: change,
    });
  }

  const tx = new Transaction(1, inputs, outputs, 0);
  await tx.sign();

  const hex = tx.toHex();
  const txid = tx.id("hex") as string;
  const actualSize = hex.length / 2;
  const actualFee = sourceSatoshis - lockAmountSatoshis - (change > 546 ? change : 0);
  const actualFeeRate = actualFee / actualSize;

  return {
    txid,
    hex,
    size: actualSize,
    fee: actualFee,
    feeRate: Math.round(actualFeeRate * 100) / 100,
  };
}

/**
 * Build a transaction that spends from a custom-locked UTXO.
 * User provides: source UTXO, unlocking script ASM, destination address, fee rate.
 * Private key is optional - only needed for scripts that require signatures (like R-Puzzle).
 */
export async function buildCustomUnlockTransaction(
  sourceTxHex: string,
  sourceVout: number,
  unlockingScriptASM: string,
  destinationAddress: string,
  feeRateSatPerByte: number,
  privateKeyWif?: string
): Promise<BuildTransactionResult> {
  // Private key only needed for change address if no destination provided
  // For hash puzzles and other non-signature scripts, it's not required
  const p2pkh = new P2PKH();
  let changeAddress = destinationAddress;
  if (privateKeyWif) {
    const privateKey = PrivateKey.fromWif(privateKeyWif);
    changeAddress = privateKey.toPublicKey().toAddress();
  }

  // Parse source transaction
  const sourceTx = Transaction.fromHex(sourceTxHex.trim());

  if (sourceVout >= sourceTx.outputs.length) {
    throw new Error(
      `Invalid output index ${sourceVout}. Transaction has ${sourceTx.outputs.length} outputs.`
    );
  }

  const sourceOutput = sourceTx.outputs[sourceVout];
  const sourceSatoshis =
    typeof sourceOutput.satoshis === "bigint"
      ? Number(sourceOutput.satoshis)
      : (sourceOutput.satoshis as number);
  
  // Store source lock script for later verification
  const sourceLockASM = sourceOutput.lockingScript.toASM();

  // Parse unlocking script - ensure hex data is properly formatted
  // For hash puzzles, the preimage hex should be pushed directly
  let formattedASM = unlockingScriptASM.trim();
  
  // If it's pure hex (no spaces, even length), Script.fromASM will treat it as a push
  // But we need to ensure it's properly formatted - hex data in ASM is auto-pushed
  // Example: "68656c6c6f" becomes PUSH5 "hello"
  const customUnlockScript = asmToUnlockingScript(formattedASM);
  const customUnlockSize = customUnlockScript.toBinary().length;
  
  // Verify the script was created correctly
  if (customUnlockScript.chunks.length === 0) {
    throw new Error("Unlocking script is empty");
  }

  // Estimate transaction size
  const P2PKH_OUTPUT_SIZE = 34;
  const TX_OVERHEAD = 10;
  const INPUT_OVERHEAD = 40; // txid + vout + sequence + script length varint

  const estimatedSize =
    TX_OVERHEAD +
    INPUT_OVERHEAD +
    customUnlockSize +
    P2PKH_OUTPUT_SIZE +
    8 + // satoshis
    1; // varint

  const estimatedFee = Math.ceil(estimatedSize * feeRateSatPerByte);
  const outputAmount = sourceSatoshis - estimatedFee;

  if (outputAmount < 546) {
    throw new Error(
      `Insufficient funds after fee. Output would be ${outputAmount} sats (below dust threshold of 546).`
    );
  }

  // Build transaction
  // For custom scripts without OP_CHECKSIG, we create a template that returns the script directly
  const inputs: TransactionInput[] = [
    {
      sourceTransaction: sourceTx,
      sourceOutputIndex: sourceVout,
      unlockingScriptTemplate: {
        sign: async (_tx: Transaction, _inputIndex: number) => customUnlockScript,
        estimateLength: async () => customUnlockSize,
      },
      sequence: 0xffffffff,
    },
  ];

  const outputs: TransactionOutput[] = [
    {
      lockingScript: p2pkh.lock(destinationAddress),
      satoshis: outputAmount,
    },
  ];

  const tx = new Transaction(1, inputs, outputs, 0);
  // Call sign() to finalize the transaction structure
  // The unlocking script template's sign() function should return the script directly
  // For hash puzzles, this just pushes the preimage - no private key needed
  // The SDK will call the template's sign() method for each input
  await tx.sign();
  
  // Verify the unlocking script was set correctly
  const actualUnlockScript = tx.inputs[0].unlockingScript;
  if (!actualUnlockScript) {
    throw new Error("Failed to set unlocking script - transaction sign() did not apply the template");
  }
  
  // Check if the SDK incorrectly added a signature (for hash puzzles, we only want the preimage)
  const actualASM = actualUnlockScript.toASM();
  const expectedASM = customUnlockScript.toASM();
  
  // If the actual script doesn't match what we expected, the SDK may have tried to sign it
  // This can happen if the SDK detects a P2PKH pattern and tries to sign, ignoring our template
  if (actualASM !== expectedASM) {
    // Check if the source output is a hash puzzle (should not require signing)
    const isHashPuzzle = sourceLockASM.includes("OP_SHA256") || 
                         sourceLockASM.includes("OP_HASH160") ||
                         sourceLockASM.includes("OP_HASH256") ||
                         sourceLockASM.includes("OP_RIPEMD160");
    
    if (isHashPuzzle) {
      // The SDK incorrectly tried to sign a hash puzzle - force our custom script
      console.warn(`SDK incorrectly added signature to hash puzzle unlock. Expected: ${expectedASM}, Got: ${actualASM}. Fixing...`);
      // Manually set the unlocking script to what we want
      // Note: We need to access the internal structure to set it
      // The SDK's Transaction class should respect our template, but if it doesn't, we fix it here
      (tx.inputs[0] as any).unlockingScript = customUnlockScript;
      // After setting the script, we need to rebuild the transaction hex
      // The SDK's toHex() should use the updated unlocking script
    } else {
      // For non-hash-puzzle scripts, warn but don't override (might be intentional)
      console.warn(`Unlocking script mismatch. Expected: ${expectedASM}, Got: ${actualASM}`);
    }
  }

  const hex = tx.toHex();
  const txid = tx.id("hex") as string;
  const actualSize = hex.length / 2;
  const actualFee = sourceSatoshis - outputAmount;
  const actualFeeRate = actualFee / actualSize;

  return {
    txid,
    hex,
    size: actualSize,
    fee: actualFee,
    feeRate: Math.round(actualFeeRate * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// nLockTime-aware unlock transaction
// ---------------------------------------------------------------------------

/**
 * Build a transaction that spends an output with a transaction-level timelock.
 * Sets nLockTime and sequence 0xFFFFFFFE so miners enforce the block/time constraint.
 *
 * NOTE: OP_CHECKLOCKTIMEVERIFY does NOT exist on BSV (byte 0xB1 is OP_NOP2 — a pure
 * no-op since Genesis). Time-locking on BSV is enforced at the TRANSACTION level via
 * nLockTime + nSequence, not by any script opcode.
 */
export async function buildCustomUnlockTransactionWithLockTime(
  sourceTxHex: string,
  sourceVout: number,
  unlockingScriptASM: string,
  destinationAddress: string,
  feeRateSatPerByte: number,
  txLockTime: number
): Promise<BuildTransactionResult> {
  const p2pkh = new P2PKH();
  const sourceTx = Transaction.fromHex(sourceTxHex.trim());

  if (sourceVout >= sourceTx.outputs.length) {
    throw new Error(
      `Invalid output index ${sourceVout}. Transaction has ${sourceTx.outputs.length} outputs.`
    );
  }

  const sourceOutput = sourceTx.outputs[sourceVout];
  const sourceSatoshis =
    typeof sourceOutput.satoshis === "bigint"
      ? Number(sourceOutput.satoshis)
      : (sourceOutput.satoshis as number);

  const customUnlockScript = asmToUnlockingScript(unlockingScriptASM.trim());
  const customUnlockSize = Math.max(1, customUnlockScript.toBinary().length);

  const P2PKH_OUTPUT_SIZE = 34;
  const TX_OVERHEAD = 10;
  const INPUT_OVERHEAD = 40;
  const estimatedSize =
    TX_OVERHEAD + INPUT_OVERHEAD + customUnlockSize + P2PKH_OUTPUT_SIZE + 8 + 1;
  const estimatedFee = Math.ceil(estimatedSize * feeRateSatPerByte);
  const outputAmount = sourceSatoshis - estimatedFee;

  if (outputAmount < 546) {
    throw new Error(
      `Insufficient funds after fee. Output would be ${outputAmount} sats.`
    );
  }

  const inputs: TransactionInput[] = [
    {
      sourceTransaction: sourceTx,
      sourceOutputIndex: sourceVout,
      unlockingScriptTemplate: {
        sign: async (_tx: Transaction, _inputIndex: number) => customUnlockScript,
        estimateLength: async () => customUnlockSize,
      },
      // Must be < 0xFFFFFFFF for nLockTime enforcement
      sequence: 0xFFFFFFFE,
    },
  ];

  const outputs: TransactionOutput[] = [
    {
      lockingScript: p2pkh.lock(destinationAddress),
      satoshis: outputAmount,
    },
  ];

  const tx = new Transaction(1, inputs, outputs, txLockTime);
  await tx.sign();

  // Ensure the SDK did not override our custom unlock script
  const actual = tx.inputs[0].unlockingScript;
  if (actual && actual.toASM() !== customUnlockScript.toASM()) {
    (tx.inputs[0] as unknown as { unlockingScript: typeof customUnlockScript }).unlockingScript =
      customUnlockScript;
  }

  const hex = tx.toHex();
  const txid = tx.id("hex") as string;
  const actualSize = hex.length / 2;
  const actualFee = sourceSatoshis - outputAmount;

  return {
    txid,
    hex,
    size: actualSize,
    fee: actualFee,
    feeRate: Math.round((actualFee / actualSize) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// R-Puzzle unlock transaction
// ---------------------------------------------------------------------------

/**
 * Build a transaction that spends from an R-Puzzle-locked UTXO.
 * Uses the SDK's RPuzzle.unlock() which generates the correct signature
 * with the specified K value at signing time.
 */
export async function buildRPuzzleUnlockTransaction(
  privateKeyWif: string,
  kHex: string,
  rpuzzleType: "raw" | "HASH160",
  sourceTxHex: string,
  sourceVout: number,
  destinationAddress: string,
  feeRateSatPerByte: number
): Promise<BuildTransactionResult> {
  const privateKey = PrivateKey.fromWif(privateKeyWif);
  const p2pkh = new P2PKH();

  // Parse source transaction
  const sourceTx = Transaction.fromHex(sourceTxHex.trim());

  if (sourceVout >= sourceTx.outputs.length) {
    throw new Error(
      `Invalid output index ${sourceVout}. Transaction has ${sourceTx.outputs.length} outputs.`
    );
  }

  const sourceOutput = sourceTx.outputs[sourceVout];
  const sourceSatoshis =
    typeof sourceOutput.satoshis === "bigint"
      ? Number(sourceOutput.satoshis)
      : (sourceOutput.satoshis as number);

  // Create R-Puzzle unlock template using the K value
  const kBN = new BigNumber(kHex, 16);
  const rpuzzle = new RPuzzle(rpuzzleType);
  const unlockTemplate = rpuzzle.unlock(kBN, privateKey);

  // Estimate transaction size (R-puzzle unlock is ~108 bytes)
  const P2PKH_OUTPUT_SIZE = 34;
  const TX_OVERHEAD = 10;
  const RPUZZLE_INPUT_SIZE = 148; // similar to P2PKH

  const estimatedSize = TX_OVERHEAD + RPUZZLE_INPUT_SIZE + P2PKH_OUTPUT_SIZE;
  const estimatedFee = Math.ceil(estimatedSize * feeRateSatPerByte);
  const outputAmount = sourceSatoshis - estimatedFee;

  if (outputAmount < 546) {
    throw new Error(
      `Insufficient funds after fee. Output would be ${outputAmount} sats (below dust threshold of 546).`
    );
  }

  // Build transaction
  const inputs: TransactionInput[] = [
    {
      sourceTransaction: sourceTx,
      sourceOutputIndex: sourceVout,
      unlockingScriptTemplate: unlockTemplate,
      sequence: 0xffffffff,
    },
  ];

  const outputs: TransactionOutput[] = [
    {
      lockingScript: p2pkh.lock(destinationAddress),
      satoshis: outputAmount,
    },
  ];

  const tx = new Transaction(1, inputs, outputs, 0);
  await tx.sign();

  const hex = tx.toHex();
  const txid = tx.id("hex") as string;
  const actualSize = hex.length / 2;
  const actualFee = sourceSatoshis - outputAmount;
  const actualFeeRate = actualFee / actualSize;

  return {
    txid,
    hex,
    size: actualSize,
    fee: actualFee,
    feeRate: Math.round(actualFeeRate * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Step-by-step Script Simulator
// ---------------------------------------------------------------------------

export interface ExecutionStep {
  stepNumber: number;
  context: "UnlockingScript" | "LockingScript";
  opcode: string;
  stack: string[];
  altStack: string[];
  error?: string;
}

export interface SimulationResult {
  steps: ExecutionStep[];
  valid: boolean;
  error?: string;
  finalStack: string[];
}

/** Reverse-map opcode number → name (e.g. 0x76 → "OP_DUP") */
const opcodeNames: Record<number, string> = {};
for (const [name, code] of Object.entries(OP)) {
  if (typeof code === "number" && !opcodeNames[code]) {
    opcodeNames[code] = name;
  }
}

function describeChunk(chunk: { op: number; data?: number[] }): string {
  if (Array.isArray(chunk.data) && chunk.data.length > 0) {
    const hex = chunk.data.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `PUSH ${hex}`;
  }
  return opcodeNames[chunk.op] || `0x${chunk.op.toString(16)}`;
}

function snapshotStack(stack: number[][]): string[] {
  return stack.map((item) => {
    if (!item || item.length === 0) return "(empty)";
    return item.map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}

/**
 * Run the script interpreter step-by-step, capturing the stack state
 * after each opcode execution. Returns a full execution trace.
 */
export function simulateScript(
  lockingASM: string,
  unlockingASM: string
): SimulationResult {
  let lockScript: LockingScript;
  let unlockScript: UnlockingScript;

  try {
    lockScript = asmToLockingScript(lockingASM);
  } catch (e) {
    return {
      steps: [],
      valid: false,
      error: `Locking script parse error: ${e instanceof Error ? e.message : String(e)}`,
      finalStack: [],
    };
  }

  try {
    unlockScript = asmToUnlockingScript(unlockingASM);
  } catch (e) {
    return {
      steps: [],
      valid: false,
      error: `Unlocking script parse error: ${e instanceof Error ? e.message : String(e)}`,
      finalStack: [],
    };
  }

  const spend = new Spend({
    sourceTXID:
      "0000000000000000000000000000000000000000000000000000000000000000",
    sourceOutputIndex: 0,
    sourceSatoshis: 100000,
    lockingScript: lockScript,
    transactionVersion: 1,
    otherInputs: [],
    outputs: [],
    inputIndex: 0,
    unlockingScript: unlockScript,
    inputSequence: 0xffffffff,
    lockTime: 0,
  });

  const steps: ExecutionStep[] = [];
  let stepNumber = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Determine which script/opcode is about to execute
      const ctx = spend.context;
      const pc = spend.programCounter;
      const currentScript =
        ctx === "UnlockingScript" ? unlockScript : lockScript;

      if (pc >= currentScript.chunks.length) {
        // Check if we're transitioning from unlock to lock
        if (ctx === "UnlockingScript") {
          // step() will transition context
          const continued = spend.step();
          if (!continued) break;
          continue;
        }
        break;
      }

      const chunk = currentScript.chunks[pc];
      const opcodeName = describeChunk(chunk);

      let stepError: string | undefined;
      let continued = false;

      try {
        continued = spend.step();
      } catch (e) {
        stepError = e instanceof Error ? e.message : String(e);
      }

      stepNumber++;
      steps.push({
        stepNumber,
        context: ctx,
        opcode: opcodeName,
        stack: snapshotStack(spend.stack),
        altStack: snapshotStack(spend.altStack),
        error: stepError,
      });

      if (stepError) {
        return {
          steps,
          valid: false,
          error: stepError,
          finalStack: snapshotStack(spend.stack),
        };
      }

      if (!continued) break;

      // Safety: cap at 10000 steps
      if (stepNumber >= 10000) {
        return {
          steps,
          valid: false,
          error: "Execution exceeded 10,000 steps (safety limit).",
          finalStack: snapshotStack(spend.stack),
        };
      }
    }

    // Post-execution checks (mirrors Spend.validate logic)
    const finalStack = snapshotStack(spend.stack);

    if (spend.stack.length === 0) {
      return {
        steps,
        valid: false,
        error: "Stack empty after execution.",
        finalStack,
      };
    }

    // Check if top of stack is truthy
    const top = spend.stack[spend.stack.length - 1];
    const isTruthy =
      top.length > 0 && top.some((b, i) => i === top.length - 1 ? (b & 0x7f) !== 0 : b !== 0);

    return {
      steps,
      valid: isTruthy && spend.stack.length === 1,
      error: !isTruthy
        ? "Top of stack is not truthy."
        : spend.stack.length !== 1
          ? `Clean stack rule: expected 1 item, found ${spend.stack.length}.`
          : undefined,
      finalStack,
    };
  } catch (e) {
    return {
      steps,
      valid: false,
      error: e instanceof Error ? e.message : String(e),
      finalStack: snapshotStack(spend.stack),
    };
  }
}

/**
 * Step-by-step simulation using the FULL transaction context (real SIGHASH).
 * Mirrors simulateScript but builds the Spend like validateTransactionSpend,
 * so OP_CHECKSIG-based scripts (P2PKH, R-Puzzle) execute correctly.
 */
export function simulateTransactionSpend(
  sourceTxHex: string,
  spendingTxHex: string,
  sourceOutputIndex: number = 0,
  spendingInputIndex: number = 0
): SimulationResult {
  let sourceTx: Transaction;
  let spendingTx: Transaction;
  try {
    sourceTx = Transaction.fromHex(sourceTxHex.trim());
  } catch (e) {
    return { steps: [], valid: false, error: `Source TX parse error: ${e instanceof Error ? e.message : String(e)}`, finalStack: [] };
  }
  try {
    spendingTx = Transaction.fromHex(spendingTxHex.trim());
  } catch (e) {
    return { steps: [], valid: false, error: `Spending TX parse error: ${e instanceof Error ? e.message : String(e)}`, finalStack: [] };
  }

  if (sourceOutputIndex >= sourceTx.outputs.length) {
    return { steps: [], valid: false, error: `Source output index ${sourceOutputIndex} out of range.`, finalStack: [] };
  }
  if (spendingInputIndex >= spendingTx.inputs.length) {
    return { steps: [], valid: false, error: `Spending input index ${spendingInputIndex} out of range.`, finalStack: [] };
  }

  const sourceOutput = sourceTx.outputs[sourceOutputIndex];
  const spendingInput = spendingTx.inputs[spendingInputIndex];
  const lockScript = sourceOutput.lockingScript;
  const unlockScript = spendingInput.unlockingScript;

  if (!unlockScript) {
    return { steps: [], valid: false, error: "Spending input has no unlocking script.", finalStack: [] };
  }

  const sourceSatoshis =
    typeof sourceOutput.satoshis === "bigint"
      ? Number(sourceOutput.satoshis)
      : (sourceOutput.satoshis as number) ?? 0;

  const otherInputs: TransactionInput[] = spendingTx.inputs
    .filter((_, i) => i !== spendingInputIndex)
    .map((inp) => ({
      sourceTXID: inp.sourceTXID ?? "0".repeat(64),
      sourceOutputIndex: inp.sourceOutputIndex ?? 0,
      sequence: inp.sequence ?? 0xffffffff,
      unlockingScript: inp.unlockingScript,
    }));

  const outputs: TransactionOutput[] = spendingTx.outputs.map((out) => ({
    lockingScript: out.lockingScript,
    satoshis:
      typeof out.satoshis === "bigint"
        ? Number(out.satoshis)
        : (out.satoshis as number) ?? 0,
  }));

  const spend = new Spend({
    sourceTXID: sourceTx.id("hex") as string,
    sourceOutputIndex,
    sourceSatoshis,
    lockingScript: lockScript,
    transactionVersion: spendingTx.version ?? 1,
    otherInputs,
    outputs,
    inputIndex: spendingInputIndex,
    unlockingScript: unlockScript,
    inputSequence: spendingInput.sequence ?? 0xffffffff,
    lockTime: spendingTx.lockTime ?? 0,
  });

  const steps: ExecutionStep[] = [];
  let stepNumber = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const ctx = spend.context;
      const pc = spend.programCounter;
      const currentScript =
        ctx === "UnlockingScript" ? unlockScript : lockScript;

      if (pc >= currentScript.chunks.length) {
        if (ctx === "UnlockingScript") {
          const continued = spend.step();
          if (!continued) break;
          continue;
        }
        break;
      }

      const chunk = currentScript.chunks[pc];
      const opcodeName = describeChunk(chunk);

      let stepError: string | undefined;
      let continued = false;

      try {
        continued = spend.step();
      } catch (e) {
        stepError = e instanceof Error ? e.message : String(e);
      }

      stepNumber++;
      steps.push({
        stepNumber,
        context: ctx,
        opcode: opcodeName,
        stack: snapshotStack(spend.stack),
        altStack: snapshotStack(spend.altStack),
        error: stepError,
      });

      if (stepError) {
        return { steps, valid: false, error: stepError, finalStack: snapshotStack(spend.stack) };
      }

      if (!continued) break;

      if (stepNumber >= 10000) {
        return { steps, valid: false, error: "Execution exceeded 10,000 steps (safety limit).", finalStack: snapshotStack(spend.stack) };
      }
    }

    const finalStack = snapshotStack(spend.stack);

    if (spend.stack.length === 0) {
      return { steps, valid: false, error: "Stack empty after execution.", finalStack };
    }

    const top = spend.stack[spend.stack.length - 1];
    const isTruthy =
      top.length > 0 && top.some((b, i) => i === top.length - 1 ? (b & 0x7f) !== 0 : b !== 0);

    return {
      steps,
      valid: isTruthy && spend.stack.length === 1,
      error: !isTruthy
        ? "Top of stack is not truthy."
        : spend.stack.length !== 1
          ? `Clean stack rule: expected 1 item, found ${spend.stack.length}.`
          : undefined,
      finalStack,
    };
  } catch (e) {
    return { steps, valid: false, error: e instanceof Error ? e.message : String(e), finalStack: snapshotStack(spend.stack) };
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const TEMPLATES: PlaygroundTemplate[] = [
  // ── Basic ──────────────────────────────────────────────────────────────
  {
    id: "anyone-can-spend",
    name: "Anyone Can Spend",
    category: "Basic",
    description:
      "The simplest possible script. The locking script always pushes TRUE, so any unlocking script (even empty) will satisfy it.",
    lockingASM: "OP_TRUE",
    unlockingASM: "",
  },
  {
    id: "always-fail",
    name: "Always Fail",
    category: "Basic",
    description:
      "A script that always fails validation. Useful for provably unspendable outputs (burn addresses).",
    lockingASM: "OP_FALSE",
    unlockingASM: "",
    note: "This will always fail validation — that's the point!",
  },

  // ── Puzzle ─────────────────────────────────────────────────────────────
  {
    id: "math-add",
    name: "Addition Puzzle",
    category: "Lock Funds",
    description: "The two values pushed by the unlocking script must add up to 5.",
    lockingASM: "OP_ADD OP_5 OP_EQUAL",
    unlockingASM: "OP_2 OP_3",
  },
  {
    id: "math-multiply",
    name: "Multiplication Puzzle",
    category: "Lock Funds",
    description: "The two values must multiply to 12. OP_MUL is enabled in BSV (disabled in BTC since 2010).",
    lockingASM: "OP_MUL OP_12 OP_EQUAL",
    unlockingASM: "OP_3 OP_4",
    note: "Try other factor pairs: OP_2 OP_6, OP_1 OP_12.",
  },
  {
    id: "hash-sha256",
    name: "Hash Puzzle (SHA256)",
    category: "Lock Funds",
    description:
      'Provide the SHA256 preimage of the hash. Preimage here is "hello" (hex 68656c6c6f).',
    lockingASM:
      "OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL",
    unlockingASM: "68656c6c6f",
    note: 'Preimage: "hello" → SHA256 = 2cf24d…9824',
    interactiveConfig: "hash-puzzle",
  },
  {
    id: "hash-hash160",
    name: "Hash Puzzle (HASH160)",
    category: "Lock Funds",
    description:
      'HASH160 = RIPEMD160(SHA256(x)) — the same hash used in P2PKH addresses. Preimage is "hello".',
    lockingASM:
      "OP_HASH160 b6a9c8c230722b7c748331a8b450f05566dc7d0f OP_EQUAL",
    unlockingASM: "68656c6c6f",
    note: 'Preimage: "hello" → HASH160 = b6a9c8…7d0f',
    interactiveConfig: "hash-puzzle",
  },
  {
    id: "hash-ripemd160",
    name: "Hash Puzzle (RIPEMD160)",
    category: "Lock Funds",
    description:
      'Direct RIPEMD160 puzzle. Produces a 20-byte hash. Preimage is "hello".',
    lockingASM:
      "OP_RIPEMD160 108f07b8382412612c048d07d13f814118445acd OP_EQUAL",
    unlockingASM: "68656c6c6f",
    note: 'Preimage: "hello" → RIPEMD160 = 108f07…5acd. Rarely used alone but a building block of HASH160.',
  },
  {
    id: "hash-dual-secret",
    name: "Dual Secret (AND)",
    category: "Lock Funds",
    description:
      'Requires TWO preimages to unlock. Both SHA256 hashes must match. Useful for dual-party escrow where both must reveal their secrets.',
    lockingASM:
      "OP_SHA256 2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90 OP_EQUALVERIFY OP_SHA256 81b637d8fcd2c6da6359e6963113a1170de795e4b725b84d1e0b4cfd9ec58ce9 OP_EQUAL",
    unlockingASM: "626f62 616c696365",
    note: 'Unlock pushes "bob" then "alice". Lock checks "alice" first (top of stack) via EQUALVERIFY, then "bob".',
  },

  // ── Arithmetic ─────────────────────────────────────────────────────────
  {
    id: "range-check",
    name: "Range Check",
    category: "Lock Funds",
    description:
      "Value must be between 3 (inclusive) and 10 (exclusive). Demonstrates OP_WITHIN for numeric range validation.",
    lockingASM: "OP_DUP OP_3 OP_10 OP_WITHIN OP_VERIFY",
    unlockingASM: "OP_5",
    note: "OP_WITHIN checks if x is in [min, max). Try values outside 3–9 to see it fail. OP_VERIFY consumes TRUE; the DUP-ed value (5) remains as the truthy result.",
  },
  {
    id: "abs-value",
    name: "Absolute Value",
    category: "Lock Funds",
    description:
      "The absolute value of the input must equal 7. Works with both 7 and -7.",
    lockingASM: "OP_ABS OP_7 OP_EQUAL",
    unlockingASM: "OP_7",
    note: "Try OP_1NEGATE OP_7 OP_MUL (pushes -7) — OP_ABS converts it to 7 and it still passes.",
  },

  // ── R-Puzzle ───────────────────────────────────────────────────────────
  {
    id: "rpuzzle-raw",
    name: "R-Puzzle (Raw)",
    category: "Lock Funds",
    description:
      "R-Puzzle locked to a raw R value. Anyone with the K value can sign and spend. Generate a new one for actual use.",
    lockingASM:
      "OP_OVER OP_3 OP_SPLIT OP_NIP OP_TRUE OP_SPLIT OP_SWAP OP_SPLIT OP_DROP f01d6b9018ab421dd410404cb869072065522bf85734008f105cf385a023a80f OP_EQUALVERIFY OP_CHECKSIG",
    unlockingASM: "<signature> <public key>",
    note: "R-Puzzles require OP_CHECKSIG — use the Transaction Builder to create real R-Puzzle transactions. K value for this example: 3039 (hex).",
    requiresTxContext: true,
    interactiveConfig: "r-puzzle",
  },

  // ── Control Flow ───────────────────────────────────────────────────────
  {
    id: "if-else",
    name: "If / Else Branch",
    category: "Control Flow",
    description:
      "Conditional execution. Push OP_TRUE to take the IF branch (result 2), or OP_FALSE for ELSE (result 3).",
    lockingASM: "OP_IF OP_2 OP_ELSE OP_3 OP_ENDIF",
    unlockingASM: "OP_TRUE",
    note: "Try changing the unlock to OP_FALSE to take the ELSE branch.",
  },
  {
    id: "nested-if",
    name: "Nested If/Else",
    category: "Control Flow",
    description:
      "Two-level conditional with four possible outcomes depending on two boolean inputs.",
    lockingASM:
      "OP_IF OP_IF OP_2 OP_ELSE OP_3 OP_ENDIF OP_ELSE OP_IF OP_4 OP_ELSE OP_5 OP_ENDIF OP_ENDIF",
    unlockingASM: "OP_TRUE OP_TRUE",
    note: "TRUE TRUE → 2. FALSE TRUE → 3. TRUE FALSE → 4. FALSE FALSE → 5. First push controls inner IF; second controls outer (stack is LIFO).",
  },
  {
    id: "notif-pattern",
    name: "OP_NOTIF Pattern",
    category: "Control Flow",
    description:
      "OP_NOTIF executes its block when the top value is falsy — the inverse of OP_IF.",
    lockingASM: "OP_NOTIF OP_7 OP_ELSE OP_8 OP_ENDIF",
    unlockingASM: "OP_FALSE",
    note: "Push FALSE → result 7. Push TRUE → result 8.",
  },

  // ── Stack ──────────────────────────────────────────────────────────────
  {
    id: "alt-stack",
    name: "Alt Stack Arithmetic",
    category: "Stack",
    description:
      "Uses the alt stack as scratch space. Moves a value aside, does math on the main stack, retrieves it. Result: val1 × 2 + val2.",
    lockingASM: "OP_TOALTSTACK OP_2 OP_MUL OP_FROMALTSTACK OP_ADD",
    unlockingASM: "OP_3 OP_4",
    note: "Pushes 3, 4 → moves 4 to alt stack → 3×2=6 → retrieves 4 → 6+4=10. Watch the Alt Stack panel in the simulator.",
    interactiveConfig: "alt-stack",
  },
  {
    id: "alt-accumulator",
    name: "Alt Stack Accumulator",
    category: "Stack",
    description:
      "Sums three numbers using the alt stack as a running total. Demonstrates the \"unrolled loop\" pattern common in BSV scripts.",
    lockingASM: "OP_ADD OP_TOALTSTACK OP_FROMALTSTACK OP_ADD",
    unlockingASM: "OP_2 OP_3 OP_4",
    note: "Pushes 2, 3, 4 → adds 3+4=7 → stash 7 on alt → retrieve → 7+2=9. The alt stack acts as temporary storage between loop iterations.",
  },
  {
    id: "stack-depth-check",
    name: "Stack Depth Check",
    category: "Stack",
    description:
      "Requires exactly 3 items on the stack, then sums them. OP_DEPTH pushes the current stack depth.",
    lockingASM: "OP_DEPTH OP_3 OP_EQUALVERIFY OP_ADD OP_ADD",
    unlockingASM: "OP_1 OP_2 OP_3",
    note: "Depth must be 3, then sums: 1+2+3=6. Push fewer or more items to see EQUALVERIFY fail.",
  },

  // ── Time Lock ──────────────────────────────────────────────────────────
  // NOTE: On BSV, OP_CHECKLOCKTIMEVERIFY (BIP-65) and OP_CHECKSEQUENCEVERIFY
  // (BIP-112) are DISABLED — they were reverted to OP_NOP2 / OP_NOP3 at the
  // Genesis upgrade (Feb 2020). Timelocks on BSV are enforced at the
  // TRANSACTION level via nLockTime and nSequence, not via script opcodes.
  {
    id: "nlocktime-intro",
    name: "nLockTime (Absolute)",
    category: "Time Lock",
    description:
      "On BSV, absolute timelocks use the transaction-level nLockTime field — not a script opcode. OP_CHECKLOCKTIMEVERIFY (CLTV) is disabled on BSV (it's OP_NOP2). Miners enforce the lock: a TX with a future nLockTime won't be included in a block until that time.",
    lockingASM: "OP_TRUE",
    unlockingASM: "",
    note: "This script always passes — the timelock is a property of the TRANSACTION, not the script. To use nLockTime: (1) set nLockTime to a block height (<500M) or Unix timestamp (>=500M), (2) set at least one input's nSequence < 0xFFFFFFFF. Miners reject the TX until the locktime is reached.",
    educational: true,
  },
  {
    id: "nlocktime-sequence",
    name: "nLockTime + nSequence",
    category: "Time Lock",
    description:
      "nSequence on BSV retains its original Satoshi meaning: transaction finality. If ALL inputs have nSequence = 0xFFFFFFFF (max), the TX is 'final' and nLockTime is IGNORED. To activate nLockTime, at least one input must have nSequence < max.",
    lockingASM: "OP_TRUE",
    unlockingASM: "",
    note: "BSV does NOT use BIP-68 relative timelocks (that's BTC/BCH only). On BSV, nSequence controls finality: non-max means the TX is replaceable and nLockTime is enforced. This was Satoshi's original design for payment channels — update a TX by incrementing nSequence, and only the highest-sequence version gets mined.",
    educational: true,
  },

  // ── Escrow ─────────────────────────────────────────────────────────────
  {
    id: "htlc-redeem",
    name: "HTLC (Claim Path)",
    category: "Escrow & Swaps",
    description:
      'Hash Time-Locked Contract — the atomic swap primitive. Two paths: claim with secret preimage (IF), or refund with a different secret (ELSE). On BSV, refund timing is enforced via nLockTime at the TX level.',
    lockingASM:
      "OP_IF OP_SHA256 2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b OP_EQUAL OP_ELSE OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL OP_ENDIF",
    unlockingASM: "736563726574 OP_TRUE",
    note: 'Claim: push "secret" + TRUE. Refund: push "hello" + FALSE. In production, add OP_CHECKSIG to each path and enforce the refund timeout via the spending TX\'s nLockTime field (BSV does not use CLTV in script).',
    group: "htlc",
  },
  {
    id: "htlc-refund",
    name: "HTLC (Refund Path)",
    category: "Escrow & Swaps",
    description:
      "Same HTLC lock script — taking the ELSE (refund) branch. On-chain, the refund TX would set nLockTime to enforce a waiting period before miners accept it.",
    lockingASM:
      "OP_IF OP_SHA256 2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b OP_EQUAL OP_ELSE OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL OP_ENDIF",
    unlockingASM: "68656c6c6f OP_FALSE",
    note: 'Takes the ELSE branch with preimage "hello". In production, the refund TX sets nLockTime >= a future block height. Miners won\'t include it until the timeout, giving the counterparty time to claim first.',
    group: "htlc",
  },
  {
    id: "escrow-2of2",
    name: "2-of-2 Escrow (Reference)",
    category: "Escrow & Swaps",
    description:
      "Bare 2-of-2 multisig — both parties must sign to release funds. The simplest escrow pattern.",
    lockingASM:
      "OP_2 0000000000000000000000000000000000000000000000000000000000000000aa 0000000000000000000000000000000000000000000000000000000000000000bb OP_2 OP_CHECKMULTISIG",
    unlockingASM: "OP_0 00 00",
    note: "Reference — needs real signatures, keys, and TX context. Leading OP_0 is the CHECKMULTISIG off-by-one workaround.",
    requiresTxContext: true,
  },

  // ── Standard ───────────────────────────────────────────────────────────
  {
    id: "p2pkh-ref",
    name: "P2PKH (Reference)",
    category: "Standard Payments",
    description:
      "Pay-to-Public-Key-Hash — the standard BSV payment pattern. Requires a valid signature + matching public key.",
    lockingASM:
      "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
    unlockingASM: "00 00",
    note: "Will NOT validate in the playground — OP_CHECKSIG needs real TX context. Shown for educational reference.",
    requiresTxContext: true,
  },
  {
    id: "p2pk-ref",
    name: "P2PK (Reference)",
    category: "Standard Payments",
    description:
      "Pay-to-Public-Key — the original Bitcoin payment script. The public key is embedded directly in the lock.",
    lockingASM:
      "0000000000000000000000000000000000000000000000000000000000000000aa OP_CHECKSIG",
    unlockingASM: "00",
    note: "The first Bitcoin transactions used P2PK. Cannot validate in playground — needs real TX context + valid signature.",
    requiresTxContext: true,
  },
  {
    id: "bare-multisig-ref",
    name: "1-of-2 Multisig (Reference)",
    category: "Standard Payments",
    description:
      "Bare 1-of-2 multisig — either party can sign alone. Demonstrates OP_CHECKMULTISIG with threshold M < N.",
    lockingASM:
      "OP_1 0000000000000000000000000000000000000000000000000000000000000000aa 0000000000000000000000000000000000000000000000000000000000000000bb OP_2 OP_CHECKMULTISIG",
    unlockingASM: "OP_0 00",
    note: "1-of-2 multisig: only one valid signature needed. OP_0 is the CHECKMULTISIG dummy element. Cannot validate in playground.",
    requiresTxContext: true,
  },

  // ── Data Manipulation ────────────────────────────────────────────────
  {
    id: "string-concat",
    name: "String Concatenation (OP_CAT)",
    category: "Data Manipulation",
    description:
      'Concatenate two byte strings and verify the result. OP_CAT is enabled in BSV (disabled in BTC since 2010). Push "hello" and "world" — they must combine to "helloworld".',
    lockingASM: "OP_CAT 68656c6c6f776f726c64 OP_EQUAL",
    unlockingASM: "68656c6c6f 776f726c64",
    note: 'OP_CAT concatenates the second-to-top with the top: [hello, world] → [helloworld]. One of BSV\'s restored opcodes — essential for advanced script patterns like OP_PUSH_TX.',
  },
  {
    id: "byte-split",
    name: "Byte Extraction (OP_SPLIT)",
    category: "Data Manipulation",
    description:
      'Split a byte string at a given position and verify both halves. OP_SPLIT is enabled in BSV — the inverse of OP_CAT.',
    lockingASM: "OP_5 OP_SPLIT 776f726c64 OP_EQUALVERIFY 68656c6c6f OP_EQUAL",
    unlockingASM: "68656c6c6f776f726c64",
    note: 'Splits "helloworld" at byte 5: [hello, world]. Verifies both halves. OP_SPLIT + OP_CAT enable arbitrary byte-level data manipulation in BSV scripts.',
  },

  // ── Data ───────────────────────────────────────────────────────────────
  {
    id: "op-return",
    name: "OP_RETURN Data",
    category: "Data Embedding",
    description:
      "Embed arbitrary data on-chain. OP_RETURN marks the output as provably unspendable.",
    lockingASM: "OP_FALSE OP_RETURN 48656c6c6f20576f726c64",
    unlockingASM: "",
    note: 'Data: "Hello World". OP_RETURN outputs can never be spent — validation will fail by design.',
  },
  {
    id: "op-return-multi",
    name: "OP_RETURN Multi-Push",
    category: "Data Embedding",
    description:
      "Multiple data fields in a single OP_RETURN — the pattern used by on-chain protocols (B://, MAP, etc.).",
    lockingASM: "OP_FALSE OP_RETURN 48656c6c6f 576f726c64 313233",
    unlockingASM: "",
    note: 'Three pushes: "Hello", "World", "123". Protocols use multiple pushes to structure data (prefix, fields, etc.).',
  },
  {
    id: "data-integrity",
    name: "Data Integrity Proof",
    category: "Data Embedding",
    description:
      'Verify document integrity on-chain. The lock commits to a SHA256 hash; the unlock provides the original data. The script verifies the data matches — proving the document existed when the output was created. The output remains spendable.',
    lockingASM: "OP_DUP OP_SHA256 d0276bec6bc9b96f1893cd8f8b479dd6617d79a8f0a26593c9f12bdc45e3eea5 OP_EQUALVERIFY OP_SIZE OP_NIP OP_0 OP_GREATERTHAN",
    unlockingASM: "504f2d323032342d303031",
    note: 'Data: "PO-2024-001" (a purchase order ID). DUP keeps the data for SIZE check after hash verification. SIZE + NIP + GREATERTHAN ensures non-empty data remains as the truthy result. Unlike OP_RETURN, this output is spendable — the data lives in the spending TX\'s input script.',
  },
  {
    id: "message-auth",
    name: "Message Authentication (OP_CAT)",
    category: "Data Embedding",
    description:
      'Verify a structured message by concatenating sender + payload and checking the combined hash. Demonstrates OP_CAT for composing data before verification — a pattern used in on-chain messaging and EDI.',
    lockingASM: "OP_CAT OP_SHA256 b5f2cf84fd46833a53045e8952af76ec501feb9254ab4fa0a000126a424bac6b OP_EQUAL",
    unlockingASM: "616c696365 696e766f696365",
    note: 'Push sender "alice" + payload "invoice". OP_CAT joins them, SHA256 hashes the result, and the lock verifies against the committed hash. This pattern enables on-chain EDI: structured B2B data (purchase orders, invoices) verified and timestamped without OP_RETURN — the output stays spendable.',
  },
  {
    id: "brc48-push-drop",
    name: "BRC-48: Pay to Push Drop",
    category: "Data Embedding",
    description:
      "BRC-48: Data-rich tokens with ownership. Push arbitrary data onto the stack, drop it with OP_DROP/OP_2DROP, then lock to a public key. Output stays in the UTXO set (not prunable) and can be transferred by the owner. The original Bitcoin way of embedding data — no OP_RETURN needed.",
    lockingASM: "48656c6c6f 576f726c64 OP_DROP OP_2DROP 0000000000000000000000000000000000000000000000000000000000000000aa OP_CHECKSIG",
    unlockingASM: "<signature>",
    note: 'BRC-48 pattern. Data: "Hello" "World". Push data (OP_PUSHDATA implicit), drop it, then lock to owner\'s public key. Owner transfers token by spending with signature. Used for persistent tokens, identity anchors (BRC-52), and metadata-rich digital assets. Stays in UTXO set — not prunable like OP_RETURN.',
    requiresTxContext: true,
  },

  // ── Advanced ─────────────────────────────────────────────────────────
  {
    id: "rabin-sig",
    name: "Rabin Signature Verification",
    category: "Covenants",
    description:
      'Verify a simplified Rabin signature on-chain. The verifier computes s² mod n and checks it equals the message digest m. Uses OP_MUL and OP_MOD — opcodes restored in BSV.',
    lockingASM: "OP_DUP OP_MUL 4d OP_MOD OP_4 OP_EQUAL",
    unlockingASM: "OP_9",
    note: 'Rabin signatures: public key n=77 (p=7 × q=11), signature s=9, message m=4. Verification: 9² = 81, 81 mod 77 = 4 = m. Much smaller than ECDSA — on BSV, Rabin signatures enable cheap signature verification for oracles and external data feeds using restored arithmetic opcodes.',
  },
  {
    id: "op-push-tx",
    name: "OP_PUSH_TX Covenant",
    category: "Covenants",
    description:
      'Transaction introspection pattern. The spending transaction\'s sighash preimage is pushed in the unlock and verified by the lock using OP_CHECKSIG with a known ephemeral key. Once verified, the preimage bytes are available on the stack — enabling covenants that constrain how funds can be spent.',
    lockingASM: "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
    unlockingASM: "<sighash_preimage> <signature>",
    note: 'OP_PUSH_TX is not an opcode — it\'s a technique. The script uses a deterministic key (k=1) so the signature is reconstructable. When OP_CHECKSIG passes, the pushed preimage is proven to be the real transaction data. This enables: restricting which addresses can receive funds, enforcing output amounts, creating token protocols, and building state machines. The foundation of advanced BSV smart contracts.',
    requiresTxContext: true,
    educational: true,
  },

  // ── Combination ────────────────────────────────────────────────────────
  {
    id: "conditional-hash",
    name: "Conditional Hash (SHA256 or HASH160)",
    category: "Escrow & Swaps",
    description:
      'Choose which hash algorithm to prove: push TRUE for SHA256 path, FALSE for HASH160 path. Both use preimage "hello".',
    lockingASM:
      "OP_IF OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL OP_ELSE OP_HASH160 b6a9c8c230722b7c748331a8b450f05566dc7d0f OP_EQUAL OP_ENDIF",
    unlockingASM: "68656c6c6f OP_TRUE",
    note: 'Push "hello" + TRUE for SHA256 path. Change to FALSE for HASH160 path — same preimage works for both.',
  },
  {
    id: "hash-dual-path",
    name: "Dual Hash Path",
    category: "Escrow & Swaps",
    description:
      'Two-path contract: claim with one preimage (IF) or refund with a different preimage (ELSE). The BSV-native HTLC structure — timing is enforced via nLockTime at the TX level, not script opcodes.',
    lockingASM:
      "OP_IF OP_SHA256 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824 OP_EQUAL OP_ELSE OP_SHA256 2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b OP_EQUAL OP_ENDIF",
    unlockingASM: "68656c6c6f OP_TRUE",
    note: 'Claim: push "hello" + TRUE. Refund: push "secret" + FALSE. On BSV, the refund timeout is enforced by the spending TX\'s nLockTime — miners reject the refund TX until the time has passed.',
    group: "hash-dual-path",
  },

  // ── Custom ─────────────────────────────────────────────────────────────
  {
    id: "custom",
    name: "Custom Script",
    category: "Custom",
    description:
      "Write your own locking and unlocking scripts from scratch using Bitcoin opcodes.",
    lockingASM: "",
    unlockingASM: "",
  },
];

// ---------------------------------------------------------------------------
// Opcode Reference
// ---------------------------------------------------------------------------

export const OPCODE_REFERENCE: OpcodeCategory[] = [
  {
    category: "Constants",
    opcodes: [
      { name: "OP_0 / OP_FALSE", desc: "Push empty byte array (falsy)" },
      { name: "OP_1 – OP_16", desc: "Push number 1 through 16" },
      { name: "OP_TRUE", desc: "Alias for OP_1 (truthy)" },
      { name: "OP_1NEGATE", desc: "Push −1" },
    ],
  },
  {
    category: "Stack",
    opcodes: [
      { name: "OP_DUP", desc: "Duplicate top item" },
      { name: "OP_DROP", desc: "Remove top item" },
      { name: "OP_SWAP", desc: "Swap top two items" },
      { name: "OP_OVER", desc: "Copy second item to top" },
      { name: "OP_ROT", desc: "Rotate top three items" },
      { name: "OP_PICK", desc: "Copy nth item to top" },
      { name: "OP_ROLL", desc: "Move nth item to top" },
      { name: "OP_SIZE", desc: "Push byte-length of top item" },
      { name: "OP_DEPTH", desc: "Push current stack depth" },
      { name: "OP_TOALTSTACK", desc: "Move top item to alt stack" },
      { name: "OP_FROMALTSTACK", desc: "Move top of alt stack to main" },
      { name: "OP_NIP", desc: "Remove second-to-top item" },
      { name: "OP_TUCK", desc: "Copy top before second item" },
      { name: "OP_IFDUP", desc: "Duplicate top if truthy" },
    ],
  },
  {
    category: "Lock Funds",
    opcodes: [
      { name: "OP_ADD", desc: "a + b" },
      { name: "OP_SUB", desc: "a − b" },
      { name: "OP_MUL", desc: "a × b" },
      { name: "OP_DIV", desc: "a ÷ b (integer)" },
      { name: "OP_MOD", desc: "a % b" },
      { name: "OP_ABS", desc: "Absolute value" },
      { name: "OP_NEGATE", desc: "Flip sign" },
      { name: "OP_1ADD", desc: "Add 1" },
      { name: "OP_1SUB", desc: "Subtract 1" },
      { name: "OP_MIN", desc: "Smaller of two values" },
      { name: "OP_MAX", desc: "Larger of two values" },
      { name: "OP_WITHIN", desc: "True if x in [min, max)" },
    ],
  },
  {
    category: "Logic & Comparison",
    opcodes: [
      { name: "OP_EQUAL", desc: "Push 1 if top two are equal" },
      { name: "OP_EQUALVERIFY", desc: "OP_EQUAL then OP_VERIFY" },
      { name: "OP_NOT", desc: "Boolean NOT" },
      { name: "OP_BOOLAND", desc: "Boolean AND" },
      { name: "OP_BOOLOR", desc: "Boolean OR" },
      { name: "OP_NUMEQUAL", desc: "Numeric equality" },
      { name: "OP_LESSTHAN", desc: "a < b" },
      { name: "OP_GREATERTHAN", desc: "a > b" },
      { name: "OP_LESSTHANOREQUAL", desc: "a ≤ b" },
      { name: "OP_GREATERTHANOREQUAL", desc: "a ≥ b" },
    ],
  },
  {
    category: "Cryptography",
    opcodes: [
      { name: "OP_SHA256", desc: "SHA-256 hash of top item" },
      { name: "OP_HASH160", desc: "RIPEMD160(SHA256(top))" },
      { name: "OP_HASH256", desc: "SHA256(SHA256(top))" },
      { name: "OP_RIPEMD160", desc: "RIPEMD160 hash" },
      { name: "OP_SHA1", desc: "SHA-1 hash (legacy)" },
      { name: "OP_CHECKSIG", desc: "Verify ECDSA signature" },
      { name: "OP_CHECKMULTISIG", desc: "Verify M-of-N signatures" },
      { name: "OP_CODESEPARATOR", desc: "Mark for sig hashing" },
    ],
  },
  {
    category: "Control Flow",
    opcodes: [
      { name: "OP_IF", desc: "Execute block if top is truthy" },
      { name: "OP_NOTIF", desc: "Execute block if top is falsy" },
      { name: "OP_ELSE", desc: "Else branch of OP_IF" },
      { name: "OP_ENDIF", desc: "End conditional block" },
      { name: "OP_VERIFY", desc: "Fail if top is not truthy" },
      { name: "OP_RETURN", desc: "Mark output unspendable" },
    ],
  },
  {
    category: "Data Manipulation",
    opcodes: [
      { name: "OP_CAT", desc: "Concatenate two byte strings" },
      { name: "OP_SPLIT", desc: "Split bytes at position n" },
      { name: "OP_NUM2BIN", desc: "Convert number to n-byte binary" },
      { name: "OP_BIN2NUM", desc: "Convert binary to number" },
      { name: "OP_LSHIFT", desc: "Left shift" },
      { name: "OP_RSHIFT", desc: "Right shift" },
      { name: "OP_AND", desc: "Bitwise AND" },
      { name: "OP_OR", desc: "Bitwise OR" },
      { name: "OP_XOR", desc: "Bitwise XOR" },
      { name: "OP_INVERT", desc: "Bitwise NOT" },
    ],
  },
];
