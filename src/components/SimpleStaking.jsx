import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';

const SimpleStaking = ({ walletAddress }) => {
  const [sdaoBalance, setSdaoBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [error, setError] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [detectedWallet, setDetectedWallet] = useState('');

  // Check for wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (window.solana && window.solana.isPhantom) {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          if (response.publicKey) {
            setDetectedWallet(response.publicKey.toString());
            setIsWalletConnected(true);
          }
        }
      } catch (error) {
        console.log('No wallet auto-connection available');
      }
    };
    
    checkWalletConnection();
  }, []);

  // Fetch SDAO balance
  useEffect(() => {
    const SDAO_MINT = new PublicKey('9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt');
    const fetchBalance = async () => {
      const activeWallet = detectedWallet || walletAddress;
      if (!activeWallet) return;
      
      setLoading(true);
      try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const walletPubkey = new PublicKey(activeWallet);
        const tokenAccount = await getAssociatedTokenAddress(SDAO_MINT, walletPubkey);
        
        const accountInfo = await getAccount(connection, tokenAccount);
        const balance = Number(accountInfo.amount) / Math.pow(10, 6);
        setSdaoBalance(balance);
        setError('');
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Could not fetch SDAO balance');
        setSdaoBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [walletAddress]);

  const connectWallet = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        if (response.publicKey) {
          setDetectedWallet(response.publicKey.toString());
          setIsWalletConnected(true);
          setError('');
          return response.publicKey.toString();
        }
      } else {
        setError('Phantom wallet not found. Please install Phantom wallet.');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
    return null;
  };

  const handleStake = async () => {
    const activeWallet = detectedWallet || walletAddress;
    
    // Check wallet connection first
    if (!activeWallet && !isWalletConnected) {
      const connectedWallet = await connectWallet();
      if (!connectedWallet) {
        setError('Please connect your wallet first');
        return;
      }
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (amount > sdaoBalance) {
      setError('Insufficient SDAO balance');
      return;
    }

    if (amount < 100) {
      setError('Minimum stake amount is 100 SDAO');
      return;
    }

    // Simulate staking with wallet connection
    const walletToUse = detectedWallet || walletAddress;
    alert(`Staking ${amount} SDAO tokens from wallet ${walletToUse.slice(0, 8)}...!\n\nThis is a demo. In the real implementation, this would:\n1. Create an SPL token transfer transaction\n2. Transfer tokens to staking vault\n3. Start earning 18.5% APY\n\nWallet Connected: ✅`);
    setStakeAmount('');
    setError('');
  };

  const activeWallet = detectedWallet || walletAddress;
  const walletConnected = isWalletConnected || !!walletAddress;

  if (!activeWallet && !walletConnected) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">SDAO Staking</h3>
        <p className="text-gray-600 mb-4">Connect your wallet to start staking SDAO tokens</p>
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Connect Phantom Wallet
        </button>
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Status */}
      {activeWallet && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Wallet Connected</p>
              <p className="text-xs text-green-600">{activeWallet.slice(0, 8)}...{activeWallet.slice(-8)}</p>
            </div>
            <div className="text-green-600">✅</div>
          </div>
        </div>
      )}

      {/* Balance Display */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-green-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">SDAO Balance</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? 'Loading...' : sdaoBalance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">SDAO</p>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-blue-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">APY</p>
            <p className="text-2xl font-bold text-blue-600">18.5%</p>
            <p className="text-xs text-gray-500">Annual Percentage Yield</p>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-purple-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">Min Stake</p>
            <p className="text-2xl font-bold text-purple-600">100</p>
            <p className="text-xs text-gray-500">SDAO</p>
          </div>
        </div>
      </div>

      {/* Staking Interface */}
      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Stake SDAO Tokens</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount to Stake
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Enter SDAO amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                disabled={loading}
              />
              <button
                onClick={() => setStakeAmount(Math.floor(sdaoBalance).toString())}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Max
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: {sdaoBalance.toLocaleString()} SDAO
            </p>
          </div>

          {stakeAmount && parseFloat(stakeAmount) > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Daily Rewards:</span>
                  <span className="font-medium">
                    {(parseFloat(stakeAmount) * 0.185 / 365).toFixed(2)} SDAO
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Rewards:</span>
                  <span className="font-medium">
                    {(parseFloat(stakeAmount) * 0.185).toFixed(2)} SDAO
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleStake}
            disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Stake SDAO Tokens'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-1">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Live Staking Status</p>
            <p>Your SDAO tokens are ready for staking on Solana devnet. Earn 18.5% APY with no lock period.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleStaking;
