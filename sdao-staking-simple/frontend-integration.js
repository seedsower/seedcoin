// SeedStable Protocol Frontend Integration Example
// This demonstrates how to interact with the deployed SeedStable program from a web application

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class SeedStableClient {
    constructor(connection, programId) {
        this.connection = connection;
        this.programId = new PublicKey(programId);
    }

    // Get Protocol State PDA
    getProtocolStatePDA() {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('protocol')],
            this.programId
        );
        return pda;
    }

    // Get Treasury PDA
    getTreasuryPDA() {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('treasury')],
            this.programId
        );
        return pda;
    }

    // Get instruction discriminators
    getDiscriminator(instructionName) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(`global:${instructionName}`);
        return hash.digest().slice(0, 8);
    }

    // Initialize Protocol (Admin only)
    async createInitializeTransaction(authority, stablecoinMint, bump) {
        const protocolState = this.getProtocolStatePDA();
        const treasury = this.getTreasuryPDA();

        const initializeData = Buffer.concat([
            this.getDiscriminator('initialize'),
            Buffer.from([bump])
        ]);

        const instruction = {
            programId: this.programId,
            keys: [
                { pubkey: authority, isSigner: true, isWritable: true },
                { pubkey: protocolState, isSigner: false, isWritable: true },
                { pubkey: stablecoinMint, isSigner: true, isWritable: true },
                { pubkey: treasury, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
            ],
            data: initializeData,
        };

        return new Transaction().add(instruction);
    }

    // Emergency Pause/Unpause (Admin only)
    async createEmergencyPauseTransaction(authority, pause) {
        const protocolState = this.getProtocolStatePDA();

        const pauseData = Buffer.concat([
            this.getDiscriminator('emergency_pause'),
            Buffer.from([pause ? 1 : 0])
        ]);

        const instruction = {
            programId: this.programId,
            keys: [
                { pubkey: authority, isSigner: true, isWritable: false },
                { pubkey: protocolState, isSigner: false, isWritable: true },
            ],
            data: pauseData,
        };

        return new Transaction().add(instruction);
    }

    // Get Protocol State Account Info
    async getProtocolState() {
        const protocolState = this.getProtocolStatePDA();
        const accountInfo = await this.connection.getAccountInfo(protocolState);
        
        if (!accountInfo) {
            throw new Error('Protocol not initialized');
        }

        // Parse protocol state data (simplified)
        const data = accountInfo.data;
        return {
            authority: new PublicKey(data.slice(8, 40)),
            stablecoinMint: new PublicKey(data.slice(40, 72)),
            treasury: new PublicKey(data.slice(72, 104)),
            totalCollateralValue: data.readBigUInt64LE(104),
            totalStablecoinSupply: data.readBigUInt64LE(112),
            collateralRatio: data.readBigUInt64LE(120),
            minCollateralRatio: data.readBigUInt64LE(128),
            pegDeviationThreshold: data.readBigUInt64LE(136),
            isPaused: data[144] === 1,
            lastRebalanceTimestamp: data.readBigInt64LE(145),
            bump: data[153]
        };
    }

    // Check if protocol is paused
    async isPaused() {
        try {
            const state = await this.getProtocolState();
            return state.isPaused;
        } catch (error) {
            console.error('Error checking pause state:', error);
            return false;
        }
    }

    // Get collateral ratio
    async getCollateralRatio() {
        try {
            const state = await this.getProtocolState();
            return Number(state.collateralRatio);
        } catch (error) {
            console.error('Error getting collateral ratio:', error);
            return 0;
        }
    }
}

// Usage Example
export async function exampleUsage() {
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = 'HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD';
    
    // Create client
    const client = new SeedStableClient(connection, programId);
    
    try {
        // Get protocol state
        const protocolState = await client.getProtocolState();
        console.log('Protocol State:', {
            authority: protocolState.authority.toString(),
            stablecoinMint: protocolState.stablecoinMint.toString(),
            treasury: protocolState.treasury.toString(),
            isPaused: protocolState.isPaused,
            collateralRatio: protocolState.collateralRatio.toString()
        });

        // Check if paused
        const paused = await client.isPaused();
        console.log('Protocol paused:', paused);

        // Get collateral ratio
        const ratio = await client.getCollateralRatio();
        console.log('Collateral ratio:', ratio);

        return {
            protocolState: client.getProtocolStatePDA().toString(),
            treasury: client.getTreasuryPDA().toString(),
            isPaused: paused,
            collateralRatio: ratio
        };

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

// React Hook Example
export function useSeedStable(connection, programId) {
    const [client] = useState(() => new SeedStableClient(connection, programId));
    const [protocolState, setProtocolState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProtocolState() {
            try {
                setLoading(true);
                const state = await client.getProtocolState();
                setProtocolState(state);
                setError(null);
            } catch (err) {
                setError(err.message);
                setProtocolState(null);
            } finally {
                setLoading(false);
            }
        }

        fetchProtocolState();
        
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchProtocolState, 30000);
        return () => clearInterval(interval);
    }, [client]);

    const emergencyPause = async (wallet, pause) => {
        try {
            const transaction = await client.createEmergencyPauseTransaction(
                wallet.publicKey, 
                pause
            );
            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature);
            
            // Refresh state
            const newState = await client.getProtocolState();
            setProtocolState(newState);
            
            return signature;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        client,
        protocolState,
        loading,
        error,
        emergencyPause,
        isPaused: protocolState?.isPaused || false,
        collateralRatio: protocolState?.collateralRatio || 0n
    };
}
