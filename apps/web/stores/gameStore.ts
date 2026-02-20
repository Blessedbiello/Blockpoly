"use client";
import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";

export interface GameStateData {
  gameId: number[];
  host: PublicKey;
  status: number; // 0=waiting, 1=inProgress, 2=finished
  turnPhase: number;
  currentPlayerIndex: number;
  turnNumber: number;
  roundNumber: number;
  players: PublicKey[];
  playerCount: number;
  maxPlayers: number;
  bullRunActive: boolean;
  bullRunEndsRound: number;
  auctionSpace: number | null;
  auctionHighestBid: bigint;
  auctionHighestBidder: PublicKey | null;
  winner: PublicKey | null;
  pendingDice: [number, number] | null;
}

export interface PlayerStateData {
  wallet: PublicKey;
  playerIndex: number;
  position: number;
  doublesStreak: number;
  rugpullTurnsRemaining: number;
  hasJailFreeCard: boolean;
  propertiesOwned: number[];
  flashLoanActive: boolean;
  isBankrupt: boolean;
  bpolyBalance: bigint;
  status: number;
}

export interface PropertyStateData {
  spaceIndex: number;
  owner: PublicKey;
  liquidityPools: number;
  isFullProtocol: boolean;
  isMortgaged: boolean;
  nftAsset: PublicKey;
}

export type ModalType =
  | "buy"
  | "auction"
  | "rent"
  | "card"
  | "rugpull"
  | "trade"
  | "build"
  | "winner"
  | "mortgage"
  | null;

interface GameStore {
  // Game data
  gameId: string | null;
  gameState: GameStateData | null;
  playerStates: Map<string, PlayerStateData>;
  properties: Map<number, PropertyStateData>;
  myWallet: string | null;

  // UI state
  activeModal: ModalType;
  modalData: unknown;
  eventLog: GameEvent[];
  highlightedSpace: number | null;

  // Actions
  setGameId: (id: string) => void;
  setGameState: (gs: GameStateData) => void;
  setPlayerState: (wallet: string, ps: PlayerStateData) => void;
  setProperty: (space: number, prop: PropertyStateData) => void;
  setMyWallet: (wallet: string) => void;
  openModal: (modal: ModalType, data?: unknown) => void;
  closeModal: () => void;
  addEvent: (event: GameEvent) => void;
  setHighlightedSpace: (space: number | null) => void;
  reset: () => void;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  player?: string;
  amount?: number;
}

export const useGameStore = create<GameStore>((set) => ({
  gameId: null,
  gameState: null,
  playerStates: new Map(),
  properties: new Map(),
  myWallet: null,
  activeModal: null,
  modalData: null,
  eventLog: [],
  highlightedSpace: null,

  setGameId: (id) => set({ gameId: id }),
  setGameState: (gs) => set({ gameState: gs }),
  setPlayerState: (wallet, ps) =>
    set((s) => {
      const m = new Map(s.playerStates);
      m.set(wallet, ps);
      return { playerStates: m };
    }),
  setProperty: (space, prop) =>
    set((s) => {
      const m = new Map(s.properties);
      m.set(space, prop);
      return { properties: m };
    }),
  setMyWallet: (wallet) => set({ myWallet: wallet }),
  openModal: (modal, data = null) =>
    set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  addEvent: (event) =>
    set((s) => ({
      eventLog: [event, ...s.eventLog].slice(0, 100),
    })),
  setHighlightedSpace: (space) => set({ highlightedSpace: space }),
  reset: () =>
    set({
      gameId: null,
      gameState: null,
      playerStates: new Map(),
      properties: new Map(),
      activeModal: null,
      modalData: null,
      eventLog: [],
      highlightedSpace: null,
    }),
}));
