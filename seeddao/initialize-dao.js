const anchor = require('@coral-xyz/anchor');
const { PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');

// SeedDAO initialization script
async function initializeDao() {
    // Configure the client to use devnet
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Load the program
    const program = anchor.workspace.Seeddao;
    const wallet = provider.wallet;

    console.log('Initializing SeedDAO...');
    console.log('Program ID:', program.programId.toString());
    console.log('Wallet:', wallet.publicKey.toString());

    // DAO configuration
    const totalSupply = new anchor.BN(10_000_000 * 1e6); // 10M SDAO tokens
    const minProposalThreshold = new anchor.BN(1_000 * 1e6); // 1,000 SDAO to create proposal
    const votingPeriod = new anchor.BN(7 * 24 * 3600); // 7 days
    const executionDelay = new anchor.BN(2 * 24 * 3600); // 2 days
    const quorumThreshold = new anchor.BN(100_000 * 1e6); // 100,000 SDAO for quorum

    // Derive PDAs
    const [daoState] = PublicKey.findProgramAddressSync(
        [Buffer.from('dao_state')],
        program.programId
    );

    const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), daoState.toBuffer()],
        program.programId
    );

    const [sdaoMint] = PublicKey.findProgramAddressSync(
        [Buffer.from('sdao_mint')],
        program.programId
    );

    // Mock USDC and SEEDS mints (replace with actual mint addresses)
    const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC devnet
    const seedsMint = new PublicKey('Eoyy5BhjVsRUTiyHoNbM675PAZHdyX7qGr1yndZezYQG'); // Your SEEDS mint

    const [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('usdc_vault'), treasury.toBuffer()],
        program.programId
    );

    const [seedsVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('seeds_vault'), treasury.toBuffer()],
        program.programId
    );

    try {
        const tx = await program.methods
            .initializeDao(
                totalSupply,
                minProposalThreshold,
                votingPeriod,
                executionDelay,
                quorumThreshold
            )
            .accounts({
                daoState,
                treasury,
                sdaoMint,
                usdcVault,
                seedsVault,
                usdcMint,
                seedsMint,
                authority: wallet.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();

        console.log('✅ SeedDAO initialized successfully!');
        console.log('Transaction signature:', tx);
        console.log('DAO State:', daoState.toString());
        console.log('SDAO Mint:', sdaoMint.toString());
        console.log('Treasury:', treasury.toString());
        
        return {
            daoState,
            sdaoMint,
            treasury,
            signature: tx
        };

    } catch (error) {
        console.error('❌ Failed to initialize DAO:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    initializeDao()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { initializeDao };
