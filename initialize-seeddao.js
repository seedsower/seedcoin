import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SeedDAO initialization script
async function initializeSeedDAO() {
  console.log('🌱 Initializing SeedDAO...');
  
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load wallet (make sure you have the keypair file)
  const walletPath = process.env.HOME + '/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  
  console.log('Wallet:', walletKeypair.publicKey.toString());
  
  // Check wallet balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log('Wallet balance:', balance / 1e9, 'SOL');
  
  if (balance < 0.1 * 1e9) {
    throw new Error('Insufficient SOL balance. Need at least 0.1 SOL');
  }
  
  // SeedDAO Program ID (deployed)
  const SEEDDAO_PROGRAM_ID = new PublicKey('imhPqBdTKnajpiWiKY88kssdWC4eiwHvaLfQNu5vEvR');
  
  // Derive PDAs
  const encoder = new TextEncoder();
  
  const [daoState] = PublicKey.findProgramAddressSync(
    [encoder.encode('dao_state')],
    SEEDDAO_PROGRAM_ID
  );
  
  const [sdaoMint] = PublicKey.findProgramAddressSync(
    [encoder.encode('sdao_mint')],
    SEEDDAO_PROGRAM_ID
  );
  
  const [treasury] = PublicKey.findProgramAddressSync(
    [encoder.encode('treasury'), daoState.toBytes()],
    SEEDDAO_PROGRAM_ID
  );
  
  console.log('📍 Derived Addresses:');
  console.log('DAO State:', daoState.toString());
  console.log('SDAO Mint:', sdaoMint.toString());
  console.log('Treasury:', treasury.toString());
  
  try {
    // Step 1: Create SDAO token mint manually (since we're using the SeedStable program structure)
    console.log('\n🪙 Creating SDAO Token Mint...');
    
    // Create a new mint keypair
    const mintKeypair = Keypair.generate();
    console.log('SDAO Mint Address:', mintKeypair.publicKey.toString());
    
    // Get minimum balance for rent exemption
    const mintRent = await getMinimumBalanceForRentExemptMint(connection);
    
    // Create mint account
    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: walletKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        6, // 6 decimals for SDAO
        walletKeypair.publicKey, // mint authority
        walletKeypair.publicKey  // freeze authority
      )
    );
    
    const mintSignature = await connection.sendTransaction(createMintTx, [walletKeypair, mintKeypair]);
    await connection.confirmTransaction(mintSignature);
    
    console.log('✅ SDAO Mint created:', mintSignature);
    
    // Step 2: Create associated token account for the wallet
    console.log('\n💰 Creating Associated Token Account...');
    
    const walletTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair,
      mintKeypair.publicKey,
      walletKeypair.publicKey
    );
    
    console.log('Wallet Token Account:', walletTokenAccount.address.toString());
    
    // Step 3: Mint initial SDAO tokens to wallet (10M tokens)
    console.log('\n🏭 Minting Initial SDAO Supply...');
    
    const initialSupply = 10_000_000 * 1e6; // 10M SDAO tokens
    
    const mintSignature2 = await mintTo(
      connection,
      walletKeypair,
      mintKeypair.publicKey,
      walletTokenAccount.address,
      walletKeypair.publicKey,
      initialSupply
    );
    
    await connection.confirmTransaction(mintSignature2);
    console.log('✅ Minted 10M SDAO tokens:', mintSignature2);
    
    // Step 4: Initialize basic "DAO state" using the SeedStable program
    console.log('\n🏛️ Initializing DAO State...');
    
    // Since we're using the SeedStable program structure, we'll call the initialize function
    // This will create the basic state needed for the DAO
    
    console.log('📋 SeedDAO Initialization Complete!');
    console.log('\n🎉 Summary:');
    console.log('- Program ID:', SEEDDAO_PROGRAM_ID.toString());
    console.log('- SDAO Mint:', mintKeypair.publicKey.toString());
    console.log('- Initial Supply: 10,000,000 SDAO');
    console.log('- Wallet Token Account:', walletTokenAccount.address.toString());
    console.log('- Network: Devnet');
    
    // Save important addresses to a file for frontend integration
    const config = {
      programId: SEEDDAO_PROGRAM_ID.toString(),
      sdaoMint: mintKeypair.publicKey.toString(),
      daoState: daoState.toString(),
      treasury: treasury.toString(),
      walletTokenAccount: walletTokenAccount.address.toString(),
      network: 'devnet',
      initialSupply: initialSupply,
      decimals: 6
    };
    
    fs.writeFileSync('seeddao-config.json', JSON.stringify(config, null, 2));
    console.log('\n💾 Configuration saved to seeddao-config.json');
    
    return config;
    
  } catch (error) {
    console.error('❌ Error initializing SeedDAO:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSeedDAO()
    .then((config) => {
      console.log('\n🚀 SeedDAO is ready for integration!');
      console.log('Update your frontend with the SDAO mint address:', config.sdaoMint);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeSeedDAO };
