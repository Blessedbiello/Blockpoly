# Blockpoly – CLAUDE.md

Solana on-chain Monopoly. Every game action is a signed transaction; all state lives on-chain.
Monorepo: `programs/` (Anchor/Rust) + `apps/web` (Next.js) + future `apps/mobile`, `apps/console`.

---

## Stack

| Layer | Tech |
|---|---|
| Smart contract | Anchor 0.32.1, Rust, Solana devnet → mainnet |
| Frontend | Next.js 14 App Router, Tailwind CSS, shadcn/ui |
| Wallet | @solana/wallet-adapter-react (Phantom, Backpack, Solflare) |
| NFTs | Metaplex Core — mpl-core Core Assets with FreezeDelegate |
| Token | BPOLY SPL (6 decimals) |
| Randomness | Switchboard VRF |
| Real-time | Helius Enhanced WebSocket account subscriptions |
| State mgmt | React Query v5 + Zustand |
| Package mgr | pnpm (monorepo workspace) |
| Build | Turbo |
| Hosting | Vercel |

---

## Program ID

`Bp1ypXF8ggBd7f6sWuXEsWs8iSU9L3dGAD9DPpAZ7bHm` (devnet, localnet)

---

## What's Implemented

### Anchor Program (`programs/blockpoly/src/`)

#### State (PDAs)
- [x] `GameState` — `[b"game_state", game_id]`
- [x] `PlayerState` — `[b"player_state", game_id, wallet]`
- [x] `PropertyState` — `[b"property_state", game_id, &[space_index]]` (lazy init)
- [x] `TradeOffer` — `[b"trade_offer", game_id, proposer]`

#### Supporting modules
- [x] `board.rs` — 40-space board with all prices, rents, LP/protocol costs
- [x] `constants.rs` — seeds, game constants, BPOLY amounts
- [x] `errors.rs` — full `BlockpolyError` enum
- [x] `events.rs` — all on-chain events

#### Instructions (all 22)
- [x] `initialize_game` — create GameState + bank BPOLY ATA
- [x] `join_game` — create PlayerState, transfer 1500 BPOLY starting balance
- [x] `start_game` — shuffle card decks (Fisher-Yates with VRF seed), mark InProgress
- [x] `request_dice_roll` — sets AwaitingVRF phase
- [x] `consume_randomness` — VRF callback: derive dice, move player, detect jail/doubles
- [x] `resolve_landing` — dispatch to buy/rent/tax/card/jail based on space type
- [x] `buy_property` — lazy PropertyState init, BPOLY payment, player ownership
- [x] `decline_buy` — triggers auction in GameState
- [x] `auction_bid` — bid + auto-finalize when expired
- [x] `pay_rent` — full rent table (LPs, protocol, bridges, utilities, bull run)
- [x] `build_lp` — even-building enforced, complete color set required
- [x] `build_protocol` — upgrade from 4 LPs to Full Protocol
- [x] `sell_lp` — sell back at 50% cost
- [x] `draw_card` — draw from VRF-shuffled decks
- [x] `resolve_card` — all 16 Alpha Call + 16 Governance Vote effects
- [x] `handle_rugpull` — bail / jail-free card / attempt doubles
- [x] `mortgage_property` — receive 50% price from bank
- [x] `unmortgage_property` — pay mortgage + 10% interest
- [x] `propose_trade` — TradeOffer PDA
- [x] `accept_trade` — atomic property + BPOLY swap
- [x] `reject_trade` — close TradeOffer PDA
- [x] `declare_bankruptcy` — eliminate player, transfer assets
- [x] `claim_prize` — winner collects SOL prize pool

### Frontend (`apps/web/`)
- [x] Next.js 14 App Router scaffold
- [ ] Wallet adapter + providers
- [ ] Anchor client setup
- [ ] PDA helpers
- [ ] Board data (TypeScript mirror of board.rs)
- [ ] Lobby: create/join game
- [ ] Game board: 11×11 CSS Grid
- [ ] All game modals
- [ ] WebSocket game state (useGame hook)
- [ ] useGameActions hook
- [ ] Session keys (ephemeral keypair)

### Scripts (`scripts/`)
- [ ] `mint-bpoly-token.ts`
- [ ] `create-nft-collection.ts`
- [ ] `generate-metadata.ts`
- [ ] `upload-assets.ts`

---

## Hackathon Tracks

1. **PSG1-first by Play Solana** — fully on-chain, no centralized server
2. **On-chain Assets by Metaplex** — property NFTs via Metaplex Core
3. **Solana On-Chain & Real-Time Gaming by MagicBlock** — stretch: ephemeral rollups
4. **DeFi & Gamification by Jupiter** — Jupiter at space 31 (Green tier)

---

## Conventions

- BPOLY amounts: always in micro-units (6 decimals). `1 BPOLY = 1_000_000`
- All amounts in `constants.rs` are pre-scaled
- `board.rs` uses `const fn bpoly(n: u64) -> u64 { n * 1_000_000 }`
- PDAs are lazy — no PropertyState = bank-owned
- `GameStatus`: WaitingForPlayers → InProgress → Finished
- `TurnPhase`: RollDice → AwaitingVRF → LandingEffect → BuyDecision / DrawCard / AuctionPhase / RugPullDecision
- Monorepo: never add AI credits/attribution to code

---

## Key Paths

```
programs/blockpoly/src/lib.rs          — program entrypoint
programs/blockpoly/src/board.rs        — 40-space board data
programs/blockpoly/src/state/          — all PDA account structs
programs/blockpoly/src/instructions/   — all 22 instructions
apps/web/                              — Next.js frontend
```

---

## Git + Commits

- Commit at every major milestone (program build, frontend scaffold, feature complete, etc.)
- Remote: https://github.com/Blessedbiello/Blockpoly.git
- Branch: `main`
- No `--no-verify`, no force push to main
- No AI attribution in commit messages or code comments
