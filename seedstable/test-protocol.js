const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function testProtocol() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD');
    
    // Load the authority keypair
    const authorityKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('/home/tt/.config/solana/id.json')))
    );
    
    console.log('🚀 Testing SeedStable Protocol...\n');
    console.log(`👤 Authority: ${authorityKeypair.publicKey.toString()}`);
    console.log(`💰 Balance: ${(await connection.getBalance(authorityKeypair.publicKey)) / 1e9} SOL`);
    
    // Derive PDAs
    const [protocolState, protocolBump] = PublicKey.findProgramAddressSync(
        [Buffer.from('protocol')],
        programId
    );
    
    const [treasury, treasuryBump] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury')],
        programId
    );
    
    console.log(`\n📍 Protocol State PDA: ${protocolState.toString()}`);
    console.log(`📍 Treasury PDA: ${treasury.toString()}`);
    
    try {
        // Check if protocol is already initialized
        const protocolInfo = await connection.getAccountInfo(protocolState);
        if (protocolInfo) {
            console.log('\n✅ Protocol already initialized!');
            console.log(`📊 Account size: ${protocolInfo.data.length} bytes`);
        } else {
            console.log('\n🔧 Initializing protocol...');
            
            // Generate keypairs for accounts that will be created
            const stablecoinMintKeypair = Keypair.generate();
            
            console.log(`🎯 Stablecoin mint will be: ${stablecoinMintKeypair.publicKey.toString()}`);
            console.log(`🎯 Treasury will be: ${treasury.toString()}`);
            
            // Create initialize instruction with proper account setup
            const initializeData = Buffer.concat([
                Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // initialize discriminator
                Buffer.from([protocolBump])
            ]);
            
            const initializeInstruction = {
                programId,
                keys: [
                    { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: true },
                    { pubkey: protocolState, isSigner: false, isWritable: true },
                    { pubkey: stablecoinMintKeypair.publicKey, isSigner: true, isWritable: true },
                    { pubkey: treasury, isSigner: false, isWritable: true },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
                ],
                data: initializeData,
            };
            
            const transaction = new Transaction().add(initializeInstruction);
            const signature = await connection.sendTransaction(transaction, [authorityKeypair, stablecoinMintKeypair]);
            
            console.log(`📝 Initialize transaction: ${signature}`);
            await connection.confirmTransaction(signature, 'confirmed');
            console.log('✅ Protocol initialized successfully!');
            console.log(`✅ Stablecoin mint: ${stablecoinMintKeypair.publicKey.toString()}`);
        }
        
        // Test emergency pause functionality
        console.log('\n🛑 Testing emergency pause...');
        
        // Pause
        const pauseData = Buffer.concat([
            Buffer.from([21, 143, 27, 142, 200, 181, 210, 255]), // emergency_pause discriminator
            Buffer.from([1]) // pause = true
        ]);
        
        const pauseInstruction = {
            programId,
            keys: [
                { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: false },
                { pubkey: protocolState, isSigner: false, isWritable: true },
            ],
            data: pauseData,
        };
        
        const pauseTransaction = new Transaction().add(pauseInstruction);
        const pauseSignature = await connection.sendTransaction(pauseTransaction, [authorityKeypair]);
        await connection.confirmTransaction(pauseSignature, 'confirmed');
        console.log(`✅ Protocol paused: ${pauseSignature}`);
        
        // Unpause
        const unpauseData = Buffer.concat([
            Buffer.from([21, 143, 27, 142, 200, 181, 210, 255]), // emergency_pause discriminator
            Buffer.from([0]) // pause = false
        ]);
        
        const unpauseInstruction = {
            programId,
            keys: [
                { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: false },
                { pubkey: protocolState, isSigner: false, isWritable: true },
            ],
            data: unpauseData,
        };
        
        const unpauseTransaction = new Transaction().add(unpauseInstruction);
        const unpauseSignature = await connection.sendTransaction(unpauseTransaction, [authorityKeypair]);
        await connection.confirmTransaction(unpauseSignature, 'confirmed');
        console.log(`✅ Protocol unpaused: ${unpauseSignature}`);
        
        console.log('\n🎉 All tests passed successfully!');
        console.log('\n📋 Summary:');
        console.log(`✅ Program ID: ${programId.toString()}`);
        console.log(`✅ Protocol State: ${protocolState.toString()}`);
        console.log(`✅ Treasury: ${treasury.toString()}`);
        console.log('✅ Initialize functionality: Working');
        console.log('✅ Emergency pause functionality: Working');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.logs) {
            console.error('📋 Error logs:', error.logs);
        }
        throw error;
    }
}

testProtocol().then(() => {
    console.log('\n🎊 SeedStable Protocol Testing Complete!');
    console.log('🚀 Ready for frontend integration and production use!');
}).catch(error => {
    console.error('💥 Testing failed:', error.message);
    process.exit(1);
});
