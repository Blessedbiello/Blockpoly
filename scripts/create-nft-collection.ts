/**
 * Creates the Blockpoly Metaplex Core NFT collection on devnet.
 * Run: npx ts-node scripts/create-nft-collection.ts
 *
 * Requires: pnpm add @metaplex-foundation/mpl-core @metaplex-foundation/umi
 *           @metaplex-foundation/umi-bundle-defaults
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import {
  keypairIdentity,
  generateSigner,
  publicKey,
} from "@metaplex-foundation/umi";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const WALLET_PATH =
  process.env.WALLET_PATH ?? `${process.env.HOME}/.config/solana/id.json`;

// Arweave URI for collection metadata (upload before running)
const COLLECTION_URI =
  process.env.COLLECTION_URI ??
  "https://arweave.net/blockpoly-collection-metadata.json";

async function main() {
  const walletJson = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
  const umi = createUmi(RPC_URL).use(mplCore());

  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(walletJson)
  );
  umi.use(keypairIdentity(keypair));

  const collectionSigner = generateSigner(umi);
  console.log("Collection address:", collectionSigner.publicKey);

  const tx = await createCollection(umi, {
    collection: collectionSigner,
    name: "Blockpoly Properties",
    uri: COLLECTION_URI,
  }).sendAndConfirm(umi);

  console.log("Collection created!");
  console.log("Signature:", tx.signature);

  const output = {
    collection: collectionSigner.publicKey,
    uri: COLLECTION_URI,
  };

  const outPath = path.join(process.cwd(), ".nft-collection.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log("Saved to", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
