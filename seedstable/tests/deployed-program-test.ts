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
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";

describe("SeedStable Deployed Program Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Use the deployed program ID
  const DEPLOYED_PROGRAM_ID = new PublicKey("HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD");
  const program = new Program(
    anchor.workspace.Seedstable.idl,
    DEPLOYED_PROGRAM_ID,
    provider
  );

  const payer = provider.wallet as anchor.Wallet;

  let protocolState: PublicKey;
  let protocolStateBump: number;
  let stablecoinMint: PublicKey;
  let userPosition: PublicKey;
  let userPositionBump: number;

  const PROTOCOL_SEED = "protocol";
  const USER_POSITION_SEED = "user_position";

  before(async () => {
    console.log("Testing deployed program:", DEPLOYED_PROGRAM_ID.toString());
    console.log("Payer wallet:", payer.publicKey.toString());

    // Find PDAs
    [protocolState, protocolStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_SEED)],
      DEPLOYED_PROGRAM_ID
    );

    [userPosition, userPositionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_POSITION_SEED), payer.publicKey.toBuffer()],
      DEPLOYED_PROGRAM_ID
    );

    console.log("Protocol State PDA:", protocolState.toString());
    console.log("User Position PDA:", userPosition.toString());
  });

  it("Should initialize the protocol", async () => {
    console.log("Testing initialize instruction...");

    // Create stablecoin mint
    stablecoinMint = await createMint(
      provider.connection,
      payer.payer,
      protocolState, // Protocol state will be mint authority
      null,
      6 // 6 decimals for stablecoin
    );

    console.log("Created stablecoin mint:", stablecoinMint.toString());

    try {
      const tx = await program.methods
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

      console.log("Initialize transaction:", tx);

      // Verify protocol state was created
      const protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      console.log("Protocol state created:", {
        authority: protocolStateAccount.authority.toString(),
        stablecoinMint: protocolStateAccount.stablecoinMint.toString(),
        isPaused: protocolStateAccount.isPaused,
        totalStablecoinSupply: protocolStateAccount.totalStablecoinSupply.toString(),
      });

      expect(protocolStateAccount.authority.toString()).to.equal(payer.publicKey.toString());
      expect(protocolStateAccount.stablecoinMint.toString()).to.equal(stablecoinMint.toString());
      expect(protocolStateAccount.isPaused).to.be.false;
      expect(protocolStateAccount.totalStablecoinSupply.toNumber()).to.equal(0);

    } catch (error) {
      console.error("Initialize failed:", error);
      throw error;
    }
  });

  it("Should pause and unpause the protocol", async () => {
    console.log("Testing emergency_pause instruction...");

    try {
      // Pause the protocol
      const pauseTx = await program.methods
        .emergencyPause(true)
        .accounts({
          protocolState,
          authority: payer.publicKey,
        })
        .rpc();

      console.log("Pause transaction:", pauseTx);

      let protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolStateAccount.isPaused).to.be.true;
      console.log("Protocol successfully paused");

      // Unpause the protocol
      const unpauseTx = await program.methods
        .emergencyPause(false)
        .accounts({
          protocolState,
          authority: payer.publicKey,
        })
        .rpc();

      console.log("Unpause transaction:", unpauseTx);

      protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolStateAccount.isPaused).to.be.false;
      console.log("Protocol successfully unpaused");

    } catch (error) {
      console.error("Emergency pause test failed:", error);
      throw error;
    }
  });

  it("Should create user position and mint stablecoins", async () => {
    console.log("Testing mint_stable instruction...");

    // Create user stablecoin token account
    const userStablecoinAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      stablecoinMint,
      payer.publicKey
    );

    console.log("Created user stablecoin account:", userStablecoinAccount.toString());

    try {
      const mintAmount = new anchor.BN(100 * 10**6); // 100 stablecoins with 6 decimals

      const tx = await program.methods
        .mintStable(mintAmount)
        .accounts({
          user: payer.publicKey,
          protocolState,
          userPosition,
          stablecoinMint,
          userStablecoinAccount,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("Mint stable transaction:", tx);

      // Verify user position was created
      const userPositionAccount = await program.account.userPosition.fetch(userPosition);
      console.log("User position created:", {
        owner: userPositionAccount.owner.toString(),
        stablecoinMinted: userPositionAccount.stablecoinMinted.toString(),
        collateralDeposited: userPositionAccount.collateralDeposited.toString(),
      });

      expect(userPositionAccount.owner.toString()).to.equal(payer.publicKey.toString());
      expect(userPositionAccount.stablecoinMinted.toNumber()).to.equal(mintAmount.toNumber());

      // Verify protocol state was updated
      const protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolStateAccount.totalStablecoinSupply.toNumber()).to.equal(mintAmount.toNumber());

      console.log("Successfully minted", mintAmount.toNumber() / 10**6, "stablecoins");

    } catch (error) {
      console.error("Mint stable test failed:", error);
      throw error;
    }
  });

  it("Should burn stablecoins", async () => {
    console.log("Testing burn_stable instruction...");

    const userStablecoinAccount = await getAssociatedTokenAddress(
      stablecoinMint,
      payer.publicKey
    );

    try {
      const burnAmount = new anchor.BN(25 * 10**6); // Burn 25 stablecoins

      const tx = await program.methods
        .burnStable(burnAmount)
        .accounts({
          user: payer.publicKey,
          protocolState,
          userPosition,
          stablecoinMint,
          userStablecoinAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Burn stable transaction:", tx);

      // Verify user position was updated
      const userPositionAccount = await program.account.userPosition.fetch(userPosition);
      const expectedRemaining = (100 - 25) * 10**6; // 75 stablecoins remaining
      expect(userPositionAccount.stablecoinMinted.toNumber()).to.equal(expectedRemaining);

      // Verify protocol state was updated
      const protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolStateAccount.totalStablecoinSupply.toNumber()).to.equal(expectedRemaining);

      console.log("Successfully burned", burnAmount.toNumber() / 10**6, "stablecoins");
      console.log("Remaining stablecoins:", userPositionAccount.stablecoinMinted.toNumber() / 10**6);

    } catch (error) {
      console.error("Burn stable test failed:", error);
      throw error;
    }
  });

  it("Should verify final program state", async () => {
    console.log("Verifying final program state...");

    try {
      const protocolStateAccount = await program.account.protocolState.fetch(protocolState);
      const userPositionAccount = await program.account.userPosition.fetch(userPosition);

      console.log("Final Protocol State:", {
        authority: protocolStateAccount.authority.toString(),
        stablecoinMint: protocolStateAccount.stablecoinMint.toString(),
        totalStablecoinSupply: protocolStateAccount.totalStablecoinSupply.toNumber() / 10**6,
        isPaused: protocolStateAccount.isPaused,
        minCollateralRatio: protocolStateAccount.minCollateralRatio.toString(),
      });

      console.log("Final User Position:", {
        owner: userPositionAccount.owner.toString(),
        stablecoinMinted: userPositionAccount.stablecoinMinted.toNumber() / 10**6,
        collateralDeposited: userPositionAccount.collateralDeposited.toNumber(),
        lastUpdateTimestamp: new Date(userPositionAccount.lastUpdateTimestamp.toNumber() * 1000),
      });

      // Verify consistency
      expect(protocolStateAccount.totalStablecoinSupply.toNumber())
        .to.equal(userPositionAccount.stablecoinMinted.toNumber());

      console.log("✅ All program state verification passed!");

    } catch (error) {
      console.error("State verification failed:", error);
      throw error;
    }
  });
});
