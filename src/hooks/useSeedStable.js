import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// SeedStable Protocol Client Hook
export function useSeedStable(connection, programId, wallet) {
    const [protocolState, setProtocolState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [client, setClient] = useState(null);

    // Initialize client
    useEffect(() => {
        if (connection && programId) {
            const seedStableClient = new SeedStableClient(connection, programId);
            setClient(seedStableClient);
        }
    }, [connection, programId]);

    // Fetch protocol state
    const fetchProtocolState = useCallback(async () => {
        if (!client) return;

        try {
            setLoading(true);
            const state = await client.getProtocolState();
            setProtocolState(state);
            setError(null);
        } catch (err) {
            console.error('Error fetching protocol state:', err);
            setError(err.message);
            setProtocolState(null);
        } finally {
            setLoading(false);
        }
    }, [client]);

    // Initial fetch and polling
    useEffect(() => {
        fetchProtocolState();
        
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchProtocolState, 30000);
        return () => clearInterval(interval);
    }, [fetchProtocolState]);

    // Emergency pause function
    const emergencyPause = useCallback(async (pause) => {
        if (!client || !wallet) {
            throw new Error('Client or wallet not available');
        }

        try {
            const transaction = await client.createEmergencyPauseTransaction(
                wallet.publicKey, 
                pause
            );
            
            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            
            // Refresh state
            await fetchProtocolState();
            
            return signature;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [client, wallet, connection, fetchProtocolState]);

    return {
        client,
        protocolState,
        loading,
        error,
        emergencyPause,
        refresh: fetchProtocolState,
        isPaused: protocolState?.isPaused || false,
        collateralRatio: protocolState?.collateralRatio || 0n,
        isInitialized: !!protocolState
    };
}

// SeedStable Protocol Client Class
class SeedStableClient {
    constructor(connection, programId) {
        this.connection = connection;
        this.programId = new PublicKey(programId);
    }

    // Get Protocol State PDA
    getProtocolStatePDA() {
        const [pda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode('protocol')],
            this.programId
        );
        return pda;
    }

    // Get Treasury PDA
    getTreasuryPDA() {
        const [pda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode('treasury')],
            this.programId
        );
        return pda;
    }

    // Get instruction discriminator (browser-compatible)
    getDiscriminator(instructionName) {
        // Use known discriminators for browser compatibility
        const discriminators = {
            'initialize': [175, 175, 109, 31, 13, 152, 155, 237],
            'emergency_pause': [21, 143, 27, 142, 200, 181, 210, 255]
        };
        
        if (discriminators[instructionName]) {
            return new Uint8Array(discriminators[instructionName]);
        }
        
        throw new Error(`Unknown instruction: ${instructionName}`);
    }

    // Create Emergency Pause Transaction
    async createEmergencyPauseTransaction(authority, pause) {
        const protocolState = this.getProtocolStatePDA();

        const discriminator = this.getDiscriminator('emergency_pause');
        const pauseFlag = new Uint8Array([pause ? 1 : 0]);
        const pauseData = new Uint8Array(discriminator.length + pauseFlag.length);
        pauseData.set(discriminator, 0);
        pauseData.set(pauseFlag, discriminator.length);

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

        // Parse protocol state data
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
