import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAssociatedTokenAccount } from "@solana/spl-token";
import { Buffer } from "buffer";

async function testDeployedProgram() {
  console.log("🧪 Testing SeedStable Deployed Program on Devnet");
  console.log("=" .repeat(50));

  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Use deployed program ID
  const DEPLOYED_PROGRAM_ID = new PublicKey("HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD");
  
  // Load IDL from workspace
  const idl = anchor.workspace.Seedstable.idl;
  const program = new anchor.Program(idl, DEPLOYED_PROGRAM_ID, provider);

  const payer = provider.wallet;
  console.log("Payer wallet:", payer.publicKey.toString());

  // Constants
  const PROTOCOL_SEED = "protocol";
  const USER_POSITION_SEED = "user_position";

  // Find PDAs
  const [protocolState, protocolStateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(PROTOCOL_SEED)],
    DEPLOYED_PROGRAM_ID
  );

  const [userPosition] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_POSITION_SEED), payer.publicKey.toBuffer()],
    DEPLOYED_PROGRAM_ID
  );

  console.log("Protocol State PDA:", protocolState.toString());
  console.log("User Position PDA:", userPosition.toString());
  console.log("");

  try {
    // Test 1: Initialize Protocol
    console.log("🔧 Test 1: Initialize Protocol");
    console.log("-".repeat(30));

    // Create stablecoin mint
    const stablecoinMint = await createMint(
      provider.connection,
      payer.payer,
      protocolState,
      null,
      6
    );
    console.log("✅ Created stablecoin mint:", stablecoinMint.toString());

    const initTx = await program.methods
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

    console.log("✅ Initialize transaction:", initTx);

    // Verify protocol state
    const protocolStateAccount = await program.account.protocolState.fetch(protocolState);
    console.log("✅ Protocol State Created:");
    console.log("  - Authority:", protocolStateAccount.authority.toString());
    console.log("  - Stablecoin Mint:", protocolStateAccount.stablecoinMint.toString());
    console.log("  - Is Paused:", protocolStateAccount.isPaused);
    console.log("  - Total Supply:", protocolStateAccount.totalStablecoinSupply.toString());
    console.log("");

    // Test 2: Emergency Pause
    console.log("⏸️  Test 2: Emergency Pause/Unpause");
    console.log("-".repeat(30));

    // Pause
    const pauseTx = await program.methods
      .emergencyPause(true)
      .accounts({
        protocolState,
        authority: payer.publicKey,
      })
      .rpc();
    console.log("✅ Pause transaction:", pauseTx);

    let protocolCheck = await program.account.protocolState.fetch(protocolState);
    console.log("✅ Protocol paused:", protocolCheck.isPaused);

    // Unpause
    const unpauseTx = await program.methods
      .emergencyPause(false)
      .accounts({
        protocolState,
        authority: payer.publicKey,
      })
      .rpc();
    console.log("✅ Unpause transaction:", unpauseTx);

    protocolCheck = await program.account.protocolState.fetch(protocolState);
    console.log("✅ Protocol unpaused:", !protocolCheck.isPaused);
    console.log("");

    // Test 3: Mint Stablecoins
    console.log("🪙 Test 3: Mint Stablecoins");
    console.log("-".repeat(30));

    // Create user token account
    const userStablecoinAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      stablecoinMint,
      payer.publicKey
    );
    console.log("✅ Created user stablecoin account:", userStablecoinAccount.toString());

    const mintAmount = new anchor.BN(100 * 10**6); // 100 stablecoins
    const mintTx = await program.methods
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

    console.log("✅ Mint transaction:", mintTx);

    // Verify user position
    const userPositionAccount = await program.account.userPosition.fetch(userPosition);
    console.log("✅ User Position Created:");
    console.log("  - Owner:", userPositionAccount.owner.toString());
    console.log("  - Stablecoins Minted:", (userPositionAccount.stablecoinMinted.toNumber() / 10**6).toFixed(2));
    console.log("  - Collateral Deposited:", userPositionAccount.collateralDeposited.toString());

    // Verify protocol state updated
    const protocolAfterMint = await program.account.protocolState.fetch(protocolState);
    console.log("✅ Protocol Total Supply:", (protocolAfterMint.totalStablecoinSupply.toNumber() / 10**6).toFixed(2));
    console.log("");

    // Test 4: Burn Stablecoins
    console.log("🔥 Test 4: Burn Stablecoins");
    console.log("-".repeat(30));

    const burnAmount = new anchor.BN(25 * 10**6); // Burn 25 stablecoins
    const burnTx = await program.methods
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

    console.log("✅ Burn transaction:", burnTx);

    // Verify updated balances
    const userAfterBurn = await program.account.userPosition.fetch(userPosition);
    const protocolAfterBurn = await program.account.protocolState.fetch(protocolState);

    console.log("✅ After Burn:");
    console.log("  - User Stablecoins:", (userAfterBurn.stablecoinMinted.toNumber() / 10**6).toFixed(2));
    console.log("  - Protocol Total Supply:", (protocolAfterBurn.totalStablecoinSupply.toNumber() / 10**6).toFixed(2));
    console.log("");

    // Final Summary
    console.log("📊 Final Test Summary");
    console.log("=" .repeat(50));
    console.log("✅ All tests passed successfully!");
    console.log("✅ Program ID:", DEPLOYED_PROGRAM_ID.toString());
    console.log("✅ Protocol State:", protocolState.toString());
    console.log("✅ User Position:", userPosition.toString());
    console.log("✅ Stablecoin Mint:", stablecoinMint.toString());
    console.log("✅ Final User Balance:", (userAfterBurn.stablecoinMinted.toNumber() / 10**6).toFixed(2), "stablecoins");
    console.log("✅ Final Protocol Supply:", (protocolAfterBurn.totalStablecoinSupply.toNumber() / 10**6).toFixed(2), "stablecoins");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test
testDeployedProgram()
  .then(() => {
    console.log("\n🎉 All deployed program tests completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test suite failed:", error);
    process.exit(1);
  });
