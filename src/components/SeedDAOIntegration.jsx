import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Coins, Vote, TrendingUp } from 'lucide-react';

const SeedDAOIntegration = ({ walletAddress, connection }) => {
  const [sdaoBalance, setSdaoBalance] = useState(0);
  const [daoStats, setDaoStats] = useState({
    totalSupply: 10000000,
    totalStaked: 0,
    proposalCount: 0,
    votingPower: 0
  });
  const [loading, setLoading] = useState(false);

  // SeedDAO configuration
  const SDAO_MINT = new PublicKey('9N1zAerRJnQEqoCvabYmPzbokai2TMK5F8Jb8cEBZSvt');
  const SEEDDAO_PROGRAM_ID = new PublicKey('imhPqBdTKnajpiWiKY88kssdWC4eiwHvaLfQNu5vEvR');

  // Fetch SDAO balance and DAO stats
  const fetchDAOData = async () => {
    if (!walletAddress || !connection) return;

    setLoading(true);
    try {
      const walletPubkey = new PublicKey(walletAddress);
      
      // Fetch SDAO token balance
      try {
        const sdaoTokenAccount = await getAssociatedTokenAddress(SDAO_MINT, walletPubkey);
        const accountInfo = await getAccount(connection, sdaoTokenAccount);
        const balance = Number(accountInfo.amount) / Math.pow(10, 6); // 6 decimals
        setSdaoBalance(balance);
        
        // Update voting power (for now, same as balance)
        setDaoStats(prev => ({
          ...prev,
          votingPower: balance
        }));
      } catch (error) {
        console.log('No SDAO token account found');
        setSdaoBalance(0);
      }

    } catch (error) {
      console.error('Error fetching DAO data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDAOData();
  }, [walletAddress, connection]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(2);
  };

  if (!walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5 text-purple-600" />
            <span>SeedDAO Governance</span>
          </CardTitle>
          <CardDescription>
            Connect your wallet to participate in SeedDAO governance
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* SDAO Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-purple-600" />
              <span>Your SDAO Balance</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchDAOData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(sdaoBalance)}
              </div>
              <div className="text-sm text-gray-500">SDAO Tokens</div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Governance Token
            </Badge>
          </div>
          
          {sdaoBalance > 0 && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Vote className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Voting Power: {formatNumber(daoStats.votingPower)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Your voting power in DAO proposals
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DAO Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>DAO Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(daoStats.totalSupply)}
              </div>
              <div className="text-sm text-gray-500">Total Supply</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(daoStats.totalStaked)}
              </div>
              <div className="text-sm text-gray-500">Total Staked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {daoStats.proposalCount}
              </div>
              <div className="text-sm text-gray-500">Active Proposals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                18.5%
              </div>
              <div className="text-sm text-gray-500">Staking APY</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Program Deployed</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Active</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>SDAO Token Created</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Live</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Network</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Devnet</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Program ID:</strong> {SEEDDAO_PROGRAM_ID.toString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>SDAO Mint:</strong> {SDAO_MINT.toString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedDAOIntegration;
