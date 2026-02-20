import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";

const PROGRAM_ID = new PublicKey("Bp1ypXF8ggBd7f6sWuXEsWs8iSU9L3dGAD9DPpAZ7bHm");
const SEED_GAME_STATE    = Buffer.from("game_state");
const SEED_PLAYER_STATE  = Buffer.from("player_state");
const SEED_PROPERTY_STATE = Buffer.from("property_state");
const SEED_BANK_VAULT    = Buffer.from("bank_vault");

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function gameId(label: string): Uint8Array {
  const buf = Buffer.alloc(32);
  Buffer.from(label).copy(buf);
  return buf;
}

function findPDA(seeds: Buffer[], programId: PublicKey) {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

async function airdropIfNeeded(
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  lamports = 2e9
) {
  const bal = await connection.getBalance(pubkey);
  if (bal < lamports / 2) {
    const sig = await connection.requestAirdrop(pubkey, lamports);
    await connection.confirmTransaction(sig);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe("blockpoly", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Blockpoly as Program<any>;
  const connection = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;

  // Test keypairs
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();

  let bpolyMint: PublicKey;
  let bankVaultPDA: PublicKey;
  let bankVaultBump: number;
  let bankAta: PublicKey;
  let gameStatePDA: PublicKey;
  let gameStateBump: number;

  const GID = gameId("test-game-001");
  const DUMMY_NFT_COLLECTION = Keypair.generate().publicKey;

  before(async () => {
    // Airdrop to test wallets
    await airdropIfNeeded(connection, payer.publicKey, 10e9);
    await airdropIfNeeded(connection, player1.publicKey, 5e9);
    await airdropIfNeeded(connection, player2.publicKey, 5e9);

    // Create BPOLY mint
    bpolyMint = await createMint(
      connection, payer, payer.publicKey, null, 6, undefined, undefined, TOKEN_PROGRAM_ID
    );

    // Derive bank vault PDA
    [bankVaultPDA, bankVaultBump] = findPDA([SEED_BANK_VAULT, Buffer.from(GID)], PROGRAM_ID);

    // Create bank ATA
    bankAta = await createAssociatedTokenAccount(
      connection, payer, bpolyMint, bankVaultPDA, true
    );

    // Mint 10M BPOLY to bank
    await mintTo(
      connection, payer, bpolyMint, bankAta, payer, BigInt(10_000_000 * 1_000_000)
    );

    // Derive game state PDA
    [gameStatePDA, gameStateBump] = findPDA([SEED_GAME_STATE, Buffer.from(GID)], PROGRAM_ID);

    console.log("Setup complete:");
    console.log("  BPOLY Mint:", bpolyMint.toString());
    console.log("  Bank Vault:", bankVaultPDA.toString());
    console.log("  Game State:", gameStatePDA.toString());
  });

  // ── initialize_game ────────────────────────────────────────────────────────

  it("initializes a game", async () => {
    const tx = await program.methods
      .initializeGame(
        Array.from(GID),
        4,               // max_players
        new BN(10_000_000), // entry_fee_lamports = 0.01 SOL
        DUMMY_NFT_COLLECTION
      )
      .accounts({
        host: payer.publicKey,
        gameState: gameStatePDA,
        bpolyMint,
        bankVault: bankVaultPDA,
        bankBpolyAta: bankAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([payer])
      .rpc();

    console.log("initializeGame tx:", tx);

    const gameState = await program.account.gameState.fetch(gameStatePDA);
    assert.equal(gameState.playerCount, 0);
    assert.equal(gameState.maxPlayers, 4);
    assert.equal(gameState.status.waitingForPlayers !== undefined, true);
    console.log("  Game status: WaitingForPlayers ✓");
  });

  // ── join_game ──────────────────────────────────────────────────────────────

  it("player1 joins the game", async () => {
    const [player1StatePDA] = findPDA(
      [SEED_PLAYER_STATE, Buffer.from(GID), player1.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const player1Ata = await getAssociatedTokenAddress(bpolyMint, player1.publicKey);

    const tx = await program.methods
      .joinGame(Array.from(GID))
      .accounts({
        player: player1.publicKey,
        gameState: gameStatePDA,
        playerState: player1StatePDA,
        playerBpolyAta: player1Ata,
        bpolyMint,
        bankVault: bankVaultPDA,
        bankBpolyAta: bankAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([player1])
      .rpc();

    console.log("joinGame (p1) tx:", tx);

    const ps = await program.account.playerState.fetch(player1StatePDA);
    assert.equal(ps.playerIndex, 0);
    assert.equal(ps.position, 0);
    // Starting balance = 1500 BPOLY = 1_500_000_000 micro
    assert.equal(ps.bpolyBalance.toString(), "1500000000");
    console.log("  Player1 balance: 1500 BPOLY ✓");
  });

  it("player2 joins the game", async () => {
    const [player2StatePDA] = findPDA(
      [SEED_PLAYER_STATE, Buffer.from(GID), player2.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const player2Ata = await getAssociatedTokenAddress(bpolyMint, player2.publicKey);

    await program.methods
      .joinGame(Array.from(GID))
      .accounts({
        player: player2.publicKey,
        gameState: gameStatePDA,
        playerState: player2StatePDA,
        playerBpolyAta: player2Ata,
        bpolyMint,
        bankVault: bankVaultPDA,
        bankBpolyAta: bankAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([player2])
      .rpc();

    const gs = await program.account.gameState.fetch(gameStatePDA);
    assert.equal(gs.playerCount, 2);
    console.log("  Player count: 2 ✓");
  });

  // ── start_game ─────────────────────────────────────────────────────────────

  it("host starts the game", async () => {
    // Random shuffle seed (in prod: VRF output)
    const shuffleSeed = Array.from(crypto.getRandomValues(new Uint8Array(32)));

    await program.methods
      .startGame(Array.from(GID), shuffleSeed)
      .accounts({
        host: payer.publicKey,
        gameState: gameStatePDA,
      })
      .signers([payer])
      .rpc();

    const gs = await program.account.gameState.fetch(gameStatePDA);
    assert.equal(gs.status.inProgress !== undefined, true, "Game should be InProgress");
    assert.equal(gs.turnNumber, 1);
    console.log("  Game status: InProgress ✓");
    console.log("  Alpha deck:", gs.alphaCallDeck.slice(0, 4).join(","), "...");
  });

  // ── request_dice_roll + consume_randomness ─────────────────────────────────

  it("player1 rolls dice (mock VRF)", async () => {
    const [player1StatePDA] = findPDA(
      [SEED_PLAYER_STATE, Buffer.from(GID), player1.publicKey.toBuffer()],
      PROGRAM_ID
    );

    // request_dice_roll
    await program.methods
      .requestDiceRoll(Array.from(GID))
      .accounts({
        player: player1.publicKey,
        gameState: gameStatePDA,
        playerState: player1StatePDA,
      })
      .signers([player1])
      .rpc();

    let gs = await program.account.gameState.fetch(gameStatePDA);
    assert.equal(gs.turnPhase.awaitingVrf !== undefined, true, "Should be AwaitingVRF");
    console.log("  Phase: AwaitingVRF ✓");

    // consume_randomness (mock: die1=4, die2=2 → total 6, no doubles)
    const randomBytes = new Array(32).fill(0);
    randomBytes[0] = 3;  // die1 = (3 % 6) + 1 = 4
    randomBytes[1] = 1;  // die2 = (1 % 6) + 1 = 2

    await program.methods
      .consumeRandomness(Array.from(GID), randomBytes)
      .accounts({
        authority: player1.publicKey,
        gameState: gameStatePDA,
        playerState: player1StatePDA,
      })
      .signers([player1])
      .rpc();

    const ps = await program.account.playerState.fetch(player1StatePDA);
    gs = await program.account.gameState.fetch(gameStatePDA);

    assert.equal(ps.position, 6, "Player should be on space 6 (Pyth Network)");
    assert.deepEqual(gs.pendingDice, [4, 2]);
    assert.equal(gs.turnPhase.landingEffect !== undefined, true);
    console.log(`  Player1 moved to space ${ps.position} (Pyth Network) ✓`);
    console.log("  Phase: LandingEffect ✓");
  });

  // ── resolve_landing ────────────────────────────────────────────────────────

  it("resolve landing on Pyth Network (unowned → BuyDecision)", async () => {
    const [player1StatePDA] = findPDA(
      [SEED_PLAYER_STATE, Buffer.from(GID), player1.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const player1Ata = await getAssociatedTokenAddress(bpolyMint, player1.publicKey);

    await program.methods
      .resolveLanding(Array.from(GID))
      .accounts({
        player: player1.publicKey,
        gameState: gameStatePDA,
        playerState: player1StatePDA,
        bankVault: bankVaultPDA,
        bankBpolyAta: bankAta,
        playerBpolyAta: player1Ata,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([player1])
      .rpc();

    const gs = await program.account.gameState.fetch(gameStatePDA);
    assert.equal(gs.turnPhase.buyDecision !== undefined, true, "Should be BuyDecision");
    console.log("  Phase: BuyDecision (unowned property) ✓");
  });

  // ── buy_property ───────────────────────────────────────────────────────────

  it("player1 buys Pyth Network (space 6)", async () => {
    const [player1StatePDA] = findPDA(
      [SEED_PLAYER_STATE, Buffer.from(GID), player1.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const player1Ata = await getAssociatedTokenAddress(bpolyMint, player1.publicKey);
    const [propPDA] = findPDA(
      [SEED_PROPERTY_STATE, Buffer.from(GID), Buffer.from([6])],
      PROGRAM_ID
    );
    const dummyNftAsset = Keypair.generate().publicKey;

    const balBefore = (await program.account.playerState.fetch(player1StatePDA)).bpolyBalance;

    await program.methods
      .buyProperty(Array.from(GID), 6, dummyNftAsset)
      .accounts({
        player: player1.publicKey,
        gameState: gameStatePDA,
        playerState: player1StatePDA,
        propertyState: propPDA,
        bankVault: bankVaultPDA,
        bankBpolyAta: bankAta,
        playerBpolyAta: player1Ata,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([player1])
      .rpc();

    const ps = await program.account.playerState.fetch(player1StatePDA);
    const prop = await program.account.propertyState.fetch(propPDA);

    assert.equal(prop.owner.toString(), player1.publicKey.toString());
    assert.equal(prop.liquidityPools, 0);
    assert.ok(ps.propertiesOwned.includes(6), "Player1 should own space 6");

    const spent = BigInt(balBefore.toString()) - BigInt(ps.bpolyBalance.toString());
    assert.equal(spent.toString(), "100000000", "Should have spent 100 BPOLY");
    console.log("  Pyth Network purchased for 100 BPOLY ✓");
    console.log("  Player1 owns spaces:", ps.propertiesOwned.join(", "));
  });

  // ── Summary ────────────────────────────────────────────────────────────────

  after(async () => {
    const gs = await program.account.gameState.fetch(gameStatePDA);
    console.log("\n=== Final state ===");
    console.log("  Turn:", gs.turnNumber);
    console.log("  Players:", gs.playerCount);
    console.log("  Status:", Object.keys(gs.status)[0]);
  });
});
