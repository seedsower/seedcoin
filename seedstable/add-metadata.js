import { 
  createV1, 
  findMetadataPda, 
  mplTokenMetadata,
  TokenStandard 
} from "@metaplex-foundation/mpl-token-metadata";
import { 
  signerIdentity,
  publicKey,
  percentAmount,
  createSignerFromKeypair
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { readFileSync } from 'fs';

// Initialize Umi for devnet
const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata());

// Your SEEDS token mint address from the TokenPurchase component
const SEEDS_MINT = "Eoyy5BhjVsRUTiyHoNbM675PAZHdyX7qGr1yndZezYQG";

// Token metadata for SEEDS with IPFS URI
const tokenMetadata = {
  name: "Seed Stable",
  symbol: "SEEDS", 
  uri: "https://ipfs.io/ipfs/bafkreicudwsxnqm6svz27utxzdxl6otxxyiika56wjn6ull3wvfoc65iii",
  description: "SeedStable token backed by agricultural seed reserves"
};

// Add metadata to existing SEEDS token
async function addMetadata() {
  try {
    console.log('Adding metadata to SEEDS token...');
    console.log('Mint address:', SEEDS_MINT);
    console.log('IPFS metadata URI:', tokenMetadata.uri);
    
    // Use the default Solana CLI wallet
    const walletPath = '/home/tt/.config/solana/id.json';
    const walletData = JSON.parse(readFileSync(walletPath, 'utf8'));
    const secretKey = new Uint8Array(walletData);
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const wallet = createSignerFromKeypair(umi, keypair);
    console.log('Using wallet:', wallet.publicKey);
    
    umi.use(signerIdentity(wallet));
    
    const mint = publicKey(SEEDS_MINT);
    
    // Derive the metadata account address
    const metadataAccountAddress = findMetadataPda(umi, {
      mint: mint,
    });
    
    console.log('Metadata account address:', metadataAccountAddress[0]);
    
    // Create metadata for the token
    const tx = await createV1(umi, {
      mint,
      authority: umi.identity,
      payer: umi.identity, 
      updateAuthority: umi.identity,
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
      uri: tokenMetadata.uri,
      sellerFeeBasisPoints: percentAmount(0), // No royalties for utility token
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi);
    
    const txSig = base58.deserialize(tx.signature);
    console.log('✅ Metadata added successfully!');
    console.log(`Transaction: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
    console.log(`Token: https://explorer.solana.com/address/${SEEDS_MINT}?cluster=devnet`);
    console.log(`Metadata URI: ${tokenMetadata.uri}`);
    
  } catch (error) {
    console.error('Error adding metadata:', error);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Metadata already exists for this token');
    } else if (error.message.includes('insufficient funds')) {
      console.log('❌ Insufficient SOL for transaction fees');
    } else {
      console.log('❌ Failed to add metadata:', error.message);
    }
  }
}

// Run the function
addMetadata();
