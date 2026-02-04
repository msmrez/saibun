"use client";

import {
  PrivateKey,
  P2PKH,
  Transaction,
  HD,
  type TransactionInput,
  type TransactionOutput,
} from "@bsv/sdk";

const P2PKH_INPUT_SIZE_BYTES = 148;
const P2PKH_OUTPUT_SIZE_BYTES = 34;
const TX_OVERHEAD_BYTES = 10;
export interface BitailsUtxo {
  txid: string;
  vout: number;
  satoshis: number;
  time?: number;
  blockheight?: number;
  confirmations?: number;
  rawTxHex?: string;
}

export interface BitailsUnspentResponse {
  address: string;
  scripthash: string;
  unspent: BitailsUtxo[];
  __meta?: {
    notice?: string;
  };
}

export interface SplitConfig {
  outputCount: number;
  satoshisPerOutput: number;
  feeRate: number; // sat/byte
  recipientMode: "single" | "xpub";
  recipientAddress?: string;
  xpub?: string;
  derivationPath?: string;
  startIndex?: number;
  derivedAddresses?: string[];
}

export interface TransactionDetails {
  txid: string;
  hex: string;
  inputs: Array<{
    txid: string;
    vout: number;
    satoshis: number;
  }>;
  outputs: Array<{
    address: string;
    satoshis: number;
    isChange: boolean;
  }>;
  totalInput: number;
  totalOutput: number;
  fee: number;
  feeRate: number;
  size: number;
}

export function generateKeyPair(): {
  privateKeyWif: string;
  address: string;
  publicKeyHex: string;
} {
  const privateKey = PrivateKey.fromRandom();
  const publicKey = privateKey.toPublicKey();
  const address = publicKey.toAddress();

  return {
    privateKeyWif: privateKey.toWif(),
    address: address,
    publicKeyHex: publicKey.toString(),
  };
}

export function importFromWif(wif: string): {
  privateKeyWif: string;
  address: string;
  publicKeyHex: string;
} {
  try {
    const privateKey = PrivateKey.fromWif(wif);
    const publicKey = privateKey.toPublicKey();
    const address = publicKey.toAddress();

    return {
      privateKeyWif: wif,
      address: address,
      publicKeyHex: publicKey.toString(),
    };
  } catch (e) {
    throw new Error("Invalid WIF format");
  }
}

