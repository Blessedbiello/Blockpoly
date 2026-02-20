/**
 * Generate Metaplex-compatible JSON metadata for all 28 purchasable board spaces.
 * Output goes to scripts/metadata/<space_index>.json
 * Upload to Arweave via: npx ts-node scripts/upload-assets.ts
 */

import * as fs from "fs";
import * as path from "path";

const METADATA_DIR = path.join(__dirname, "metadata");

interface SpaceMeta {
  index: number;
  name: string;
  description: string;
  group: string;
  price: number;
  baseRent: number;
  protocolRent: number;
  image: string; // arweave URI — set after upload
}

const SPACES: SpaceMeta[] = [
  { index: 1,  name: "BONK",          description: "The degen dog coin of Solana — 1T supply, infinite memes.",      group: "Brown",     price: 60,  baseRent: 2,  protocolRent: 250,  image: "ar://blockpoly/bonk.png" },
  { index: 3,  name: "dogwifhat",      description: "WIF. A dog. A hat. A billion dollar meme.",                      group: "Brown",     price: 60,  baseRent: 4,  protocolRent: 450,  image: "ar://blockpoly/wif.png" },
  { index: 5,  name: "Wormhole",       description: "Cross-chain bridge connecting Solana to every other ecosystem.", group: "Bridge",    price: 200, baseRent: 25, protocolRent: 0,    image: "ar://blockpoly/wormhole.png" },
  { index: 6,  name: "Pyth Network",   description: "Real-time price oracles powering Solana DeFi.",                 group: "Light Blue",price: 100, baseRent: 6,  protocolRent: 550,  image: "ar://blockpoly/pyth.png" },
  { index: 8,  name: "Switchboard",    description: "Decentralized oracle network with VRF for on-chain randomness.", group: "Light Blue",price: 100, baseRent: 6,  protocolRent: 550,  image: "ar://blockpoly/switchboard.png" },
  { index: 9,  name: "Clockwork",      description: "Automated smart contract scheduler on Solana.",                  group: "Light Blue",price: 120, baseRent: 8,  protocolRent: 600,  image: "ar://blockpoly/clockwork.png" },
  { index: 11, name: "Solflare",       description: "The DeFi-native Solana wallet since 2020.",                     group: "Pink",      price: 140, baseRent: 10, protocolRent: 750,  image: "ar://blockpoly/solflare.png" },
  { index: 12, name: "QuickNode",      description: "The premium RPC provider of choice for Solana builders.",       group: "Utility",   price: 150, baseRent: 0,  protocolRent: 0,    image: "ar://blockpoly/quicknode.png" },
  { index: 13, name: "Phantom",        description: "The most-used Solana wallet. 3M+ users. Slick UI.",             group: "Pink",      price: 140, baseRent: 10, protocolRent: 750,  image: "ar://blockpoly/phantom.png" },
  { index: 14, name: "Backpack",       description: "The mad lads wallet. xNFTs. Saga mobile. Crypto-native.",       group: "Pink",      price: 160, baseRent: 12, protocolRent: 900,  image: "ar://blockpoly/backpack.png" },
  { index: 15, name: "deBridge",       description: "Cross-chain bridging and DLN: zero slippage, native execution.", group: "Bridge",   price: 200, baseRent: 25, protocolRent: 0,    image: "ar://blockpoly/debridge.png" },
  { index: 16, name: "Metaplex",       description: "The NFT standard on Solana. Candy Machine, Core, Bubblegum.",   group: "Orange",    price: 180, baseRent: 14, protocolRent: 950,  image: "ar://blockpoly/metaplex.png" },
  { index: 18, name: "Magic Eden",     description: "Solana's #1 NFT marketplace. Cross-chain now.",                 group: "Orange",    price: 180, baseRent: 14, protocolRent: 950,  image: "ar://blockpoly/magiceden.png" },
  { index: 19, name: "Tensor",         description: "The pro NFT trading platform with on-chain AMM.",               group: "Orange",    price: 200, baseRent: 16, protocolRent: 1000, image: "ar://blockpoly/tensor.png" },
  { index: 21, name: "Raydium",        description: "The OG Solana AMM. Concentrated liquidity. Launchpad.",         group: "Red",       price: 220, baseRent: 18, protocolRent: 1050, image: "ar://blockpoly/raydium.png" },
  { index: 23, name: "Orca",           description: "User-friendly AMM with Whirlpools for concentrated liquidity.",  group: "Red",       price: 220, baseRent: 18, protocolRent: 1050, image: "ar://blockpoly/orca.png" },
  { index: 24, name: "Meteora",        description: "Dynamic liquidity pools. DLMM. The yield machine.",             group: "Red",       price: 240, baseRent: 20, protocolRent: 1100, image: "ar://blockpoly/meteora.png" },
  { index: 25, name: "Allbridge",      description: "Bridging SOL to every chain with stablecoin pools.",            group: "Bridge",    price: 200, baseRent: 25, protocolRent: 0,    image: "ar://blockpoly/allbridge.png" },
  { index: 26, name: "Marginfi",       description: "The leading lending protocol on Solana. mrgnlend.",             group: "Yellow",    price: 260, baseRent: 22, protocolRent: 1200, image: "ar://blockpoly/marginfi.png" },
  { index: 27, name: "Kamino Finance", description: "Automated liquidity vaults and lending on Solana.",             group: "Yellow",    price: 260, baseRent: 22, protocolRent: 1200, image: "ar://blockpoly/kamino.png" },
  { index: 28, name: "Triton One",     description: "Enterprise-grade Solana RPC infrastructure.",                   group: "Utility",   price: 150, baseRent: 0,  protocolRent: 0,    image: "ar://blockpoly/triton.png" },
  { index: 29, name: "Drift Protocol", description: "The perpetuals and spot DEX on Solana. $50B+ volume.",          group: "Yellow",    price: 280, baseRent: 24, protocolRent: 1275, image: "ar://blockpoly/drift.png" },
  { index: 31, name: "Jupiter",        description: "The best swap aggregator on Solana. JUP governance. $100B+ vol.",group: "Green",    price: 300, baseRent: 26, protocolRent: 1275, image: "ar://blockpoly/jupiter.png" },
  { index: 32, name: "Jito",           description: "MEV infrastructure + liquid staking. JitoSOL yield.",           group: "Green",     price: 300, baseRent: 26, protocolRent: 1275, image: "ar://blockpoly/jito.png" },
  { index: 34, name: "Nosana",         description: "Decentralized GPU compute marketplace on Solana.",              group: "Green",     price: 320, baseRent: 28, protocolRent: 1400, image: "ar://blockpoly/nosana.png" },
  { index: 35, name: "Mayan Finance",  description: "Cross-chain swaps and bridging via Wormhole.",                  group: "Bridge",    price: 200, baseRent: 25, protocolRent: 0,    image: "ar://blockpoly/mayan.png" },
  { index: 37, name: "Helius",         description: "The #1 Solana dev platform. RPC, Webhooks, DAS API, Geyser.",   group: "Dark Blue", price: 350, baseRent: 35, protocolRent: 1500, image: "ar://blockpoly/helius.png" },
  { index: 39, name: "Solana",         description: "65,000 TPS. Sub-cent fees. The crown jewel of Blockpoly.",       group: "Dark Blue", price: 400, baseRent: 50, protocolRent: 2000, image: "ar://blockpoly/solana.png" },
];

if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

for (const space of SPACES) {
  const metadata = {
    name: `Blockpoly: ${space.name}`,
    symbol: "BLKPLY",
    description: space.description,
    image: space.image,
    attributes: [
      { trait_type: "Space Index",     value: space.index },
      { trait_type: "Property Group",  value: space.group },
      { trait_type: "Purchase Price",  value: space.price },
      { trait_type: "Base Rent",       value: space.baseRent },
      { trait_type: "Max Protocol Rent", value: space.protocolRent },
      { trait_type: "Game",            value: "Blockpoly" },
    ],
    properties: {
      files: [{ uri: space.image, type: "image/png" }],
      category: "image",
    },
  };

  const outPath = path.join(METADATA_DIR, `${space.index}.json`);
  fs.writeFileSync(outPath, JSON.stringify(metadata, null, 2));
  console.log(`Generated: ${outPath}`);
}

console.log(`\nGenerated ${SPACES.length} metadata files in ${METADATA_DIR}`);
