import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Seedstable } from "../target/types/seedstable";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";

describe("SeedStable Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Seedstable as Program<Seedstable>;
  const payer = provider.wallet as anchor.Wallet;

  let protocolState: PublicKey;
  let protocolStateBump: number;
  let stablecoinMint: PublicKey;
  let collateralMint: PublicKey;
  let collateralPool: PublicKey;
  let collateralPoolBump: number;
  let userPosition: PublicKey;
  let userPositionBump: number;

  const PROTOCOL_SEED = "protocol";
  const COLLATERAL_POOL_SEED = "collateral_pool";
  const USER_POSITION_SEED = "user_position";

  before(async () => {
    // Find PDAs
    [protocolState, protocolStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_SEED)],
      program.programId
    );

    // Create test mints
    stablecoinMint = await createMint(
      provider.connection,
      payer.payer,
      protocolState,
      null,
      6
    );

    collateralMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9
    );

    [collateralPool, collateralPoolBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(COLLATERAL_POOL_SEED), collateralMint.toBuffer()],
      program.programId
    );

    [userPosition, userPositionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_POSITION_SEED), payer.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the protocol", async () => {
    try {
      await program.methods
        .initialize(protocolStateBump)
        .accounts({
          protocolState,
          stablecoinMint,
          authority: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolStateAccount.authority.toString()).to.equal(payer.publicKey.toString());
      expect(protocolStateAccount.stablecoinMint.toString()).to.equal(stablecoinMint.toString());
      expect(protocolStateAccount.isPaused).to.be.false;
    } catch (error) {
      console.log("Initialize error:", error);
      throw error;
    }
  });

  it("Can pause and unpause the protocol", async () => {
    // Pause
    await program.methods
      .emergencyPause(true)
      .accounts({
        protocolState,
        authority: payer.publicKey,
      })
      .rpc();

    let protocolStateAccount = await program.account.protocolState.fetch(protocolState);
    expect(protocolStateAccount.isPaused).to.be.true;

    // Unpause
    await program.methods
      .emergencyPause(false)
      .accounts({
        protocolState,
        authority: payer.publicKey,
      })
      .rpc();

    protocolStateAccount = await program.account.protocolState.fetch(protocolState);
    expect(protocolStateAccount.isPaused).to.be.false;
  });

  it("Creates collateral pool and deposits collateral", async () => {
    // Create user collateral token account
    const userCollateralAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      collateralMint,
      payer.publicKey
    );

    // Mint collateral tokens to user
    await mintTo(
      provider.connection,
      payer.payer,
      collateralMint,
      userCollateralAccount,
      payer.payer,
      1000 * 10**9 // 1000 tokens with 9 decimals
    );

    // Create collateral vault
    const collateralVault = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      collateralMint,
      protocolState,
      true
    );

    // Create oracle account (mock)
    const oracleAccount = Keypair.generate();

    try {
      await program.methods
        .depositCollateral({ sol: {} }, new anchor.BN(100 * 10**9)) // 100 tokens
        .accounts({
          user: payer.publicKey,
          protocolState,
          userPosition,
          collateralPool,
          collateralMint,
          collateralVault,
          userCollateralAccount,
          oracleAccount: oracleAccount.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const userPositionAccount = await program.account.userPosition.fetch(userPosition);
      expect(userPositionAccount.owner.toString()).to.equal(payer.publicKey.toString());
      expect(userPositionAccount.collateralDeposited.toNumber()).to.be.greaterThan(0);
    } catch (error) {
      console.log("Deposit collateral error:", error);
      throw error;
    }
  });

  it("Mints stablecoins against collateral", async () => {
    // Create user stablecoin token account
    const userStablecoinAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      stablecoinMint,
      payer.publicKey
    );

    try {
      await program.methods
        .mintStable(new anchor.BN(50 * 10**6)) // 50 stablecoins with 6 decimals
        .accounts({
          user: payer.publicKey,
          protocolState,
          userPosition,
          stablecoinMint,
          userStablecoinAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const userPositionAccount = await program.account.userPosition.fetch(userPosition);
      expect(userPositionAccount.stablecoinMinted.toNumber()).to.be.greaterThan(0);
    } catch (error) {
      console.log("Mint stable error:", error);
      throw error;
    }
  });

  it("Burns stablecoins", async () => {
    const userStablecoinAccount = await getAssociatedTokenAddress(
      stablecoinMint,
      payer.publicKey
    );

    try {
      await program.methods
        .burnStable(new anchor.BN(10 * 10**6)) // Burn 10 stablecoins
        .accounts({
          user: payer.publicKey,
          protocolState,
          userPosition,
          stablecoinMint,
          userStablecoinAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const userPositionAccount = await program.account.userPosition.fetch(userPosition);
      expect(userPositionAccount.stablecoinMinted.toNumber()).to.be.lessThan(50 * 10**6);
    } catch (error) {
      console.log("Burn stable error:", error);
      throw error;
    }
  });

  it("Withdraws collateral", async () => {
    const userCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      payer.publicKey
    );

    const collateralVault = await getAssociatedTokenAddress(
      collateralMint,
      protocolState,
      true
    );

    try {
      await program.methods
        .withdrawCollateral(new anchor.BN(10 * 10**9)) // Withdraw 10 tokens
        .accounts({
          user: payer.publicKey,
          protocolState,
          userPosition,
          collateralPool,
          collateralVault,
          userCollateralAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const userPositionAccount = await program.account.userPosition.fetch(userPosition);
      expect(userPositionAccount.collateralDeposited.toNumber()).to.be.lessThan(100 * 10**9);
    } catch (error) {
      console.log("Withdraw collateral error:", error);
      throw error;
    }
  });
});
