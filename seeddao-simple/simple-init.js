const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createMint } = require('@solana/spl-token');
const fs = require('fs');

async function simpleInitialize() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD');
    
    // Load the authority keypair
    const authorityKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('/home/tt/.config/solana/id.json')))
    );
    
    console.log('🚀 Simple SeedStable Protocol Initialization...\n');
    console.log(`👤 Authority: ${authorityKeypair.publicKey.toString()}`);
    
    // Derive PDAs
    const [protocolState, protocolBump] = PublicKey.findProgramAddressSync(
        [Buffer.from('protocol')],
        programId
    );
    
    console.log(`📍 Protocol State PDA: ${protocolState.toString()}`);
    console.log(`🔢 Protocol Bump: ${protocolBump}`);
    
    try {
        // Check if protocol is already initialized
        const protocolInfo = await connection.getAccountInfo(protocolState);
        if (protocolInfo) {
            console.log('\n✅ Protocol already initialized!');
            await testEmergencyPause(protocolState, programId, authorityKeypair, connection);
            return;
        }
        
        // Create stablecoin mint with authority as the signer (we'll transfer authority later)
        console.log('\n🪙 Creating stablecoin mint...');
        const stablecoinMint = await createMint(
            connection,
            authorityKeypair,
            authorityKeypair.publicKey, // temporary authority
            null, // freeze authority
            6 // decimals for USD
        );
        
        console.log(`✅ Stablecoin mint created: ${stablecoinMint.toString()}`);
        
        // Create treasury token account manually
        const treasuryKeypair = Keypair.generate();
        
        // Create initialize instruction data
        const initializeData = Buffer.concat([
            Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // initialize discriminator
            Buffer.from([protocolBump]) // bump parameter
        ]);
        
        // Create initialize instruction with simplified accounts
        const initializeInstruction = {
            programId,
            keys: [
                { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: protocolState, isSigner: false, isWritable: true },
                { pubkey: stablecoinMint, isSigner: false, isWritable: false },
                { pubkey: treasuryKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
            ],
            data: initializeData,
        };
        
        // Create and send transaction
        const transaction = new Transaction().add(initializeInstruction);
        const signature = await connection.sendTransaction(transaction, [authorityKeypair, treasuryKeypair]);
        
        console.log(`\n📝 Initialize transaction sent: ${signature}`);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        console.log('✅ Transaction confirmed!');
        
        // Verify initialization
        const updatedProtocolInfo = await connection.getAccountInfo(protocolState);
        if (updatedProtocolInfo) {
            console.log('\n🎉 Protocol successfully initialized!');
            console.log(`📊 Protocol State Account Size: ${updatedProtocolInfo.data.length} bytes`);
        }
        
        // Test emergency pause functionality
        await testEmergencyPause(protocolState, programId, authorityKeypair, connection);
        
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        if (error.logs) {
            console.error('📋 Transaction logs:', error.logs);
        }
        
        // Try a minimal test without full initialization
        console.log('\n🔄 Trying emergency pause test without full initialization...');
        await testEmergencyPause(protocolState, programId, authorityKeypair, connection);
    }
}

async function testEmergencyPause(protocolState, programId, authorityKeypair, connection) {
    console.log('\n🛑 Testing Emergency Pause Functionality...');
    
    try {
        // Create emergency pause instruction data (pause = true)
        const pauseData = Buffer.concat([
            Buffer.from([204, 85, 6, 33, 49, 192, 134, 74]), // emergency_pause discriminator
            Buffer.from([1]) // pause = true
        ]);
        
        // Create pause instruction
        const pauseInstruction = {
            programId,
            keys: [
                { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: false },
                { pubkey: protocolState, isSigner: false, isWritable: true },
            ],
            data: pauseData,
        };
        
        // Send pause transaction
        const pauseTransaction = new Transaction().add(pauseInstruction);
        const pauseSignature = await connection.sendTransaction(pauseTransaction, [authorityKeypair]);
        await connection.confirmTransaction(pauseSignature, 'confirmed');
        
        console.log(`✅ Protocol paused! Transaction: ${pauseSignature}`);
        
        // Create unpause instruction data (pause = false)
        const unpauseData = Buffer.concat([
            Buffer.from([204, 85, 6, 33, 49, 192, 134, 74]), // emergency_pause discriminator
            Buffer.from([0]) // pause = false
        ]);
        
        // Create unpause instruction
        const unpauseInstruction = {
            programId,
            keys: [
                { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: false },
                { pubkey: protocolState, isSigner: false, isWritable: true },
            ],
            data: unpauseData,
        };
        
        // Send unpause transaction
        const unpauseTransaction = new Transaction().add(unpauseInstruction);
        const unpauseSignature = await connection.sendTransaction(unpauseTransaction, [authorityKeypair]);
        await connection.confirmTransaction(unpauseSignature, 'confirmed');
        
        console.log(`✅ Protocol unpaused! Transaction: ${unpauseSignature}`);
        console.log('🎉 Emergency pause functionality working correctly!');
        
    } catch (error) {
        console.error('❌ Emergency pause test failed:', error.message);
        if (error.logs) {
            console.error('📋 Error logs:', error.logs);
        }
    }
}

simpleInitialize().then(() => {
    console.log('\n🎊 SeedStable Protocol Testing Complete!');
}).catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
});
