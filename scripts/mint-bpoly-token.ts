/**
 * Mint the BPOLY SPL token and fund the bank vault ATA.
 * Run: npx ts-node scripts/mint-bpoly-token.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const WALLET_PATH =
  process.env.WALLET_PATH ?? `${process.env.HOME}/.config/solana/id.json`;

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  // Load payer wallet
  const walletJson = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(walletJson));

  console.log("Payer:", payer.publicKey.toString());
  const balance = await connection.getBalance(payer.publicKey);
  console.log("Balance:", balance / 1e9, "SOL");

  // Create BPOLY mint
  console.log("\nCreating BPOLY mint...");
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null,            // freeze authority (none)
    6,               // decimals
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("BPOLY Mint:", mint.toString());

  // Mint initial supply: 10,000,000 BPOLY
  const TOTAL_SUPPLY = 10_000_000 * 1_000_000; // in micro-BPOLY

  // Create ATA for payer (will be used as bank vault ATA in game)
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  console.log("Payer ATA:", payerAta.address.toString());

  await mintTo(
    connection,
    payer,
    mint,
    payerAta.address,
    payer,
    BigInt(TOTAL_SUPPLY)
  );
  console.log(`Minted ${TOTAL_SUPPLY / 1_000_000} BPOLY to payer ATA`);

  // Save addresses
  const output = {
    mint: mint.toString(),
    payerAta: payerAta.address.toString(),
    decimals: 6,
    totalSupply: TOTAL_SUPPLY / 1_000_000,
  };

  fs.writeFileSync(
    path.join(__dirname, "../.bpoly-mint.json"),
    JSON.stringify(output, null, 2)
  );
  console.log("\nSaved to .bpoly-mint.json");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
