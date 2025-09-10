import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Loader2, Shield, CheckCircle, ExternalLink, Copy } from 'lucide-react';

const PROGRAM_ID = 'HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD';
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

export default function ProtocolDemo() {
    const [protocolData, setProtocolData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch protocol data using the test script approach
    useEffect(() => {
        const fetchProtocolData = async () => {
            try {
                setLoading(true);
                const connection = new Connection(RPC_ENDPOINT, 'confirmed');
                
                // Get protocol state PDA
                const { PublicKey } = await import('@solana/web3.js');
                const programId = new PublicKey(PROGRAM_ID);
                
                const [protocolState] = PublicKey.findProgramAddressSync(
                    [new TextEncoder().encode('protocol')],
                    programId
                );

                const [treasury] = PublicKey.findProgramAddressSync(
                    [new TextEncoder().encode('treasury')],
                    programId
                );

                // Check if protocol is initialized
                const protocolInfo = await connection.getAccountInfo(protocolState);
                
                if (protocolInfo) {
                    // Parse basic protocol data
                    const data = protocolInfo.data;
                    const parsedData = {
                        isInitialized: true,
                        programId: PROGRAM_ID,
                        protocolState: protocolState.toString(),
                        treasury: treasury.toString(),
                        accountSize: protocolInfo.data.length,
                        authority: new PublicKey(data.slice(8, 40)).toString(),
                        stablecoinMint: new PublicKey(data.slice(40, 72)).toString(),
                        treasuryAccount: new PublicKey(data.slice(72, 104)).toString(),
                        isPaused: data[144] === 1,
                        network: 'Solana Devnet'
                    };
                    
                    setProtocolData(parsedData);
                } else {
                    setProtocolData({
                        isInitialized: false,
                        programId: PROGRAM_ID,
                        protocolState: protocolState.toString(),
                        treasury: treasury.toString(),
                        network: 'Solana Devnet'
                    });
                }
                
                setError(null);
            } catch (err) {
                console.error('Error fetching protocol data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProtocolData();
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="flex items-center space-x-3">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading SeedStable Protocol...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert className="border-red-200 bg-red-50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                        Error loading protocol: {error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    SeedStable Protocol Demo
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Live demonstration of the deployed SeedStable protocol on Solana Devnet
                </p>
            </div>

            {/* Status Card */}
            <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                        <CheckCircle className="mr-2 h-6 w-6" />
                        Protocol Status: {protocolData?.isInitialized ? 'Operational' : 'Not Initialized'}
                    </CardTitle>
                    <CardDescription className="text-green-700">
                        {protocolData?.isInitialized 
                            ? 'SeedStable protocol is successfully deployed and operational'
                            : 'Protocol deployment detected but not yet initialized'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {protocolData?.network}
                            </Badge>
                            {protocolData?.isInitialized && (
                                <Badge variant="secondary" className={
                                    protocolData?.isPaused 
                                        ? "bg-red-100 text-red-800" 
                                        : "bg-green-100 text-green-800"
                                }>
                                    {protocolData?.isPaused ? 'Paused' : 'Active'}
                                </Badge>
                            )}
                        </div>
                        {protocolData?.isInitialized && (
                            <div className="text-right">
                                <div className="text-sm text-gray-600">Account Size</div>
                                <div className="font-medium">{protocolData?.accountSize} bytes</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Protocol Details */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Program Information</CardTitle>
                        <CardDescription>Core program identifiers and addresses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Program ID
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                                    {formatAddress(protocolData?.programId)}
                                </code>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => copyToClipboard(protocolData?.programId)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => window.open(`https://explorer.solana.com/address/${protocolData?.programId}?cluster=devnet`, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Protocol State PDA
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                                    {formatAddress(protocolData?.protocolState)}
                                </code>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => copyToClipboard(protocolData?.protocolState)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => window.open(`https://explorer.solana.com/address/${protocolData?.protocolState}?cluster=devnet`, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Treasury PDA
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                                    {formatAddress(protocolData?.treasury)}
                                </code>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => copyToClipboard(protocolData?.treasury)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => window.open(`https://explorer.solana.com/address/${protocolData?.treasury}?cluster=devnet`, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {protocolData?.isInitialized && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Protocol Configuration</CardTitle>
                            <CardDescription>Current protocol settings and state</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Authority
                                </label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                                        {formatAddress(protocolData?.authority)}
                                    </code>
                                    <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => copyToClipboard(protocolData?.authority)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Stablecoin Mint
                                </label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                                        {formatAddress(protocolData?.stablecoinMint)}
                                    </code>
                                    <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => copyToClipboard(protocolData?.stablecoinMint)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Treasury Account
                                </label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                                        {formatAddress(protocolData?.treasuryAccount)}
                                    </code>
                                    <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => copyToClipboard(protocolData?.treasuryAccount)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Features */}
            <Card>
                <CardHeader>
                    <CardTitle>Protocol Features</CardTitle>
                    <CardDescription>Available functionality in the current deployment</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Protocol Initialization</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Emergency Pause/Resume</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">PDA Account Management</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">State Persistence</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                                <span className="text-sm text-gray-500">Collateral Management (Implemented)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                                <span className="text-sm text-gray-500">Mint/Burn Operations (Implemented)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                                <span className="text-sm text-gray-500">Liquidation System (Implemented)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                                <span className="text-sm text-gray-500">Oracle Integration (Implemented)</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                    <strong>Deployment Successful!</strong> The SeedStable protocol has been successfully deployed to Solana Devnet. 
                    Core functionality is operational and ready for frontend integration. Full instruction set available but 
                    currently limited to essential operations for security.
                </AlertDescription>
            </Alert>
        </div>
    );
}
