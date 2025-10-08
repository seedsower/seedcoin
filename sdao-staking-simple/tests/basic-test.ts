import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Seedstable } from "../target/types/seedstable";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("seedstable", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Seedstable as Program<Seedstable>;
  const authority = provider.wallet as anchor.Wallet;

  let protocolState: PublicKey;
  let stablecoinMint: PublicKey;
  let treasury: PublicKey;

  before(async () => {
    // Derive PDAs
    [protocolState] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );
  });

  it("Initialize protocol", async () => {
    // Create stablecoin mint
    stablecoinMint = await createMint(
      provider.connection,
      authority.payer,
      protocolState,
      null,
      6 // USD decimals
    );

    const [, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    try {
      const tx = await program.methods
        .initialize(bump)
        .accounts({
          authority: authority.publicKey,
          protocolState,
          stablecoinMint,
          treasury,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("Initialize transaction signature:", tx);

      // Verify protocol state was created
      const protocolAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolAccount.authority.toString()).to.equal(authority.publicKey.toString());
      expect(protocolAccount.stablecoinMint.toString()).to.equal(stablecoinMint.toString());
      expect(protocolAccount.isPaused).to.be.false;
      
      console.log("✅ Protocol initialized successfully!");
      console.log("Protocol State:", protocolState.toString());
      console.log("Stablecoin Mint:", stablecoinMint.toString());
      console.log("Treasury:", treasury.toString());
      
    } catch (error) {
      console.error("Initialize failed:", error);
      throw error;
    }
  });

  it("Test emergency pause", async () => {
    try {
      // Pause the protocol
      const pauseTx = await program.methods
        .emergencyPause(true)
        .accounts({
          authority: authority.publicKey,
          protocolState,
        })
        .rpc();

      console.log("Emergency pause transaction:", pauseTx);

      // Verify protocol is paused
      const protocolAccount = await program.account.protocolState.fetch(protocolState);
      expect(protocolAccount.isPaused).to.be.true;

      // Unpause the protocol
      const unpauseTx = await program.methods
        .emergencyPause(false)
        .accounts({
          authority: authority.publicKey,
          protocolState,
        })
        .rpc();

      console.log("Emergency unpause transaction:", unpauseTx);

      // Verify protocol is unpaused
      const updatedAccount = await program.account.protocolState.fetch(protocolState);
      expect(updatedAccount.isPaused).to.be.false;

      console.log("✅ Emergency pause functionality working!");
      
    } catch (error) {
      console.error("Emergency pause test failed:", error);
      throw error;
    }
  });

  it("Check program deployment", async () => {
    const programInfo = await provider.connection.getAccountInfo(program.programId);
    expect(programInfo).to.not.be.null;
    expect(programInfo.executable).to.be.true;
    
    console.log("✅ Program successfully deployed and executable!");
    console.log("Program ID:", program.programId.toString());
  });
});
