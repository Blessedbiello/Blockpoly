export interface CardDef {
  id: number;
  name: string;
  description: string;
  deck: "alpha" | "governance";
}

export const ALPHA_CALL_CARDS: CardDef[] = [
  { id: 0, deck: "alpha", name: "Advance to Genesis Block", description: "Move to space 0, collect 200 BPOLY" },
  { id: 1, deck: "alpha", name: "Advance to Solana", description: "Move to space 39. Collect 200 BPOLY if you pass Genesis Block" },
  { id: 2, deck: "alpha", name: "Advance to Nearest Bridge", description: "Move to nearest Wormhole/deBridge/Allbridge/Mayan. Pay 2× rent if owned" },
  { id: 3, deck: "alpha", name: "Advance to Wormhole", description: "Move to space 5. Pay rent if owned. Collect 200 BPOLY if you passed Genesis Block" },
  { id: 4, deck: "alpha", name: "Staking Rewards", description: "Collect 50 BPOLY from bank" },
  { id: 5, deck: "alpha", name: "Get Out of Rug Pull Free", description: "Keep this card. Use to exit Rug Pull Zone at no cost. Tradeable." },
  { id: 6, deck: "alpha", name: "MEV Bot Attack", description: "Pay toll = last dice roll × 4 BPOLY to bank" },
  { id: 7, deck: "alpha", name: "Market Crash", description: "Lose 20% of current BPOLY balance" },
  { id: 8, deck: "alpha", name: "Bull Run", description: "All property rents doubled for the next full round" },
  { id: 9, deck: "alpha", name: "51% Attack", description: "Steal the last rent payment made by any player this turn" },
  { id: 10, deck: "alpha", name: "Flash Loan", description: "Borrow 200 BPOLY now. Repay 210 next turn or pay 50 BPOLY penalty" },
  { id: 11, deck: "alpha", name: "Protocol Hack", description: "Lose your cheapest owned unprotected property (returned to bank, no refund)" },
  { id: 12, deck: "alpha", name: "Go Back 3 Spaces", description: "Move back 3 spaces. Apply landing effect of new space" },
  { id: 13, deck: "alpha", name: "SEC Investigation", description: "Go directly to Rug Pull Zone. Do not pass Genesis Block" },
  { id: 14, deck: "alpha", name: "Whale Dump", description: "Forced: sell your most expensive property back to bank at 50% purchase price" },
  { id: 15, deck: "alpha", name: "Airdrop Season", description: "Advance to nearest unowned property. May buy it at 50% price this turn" },
];

export const GOVERNANCE_VOTE_CARDS: CardDef[] = [
  { id: 0, deck: "governance", name: "Protocol Treasury Release", description: "Collect 200 BPOLY from bank" },
  { id: 1, deck: "governance", name: "Validator Node Income", description: "Collect 100 BPOLY from bank" },
  { id: 2, deck: "governance", name: "DAO Airdrop", description: "Collect 10 BPOLY from every other player" },
  { id: 3, deck: "governance", name: "Get Out of Rug Pull Free", description: "Keep this card. Use to exit Rug Pull Zone at no cost. Tradeable." },
  { id: 4, deck: "governance", name: "Smart Contract Exploit Found", description: "Go directly to Rug Pull Zone" },
  { id: 5, deck: "governance", name: "Gas Fee Rebate", description: "Collect 50 BPOLY from bank" },
  { id: 6, deck: "governance", name: "Infrastructure Levy", description: "Pay 40 BPOLY per LP + 115 BPOLY per Full Protocol you own" },
  { id: 7, deck: "governance", name: "Protocol Upgrade Vote", description: "Pay 100 BPOLY to bank (security audit fee)" },
  { id: 8, deck: "governance", name: "Liquidity Mining Rewards", description: "Collect 25 BPOLY per LP you own across all properties" },
  { id: 9, deck: "governance", name: "Token Unlock Cliff", description: "Pay 150 BPOLY to every other player" },
  { id: 10, deck: "governance", name: "Bridge Exploited", description: "If you own a Bridge: lose it. If not: collect 50 BPOLY" },
  { id: 11, deck: "governance", name: "DAO Birthday Vote", description: "All other players pay you 50 BPOLY" },
  { id: 12, deck: "governance", name: "Yield Farming Season", description: "Move to DeFi Summer (space 20). Collect 200 BPOLY if you pass Genesis Block" },
  { id: 13, deck: "governance", name: "Regulatory Compliance Fine", description: "Pay 50 BPOLY to bank" },
  { id: 14, deck: "governance", name: "NFT Royalty Income", description: "Collect 20 BPOLY per complete color set you own" },
  { id: 15, deck: "governance", name: "Rug Pull Insurance", description: "If in Rug Pull Zone: exit free. Otherwise: collect 75 BPOLY from bank" },
];

export function getCard(deck: 0 | 1, id: number): CardDef {
  return deck === 0 ? ALPHA_CALL_CARDS[id] : GOVERNANCE_VOTE_CARDS[id];
}
