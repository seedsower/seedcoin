const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');
const fs = require('fs');

async function initializeProtocol() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD');
    
    // Load the authority keypair
    const authorityKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('/home/tt/.config/solana/id.json')))
    );
    
    console.log('🚀 Initializing SeedStable Protocol...\n');
    console.log(`👤 Authority: ${authorityKeypair.publicKey.toString()}`);
    console.log(`🏛️ Program ID: ${programId.toString()}`);
    
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
    console.log(`🔢 Protocol Bump: ${protocolBump}`);
    
    try {
        // Check if protocol is already initialized
        const protocolInfo = await connection.getAccountInfo(protocolState);
        if (protocolInfo) {
            console.log('\n✅ Protocol already initialized!');
            return { protocolState, treasury, programId };
        }
        
        // Create stablecoin mint
        console.log('\n🪙 Creating stablecoin mint...');
        const stablecoinMint = await createMint(
            connection,
            authorityKeypair,
            protocolState, // mint authority will be protocol state
            null, // freeze authority
            6 // decimals for USD
        );
        
        console.log(`✅ Stablecoin mint created: ${stablecoinMint.toString()}`);
        
        // Create initialize instruction data
        const initializeData = Buffer.concat([
            Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // initialize discriminator
            Buffer.from([protocolBump]) // bump parameter
        ]);
        
        // Create initialize instruction
        const initializeInstruction = {
            programId,
            keys: [
                { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: protocolState, isSigner: false, isWritable: true },
                { pubkey: stablecoinMint, isSigner: false, isWritable: true },
                { pubkey: treasury, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
            ],
            data: initializeData,
        };
        
        // Create and send transaction
        const transaction = new Transaction().add(initializeInstruction);
        const signature = await connection.sendTransaction(transaction, [authorityKeypair]);
        
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
        
        return { protocolState, treasury, stablecoinMint, programId };
        
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        if (error.logs) {
            console.error('📋 Transaction logs:', error.logs);
        }
        throw error;
    }
}

async function testEmergencyPause(protocolState, programId, authorityKeypair) {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
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
        throw error;
    }
}

async function main() {
    try {
        console.log('💰 Current balance:', (await new Connection('https://api.devnet.solana.com').getBalance(
            Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('/home/tt/.config/solana/id.json')))).publicKey
        )) / 1e9, 'SOL\n');
        
        // Initialize protocol
        const { protocolState, treasury, stablecoinMint, programId } = await initializeProtocol();
        
        // Load authority keypair for testing
        const authorityKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('/home/tt/.config/solana/id.json')))
        );
        
        // Test emergency pause
        await testEmergencyPause(protocolState, programId, authorityKeypair);
        
        console.log('\n🎊 SeedStable Protocol Testing Complete!');
        console.log('\n📋 Summary:');
        console.log(`✅ Protocol initialized at: ${protocolState.toString()}`);
        console.log(`✅ Treasury created at: ${treasury.toString()}`);
        if (stablecoinMint) {
            console.log(`✅ Stablecoin mint: ${stablecoinMint.toString()}`);
        }
        console.log('✅ Emergency pause functionality verified');
        console.log('\n🚀 Ready for frontend integration!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        process.exit(1);
    }
}

main();
