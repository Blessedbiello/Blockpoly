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

`AicXQXhiHgzaxTXpbxYEriXSQdBRQNbqWgcMU1N57q9n` (devnet, localnet)

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

#### Instructions (all 24)
- [x] `initialize_game` — create GameState + bank BPOLY ATA
- [x] `join_game` — create PlayerState, transfer 1500 BPOLY starting balance
- [x] `start_game` — shuffle card decks (Fisher-Yates with VRF seed), mark InProgress
- [x] `request_dice_roll` — sets AwaitingVRF phase
- [x] `consume_randomness` — VRF callback: derive dice, move player, detect jail/doubles
- [x] `resolve_landing` — dispatch to buy/rent/tax/card/jail based on space type
- [x] `buy_property` — lazy PropertyState init, BPOLY payment, mpl-core NFT CPI mint
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
- [x] `delegate_game` — MagicBlock delegation via raw CPI (GameState + PlayerState PDAs)
- [x] `undelegate_game` — commit + undelegate from MagicBlock

### Frontend (`apps/web/`)
- [x] Next.js 14 App Router scaffold
- [x] Wallet adapter + providers (`@solana/react-hooks`, kit-native, `@solana/wallet-adapter-react`)
- [x] Anchor client setup (`lib/anchor-client.ts`, IDL loading)
- [x] PDA helpers (`lib/pdas.ts`)
- [x] Board data (`lib/board-data.ts`, TypeScript mirror of board.rs)
- [x] Lobby: create/join game (`CreateGameForm`, `GameList` with on-chain fetch)
- [x] Game board: 11×11 CSS Grid (`BoardCanvas`, `BoardSpace`, `PlayerToken`)
- [x] All game modals (Buy, Auction, Build, Rent, RugPull, Mortgage, Trade, CardDraw, Winner, Jupiter)
- [x] WebSocket game state (`useGame.ts` with Helius/MagicBlock WS subscriptions)
- [x] `useGameActions.ts` — all 25 instructions + co-signer + MagicBlock routing
- [x] Session keys — `useSessionKey.ts` + `SessionKeyPanel` component
- [x] `GameClient.tsx` — full game page wrapper with auto-delegate/undelegate
- [x] Jupiter integration — `jupiter-client.ts`, `useJupiterSwap`, `JupiterSwapPanel`, `JupiterSwapModal`
- [x] MagicBlock integration — conditional routing, delegation indicator, graceful degradation

### Scripts (`scripts/`)
- [x] `mint-bpoly-token.ts` — BPOLY deployed at `6p3LtZQ9ko2oXRijE6Yb87re5PaoB9dybXxUkB4bGNb6`
- [ ] `create-nft-collection.ts`
- [ ] `generate-metadata.ts`
- [ ] `upload-assets.ts`

### Shared Package (`packages/shared/`)
- [x] `@blockpoly/shared` — extracted pure TS modules from apps/web
- [x] constants, board-data, card-data, rent-calculator, pdas, jupiter-client
- [x] Zustand game store + Anchor account decoders
- [x] IDL bundled at `src/idl/blockpoly.json`

### Mobile App (`apps/mobile/`)
- [x] Expo React Native scaffold (SDK 52, RN 0.76)
- [x] MWA wallet provider + `useMobileWallet` hook
- [x] `useMobileGame` — WebSocket subscriptions via shared decoders
- [x] `useMobileGameActions` — all 24 instructions via MWA signing
- [x] 11x11 `BoardGrid` + `BoardSpace` + `PlayerToken` components
- [x] 10 game modals (Buy, Auction, Rent, Card, RugPull, Trade, Build, Mortgage, Winner, Jupiter)
- [x] `LobbyScreen` + `GameScreen` with React Navigation
- [x] Metro config for monorepo `@blockpoly/shared` resolution
- [x] EAS build config for Android APK (Seeker dApp Store)
- [x] Buffer + crypto polyfills for React Native

### Remaining / Stretch
- [x] Metaplex Core NFT minting in `buy_property` (raw CPI — no mpl-core crate due to version conflict)
- [x] MagicBlock ephemeral rollup integration (`delegate_game` / `undelegate_game`)
- [x] Jupiter DEX integration (lobby swap, space 31 modal, winner cash out)
- [ ] Anchor integration test suite (`tests/blockpoly.ts`)
- [ ] `create-nft-collection.ts` + metadata upload to Arweave
- [ ] Vercel deployment
- [ ] Session key program-level delegation (stretch — needs new program instruction)
- [ ] dApp Store CLI submission (publisher/app/release NFTs)

---

## Hackathon Tracks

1. **PSG1-first by Play Solana** — fully on-chain, no centralized server
2. **On-chain Assets by Metaplex** — property NFTs via Metaplex Core (raw CPI in buy_property)
3. **Solana On-Chain & Real-Time Gaming by MagicBlock** — ephemeral rollup delegation for turn loop
4. **DeFi & Gamification by Jupiter** — Jupiter at space 31 + lobby swap + winner cash out

---

## Conventions

- BPOLY amounts: always in micro-units (6 decimals). `1 BPOLY = 1_000_000`
- All amounts in `constants.rs` are pre-scaled
- `board.rs` uses `const fn bpoly(n: u64) -> u64 { n * 1_000_000 }`
- PDAs are lazy — no PropertyState = bank-owned
- `GameStatus`: WaitingForPlayers → InProgress → Finished
- `TurnPhase`: RollDice → AwaitingVRF → LandingEffect → BuyDecision / DrawCard / AuctionPhase / RugPullDecision
- Shared package: `@blockpoly/shared` (workspace:*) — pure TS, no React/Next.js deps
- Web lib files re-export from shared — no duplication
- Mobile uses MWA `transact()` for signing (no wallet-adapter-react)
- Monorepo: never add AI credits/attribution to code

---

## Key Paths

```
programs/blockpoly/src/lib.rs          — program entrypoint
programs/blockpoly/src/board.rs        — 40-space board data
programs/blockpoly/src/state/          — all PDA account structs
programs/blockpoly/src/instructions/   — all 22 instructions
packages/shared/src/                   — shared TS logic (@blockpoly/shared)
apps/web/                              — Next.js frontend
apps/mobile/                           — Expo React Native (Seeker dApp Store)
```

---

## Git + Commits

- Commit at every major milestone (program build, frontend scaffold, feature complete, etc.)
- Remote: https://github.com/Blessedbiello/Blockpoly.git
- Branch: `main`
- No `--no-verify`, no force push to main
- No AI attribution in commit messages or code comments
