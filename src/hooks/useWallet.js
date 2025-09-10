import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

// Wallet connection hook for Solana
export function useWallet() {
    const [wallet, setWallet] = useState(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [balance, setBalance] = useState(0);

    // Check if wallet is available
    const getProvider = useCallback(() => {
        if (typeof window !== 'undefined') {
            if ('solana' in window) {
                const provider = window.solana;
                if (provider.isPhantom) {
                    return provider;
                }
            }
        }
        return null;
    }, []);

    // Connect wallet
    const connect = useCallback(async () => {
        const provider = getProvider();
        if (!provider) {
            throw new Error('Phantom wallet not found! Please install Phantom wallet.');
        }

        try {
            setConnecting(true);
            const response = await provider.connect();
            const pubKey = new PublicKey(response.publicKey.toString());
            
            setWallet(provider);
            setPublicKey(pubKey);
            setConnected(true);
            
            // Store connection in localStorage
            localStorage.setItem('walletConnected', 'true');
            
            return pubKey;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        } finally {
            setConnecting(false);
        }
    }, [getProvider]);

    // Disconnect wallet
    const disconnect = useCallback(async () => {
        const provider = getProvider();
        if (provider) {
            try {
                await provider.disconnect();
            } catch (error) {
                console.error('Error disconnecting wallet:', error);
            }
        }
        
        setWallet(null);
        setPublicKey(null);
        setConnected(false);
        setBalance(0);
        
        // Remove from localStorage
        localStorage.removeItem('walletConnected');
    }, [getProvider]);

    // Send transaction
    const sendTransaction = useCallback(async (transaction, connection) => {
        if (!wallet || !connected) {
            throw new Error('Wallet not connected');
        }

        try {
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signed = await wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());
            
            return signature;
        } catch (error) {
            console.error('Error sending transaction:', error);
            throw error;
        }
    }, [wallet, connected, publicKey]);

    // Get balance
    const getBalance = useCallback(async (connection) => {
        if (!publicKey || !connection) return 0;
        
        try {
            const balance = await connection.getBalance(publicKey);
            const solBalance = balance / 1e9; // Convert lamports to SOL
            setBalance(solBalance);
            return solBalance;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }, [publicKey]);

    // Auto-connect on page load if previously connected
    useEffect(() => {
        const wasConnected = localStorage.getItem('walletConnected');
        if (wasConnected === 'true') {
            const provider = getProvider();
            if (provider) {
                provider.connect({ onlyIfTrusted: true })
                    .then((response) => {
                        const pubKey = new PublicKey(response.publicKey.toString());
                        setWallet(provider);
                        setPublicKey(pubKey);
                        setConnected(true);
                    })
                    .catch(() => {
                        // Silent fail for auto-connect
                        localStorage.removeItem('walletConnected');
                    });
            }
        }
    }, [getProvider]);

    // Listen for wallet events
    useEffect(() => {
        const provider = getProvider();
        if (provider) {
            const handleAccountChanged = (publicKey) => {
                if (publicKey) {
                    setPublicKey(new PublicKey(publicKey.toString()));
                } else {
                    disconnect();
                }
            };

            provider.on('accountChanged', handleAccountChanged);
            provider.on('disconnect', disconnect);

            return () => {
                provider.removeListener('accountChanged', handleAccountChanged);
                provider.removeListener('disconnect', disconnect);
            };
        }
    }, [getProvider, disconnect]);

    return {
        wallet,
        connected,
        connecting,
        publicKey,
        balance,
        connect,
        disconnect,
        sendTransaction,
        getBalance,
        isPhantomInstalled: !!getProvider()
    };
}