export function isValidAddress(address: string): boolean {
  try {
    if (!address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
      return false;
    }
    
    const p2pkh = new P2PKH();
    p2pkh.lock(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidWif(wif: string): boolean {
  try {
    PrivateKey.fromWif(wif);
    return true;
  } catch {
    return false;
  }
}

export function isValidXpub(xpub: string): boolean {
  try {
    HD.fromString(xpub);
    return true;
  } catch {
    return false;
  }
}

export function deriveAddressesFromXpub(
  xpub: string,
  basePath: string,
  startIndex: number,
  count: number
): string[] {
  try {
    const hdKey = HD.fromString(xpub);
    const addresses: string[] = [];
    const pathParts = basePath.replace(/^m\/?/, "").split("/").filter(p => p.length > 0);
    
    let chainIndex = 0;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (part === "0" || part === "1") {
        chainIndex = parseInt(part, 10);
        break;
      }
    }

    const chainKey = hdKey.deriveChild(chainIndex);

    for (let i = startIndex; i < startIndex + count; i++) {
      try {
        const childKey = chainKey.deriveChild(i);
        const publicKey = childKey.pubKey;
        const address = publicKey.toAddress();
        addresses.push(address);
      } catch (deriveError) {
        throw new Error(`Failed to derive child key at index ${i}: ${deriveError instanceof Error ? deriveError.message : "Unknown error"}`);
      }
    }

    return addresses;
  } catch (error) {
    throw new Error(
      `Failed to derive addresses from xPub: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function estimateTransactionSize(
  inputCount: number,
  outputCount: number
): number {
  return (
    TX_OVERHEAD_BYTES +
    inputCount * P2PKH_INPUT_SIZE_BYTES +
    outputCount * P2PKH_OUTPUT_SIZE_BYTES
  );
}

export function calculateFee(
  inputCount: number,
  outputCount: number,
  feeRate: number
): number {
  const size = estimateTransactionSize(inputCount, outputCount);
  return Math.ceil(size * feeRate);
}

export async function buildSplitTransaction(
  privateKeyWif: string,
  utxos: BitailsUtxo[],
  sourceAddress: string,
  config: SplitConfig
): Promise<TransactionDetails> {
  const privateKey = PrivateKey.fromWif(privateKeyWif);
  const p2pkh = new P2PKH();

  for (const utxo of utxos) {
    if (!utxo.rawTxHex) {
      throw new Error(
        `Missing raw transaction hex for UTXO ${utxo.txid}:${utxo.vout}. Go back to the UTXOs step and fetch again in Online mode, or provide the source raw transaction hex in Offline mode.`
      );
    }
  }

  const totalInput = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);
  const totalRequiredOutput = config.outputCount * config.satoshisPerOutput;
  const estimatedFee = calculateFee(
    utxos.length,
    config.outputCount + 1,
    config.feeRate
  );

  if (totalInput < totalRequiredOutput + estimatedFee) {
    throw new Error(
      `Insufficient funds. Have ${totalInput} sats, need ${totalRequiredOutput + estimatedFee} sats (${totalRequiredOutput} for outputs + ${estimatedFee} for fees)`
    );
  }

  let recipientAddresses: string[] = [];
  if (config.recipientMode === "single" && config.recipientAddress) {
    recipientAddresses = Array(config.outputCount).fill(config.recipientAddress);
  } else if (config.recipientMode === "xpub" && config.derivedAddresses) {
    recipientAddresses = config.derivedAddresses;
  } else if (config.recipientMode === "xpub" && config.xpub) {
    recipientAddresses = deriveAddressesFromXpub(
      config.xpub,
      config.derivationPath || "m/44'/145'/0'/0",
      config.startIndex || 0,
      config.outputCount
    );
  } else {
    throw new Error("Invalid recipient configuration");
  }

  const inputs: TransactionInput[] = [];

  for (const utxo of utxos) {
    const sourceTransaction = Transaction.fromHex(utxo.rawTxHex!);
    const parsedTxid = sourceTransaction.id("hex") as string;
    if (parsedTxid !== utxo.txid) {
      throw new Error(
        `Transaction ID mismatch for UTXO. Expected ${utxo.txid}, got ${parsedTxid}`
      );
    }

    if (utxo.vout >= sourceTransaction.outputs.length) {
      throw new Error(
        `Invalid output index ${utxo.vout} for transaction ${utxo.txid} (only has ${sourceTransaction.outputs.length} outputs)`
      );
    }

    const sourceOutput = sourceTransaction.outputs[utxo.vout];
    if (sourceOutput.satoshis !== utxo.satoshis) {
      throw new Error(
        `Satoshi mismatch for UTXO ${utxo.txid}:${utxo.vout}. Expected ${utxo.satoshis}, got ${sourceOutput.satoshis}`
      );
    }

    inputs.push({
      sourceTransaction,
      sourceOutputIndex: utxo.vout,
      unlockingScriptTemplate: p2pkh.unlock(privateKey),
      sequence: 0xffffffff,
    });
  }

  const outputs: TransactionOutput[] = [];

  for (let i = 0; i < config.outputCount; i++) {
    outputs.push({
      lockingScript: p2pkh.lock(recipientAddresses[i]),
      satoshis: config.satoshisPerOutput,
    });
  }

  const totalOutputSatoshis = config.outputCount * config.satoshisPerOutput;
  const change = totalInput - totalOutputSatoshis - estimatedFee;
  const dustThreshold = 1;
  const hasChange = change > dustThreshold;
  
  if (hasChange) {
    outputs.push({
      lockingScript: p2pkh.lock(sourceAddress),
      satoshis: change,
    });
  }

  const tx = new Transaction(1, inputs, outputs, 0);
  await tx.sign();

  const hex = tx.toHex();
  const txid = tx.id("hex") as string;

  const outputDetails = outputs.map((output, index) => {
    const isChange = hasChange && index === outputs.length - 1;
    return {
      address: isChange
        ? sourceAddress
        : recipientAddresses[Math.min(index, recipientAddresses.length - 1)],
      satoshis: output.satoshis as number,
      isChange,
    };
  });

  const actualSize = hex.length / 2;
  const actualTotalOutput = outputDetails.reduce((sum, o) => sum + o.satoshis, 0);
  const actualFee = totalInput - actualTotalOutput;
  const actualFeeRate = actualFee / actualSize;

  return {
    txid,
    hex,
    inputs: utxos.map((u) => ({
      txid: u.txid,
      vout: u.vout,
      satoshis: u.satoshis,
    })),
    outputs: outputDetails,
    totalInput,
    totalOutput: actualTotalOutput,
    fee: actualFee,
    feeRate: Math.round(actualFeeRate * 100) / 100,
    size: actualSize,
  };
}

export async function broadcastTransaction(hex: string): Promise<string> {
  const response = await fetch("https://api.bitails.io/tx/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: hex }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Broadcast failed: ${errorText}`);
  }

  const result = await response.json();
  return result.txid || result.txId || result.hash;
}

export async function fetchUtxos(address: string): Promise<BitailsUnspentResponse> {
  const response = await fetch(
    `https://api.bitails.io/address/${address}/unspent`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchRawTransaction(txid: string): Promise<string> {
  const response = await fetch(
    `https://api.bitails.io/download/tx/${txid}/hex`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction ${txid}: ${response.statusText}`);
  }

  return response.text();
}

export async function fetchUtxosWithRawTx(address: string): Promise<BitailsUtxo[]> {
  const utxoResponse = await fetchUtxos(address);
  
  if (!utxoResponse.unspent || utxoResponse.unspent.length === 0) {
    return [];
  }

  const utxosWithRaw: BitailsUtxo[] = await Promise.all(
    utxoResponse.unspent.map(async (utxo) => {
      const rawTxHex = await fetchRawTransaction(utxo.txid);
      return {
        ...utxo,
        rawTxHex,
      };
    })
  );

  return utxosWithRaw;
}

export function parseBitailsUnspentJson(json: string): BitailsUnspentResponse {
  try {
    const data = JSON.parse(json);

    if (!data.address || !Array.isArray(data.unspent)) {
      throw new Error("Invalid format: missing address or unspent array");
    }

    for (const utxo of data.unspent) {
      if (
        !utxo.txid ||
        typeof utxo.vout !== "number" ||
        typeof utxo.satoshis !== "number"
      ) {
        throw new Error("Invalid UTXO format: missing txid, vout, or satoshis");
      }
    }

    return data as BitailsUnspentResponse;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw error;
  }
}

export function parseRawTransactionHex(hex: string): Transaction {
  try {
    const cleanHex = hex.trim().replace(/\s/g, "");
    return Transaction.fromHex(cleanHex);
  } catch (error) {
    throw new Error("Invalid transaction hex format");
  }
}

export function extractUtxoFromRawTx(rawTxHex: string, vout: number): BitailsUtxo {
  const cleanHex = rawTxHex.trim().replace(/\s/g, "");
  
  if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
    throw new Error("Invalid hex format. Raw transaction should only contain hexadecimal characters.");
  }
  
  if (cleanHex.length < 20) {
    throw new Error("Transaction hex is too short. Make sure you're pasting the complete raw transaction.");
  }
  
  let tx: Transaction;
  try {
    tx = Transaction.fromHex(cleanHex);
  } catch (parseError) {
    throw new Error(`Failed to parse transaction: ${parseError instanceof Error ? parseError.message : "Invalid transaction format"}`);
  }
  
  const txid = tx.id("hex") as string;
  
  if (vout < 0) {
    throw new Error("Output index cannot be negative.");
  }
  
  if (vout >= tx.outputs.length) {
    throw new Error(`Output index ${vout} is out of range. Transaction only has ${tx.outputs.length} output(s). Valid indices: 0-${tx.outputs.length - 1}`);
  }
  
  const output = tx.outputs[vout];
  
  let satoshis: number;
  if (typeof output.satoshis === "bigint") {
    satoshis = Number(output.satoshis);
  } else {
    satoshis = output.satoshis as number;
  }
  
  if (!Number.isSafeInteger(satoshis)) {
    throw new Error(`Satoshi value ${satoshis} exceeds safe integer range.`);
  }
  
  return {
    txid,
    vout,
    satoshis,
    rawTxHex: cleanHex,
  };
}

export function satoshisToBsv(satoshis: number): string {
  return (satoshis / 100000000).toFixed(8);
}

export function bsvToSatoshis(bsv: number): number {
  return Math.round(bsv * 100000000);
}

export function downloadTransaction(hex: string, txid: string): void {
  const blob = new Blob([hex], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tx-${txid.substring(0, 8)}.hex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
