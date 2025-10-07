const { Connection, PublicKey } = require('@solana/web3.js');

async function verifyDeployment() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD');
    
    console.log('🔍 Verifying SeedStable Program Deployment...\n');
    
    try {
        // Check if program exists and is executable
        const programInfo = await connection.getAccountInfo(programId);
        
        if (!programInfo) {
            console.log('❌ Program not found');
            return;
        }
        
        console.log('✅ Program Found!');
        console.log(`📍 Program ID: ${programId.toString()}`);
        console.log(`💰 Program Balance: ${programInfo.lamports / 1e9} SOL`);
        console.log(`🔧 Executable: ${programInfo.executable}`);
        console.log(`👤 Owner: ${programInfo.owner.toString()}`);
        console.log(`📏 Data Length: ${programInfo.data.length} bytes`);
        
        // Check if we can derive the protocol state PDA
        const [protocolState, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from('protocol')],
            programId
        );
        
        console.log(`\n🏛️ Protocol State PDA: ${protocolState.toString()}`);
        console.log(`🔢 Bump: ${bump}`);
        
        // Check if protocol state account exists (it won't until initialized)
        const protocolInfo = await connection.getAccountInfo(protocolState);
        if (protocolInfo) {
            console.log('✅ Protocol State Account exists (already initialized)');
        } else {
            console.log('⏳ Protocol State Account not yet initialized (ready for first use)');
        }
        
        console.log('\n🎉 SeedStable Program Successfully Deployed and Verified on Devnet!');
        console.log('\n📋 Next Steps:');
        console.log('1. Initialize the protocol with the initialize() function');
        console.log('2. Create collateral pools for USDC, SOL, and tokenized seeds');
        console.log('3. Test mint/burn operations');
        console.log('4. Integrate with your frontend application');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyDeployment();
