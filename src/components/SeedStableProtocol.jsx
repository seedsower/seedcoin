import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Loader2, Shield, AlertTriangle, CheckCircle, Pause, Play } from 'lucide-react';
import { useWallet } from '../hooks/useWallet.js';
import { useSeedStable } from '../hooks/useSeedStable.js';

const PROGRAM_ID = 'HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD';
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

export default function SeedStableProtocol() {
    const [connection] = useState(() => new Connection(RPC_ENDPOINT, 'confirmed'));
    const { 
        wallet, 
        connected, 
        connecting, 
        publicKey, 
        balance, 
        connect, 
        disconnect, 
        getBalance,
        isPhantomInstalled 
    } = useWallet();
    
    const {
        protocolState,
        loading,
        error,
        emergencyPause,
        refresh,
        isPaused,
        collateralRatio,
        isInitialized
    } = useSeedStable(connection, PROGRAM_ID, wallet);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);

    // Update balance when connected
    useEffect(() => {
        if (connected && publicKey) {
            getBalance(connection);
            const interval = setInterval(() => getBalance(connection), 30000);
            return () => clearInterval(interval);
        }
    }, [connected, publicKey, getBalance, connection]);

    const handleEmergencyPause = async (pause) => {
        if (!connected) {
            setActionError('Please connect your wallet first');
            return;
        }

        try {
            setActionLoading(true);
            setActionError(null);
            
            const signature = await emergencyPause(pause);
            console.log(`Protocol ${pause ? 'paused' : 'unpaused'}:`, signature);
            
            // Show success message
            setTimeout(() => {
                setActionError(null);
            }, 3000);
            
        } catch (err) {
            console.error('Emergency pause error:', err);
            setActionError(err.message || 'Transaction failed');
        } finally {
            setActionLoading(false);
        }
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        const str = address.toString();
        return `${str.slice(0, 4)}...${str.slice(-4)}`;
    };

    const formatNumber = (num) => {
        if (typeof num === 'bigint') {
            return num.toString();
        }
        return num?.toLocaleString() || '0';
    };

    if (!isPhantomInstalled) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Phantom wallet is required to interact with the SeedStable protocol. 
                        <a 
                            href="https://phantom.app/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline"
                        >
                            Install Phantom Wallet
                        </a>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        SeedStable Protocol
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Decentralized stablecoin protocol on Solana
                    </p>
                </div>
                
                {/* Wallet Connection */}
                <div className="flex items-center space-x-4">
                    {connected ? (
                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatAddress(publicKey)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {balance.toFixed(4)} SOL
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={disconnect}
                            >
                                Disconnect
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            onClick={connect} 
                            disabled={connecting}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {connecting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect Wallet'
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Protocol Status */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                            <Shield className="mr-2 h-5 w-5" />
                            Protocol Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : error ? (
                            <Badge variant="destructive">Error</Badge>
                        ) : isInitialized ? (
                            <div className="space-y-2">
                                <Badge 
                                    variant={isPaused ? "destructive" : "default"}
                                    className={isPaused ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                                >
                                    {isPaused ? 'Paused' : 'Active'}
                                </Badge>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Program: {formatAddress(PROGRAM_ID)}
                                </div>
                            </div>
                        ) : (
                            <Badge variant="secondary">Not Initialized</Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Collateral Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : protocolState ? (
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {collateralRatio === 18446744073709551615n ? '∞' : `${Number(collateralRatio)}%`}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Min: {Number(protocolState.minCollateralRatio)}%
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500">N/A</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Total Supply</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : protocolState ? (
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatNumber(protocolState.totalStablecoinSupply)} SEEDS
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Collateral: ${formatNumber(protocolState.totalCollateralValue)}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500">N/A</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Protocol Details */}
            {protocolState && (
                <Card>
                    <CardHeader>
                        <CardTitle>Protocol Information</CardTitle>
                        <CardDescription>
                            Detailed information about the SeedStable protocol state
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Authority
                                    </label>
                                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                                        {formatAddress(protocolState.authority)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Stablecoin Mint
                                    </label>
                                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                                        {formatAddress(protocolState.stablecoinMint)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Treasury
                                    </label>
                                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                                        {formatAddress(protocolState.treasury)}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Peg Deviation Threshold
                                    </label>
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {Number(protocolState.pegDeviationThreshold)}%
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Last Rebalance
                                    </label>
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {new Date(Number(protocolState.lastRebalanceTimestamp) * 1000).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Protocol Bump
                                    </label>
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {protocolState.bump}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Admin Controls */}
            {connected && protocolState && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="mr-2 h-5 w-5" />
                            Emergency Controls
                        </CardTitle>
                        <CardDescription>
                            Administrative functions for protocol management
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => handleEmergencyPause(!isPaused)}
                                disabled={actionLoading}
                                variant={isPaused ? "default" : "destructive"}
                                className={isPaused ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                                {actionLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : isPaused ? (
                                    <Play className="mr-2 h-4 w-4" />
                                ) : (
                                    <Pause className="mr-2 h-4 w-4" />
                                )}
                                {isPaused ? 'Resume Protocol' : 'Emergency Pause'}
                            </Button>
                            
                            <Button
                                onClick={refresh}
                                variant="outline"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Refresh'
                                )}
                            </Button>
                        </div>

                        {actionError && (
                            <Alert className="mt-4 border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-red-800">
                                    {actionError}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Success Messages */}
            {!error && !loading && isInitialized && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">
                        SeedStable protocol is successfully deployed and operational on Solana devnet!
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
