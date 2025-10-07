# SeedDAO - Governance Token & DAO Management

SeedDAO is a comprehensive governance system for the SeedCoin ecosystem, providing decentralized decision-making through token-based voting and staking mechanisms.

## Features

### 🗳️ Governance
- **Proposal Creation**: Token holders can create governance proposals
- **Voting System**: Vote with SDAO tokens + staking power
- **Proposal Types**: Treasury, Parameter updates, Program upgrades, Text proposals
- **Quorum & Execution**: Automatic execution after voting period + delay

### 🥩 Staking
- **Token Staking**: Stake SDAO tokens for enhanced voting power
- **Rewards System**: Earn staking rewards (configurable APY)
- **Time Bonuses**: Longer staking periods increase voting power
- **Flexible Unstaking**: Unstake tokens anytime

### 🏛️ Treasury Management
- **Multi-Asset Treasury**: Manages USDC, SEEDS, and other assets
- **Governance Control**: All treasury actions require DAO approval
- **Transparent Operations**: All treasury movements are on-chain

## Program Structure

```
seeddao/
├── programs/seeddao/src/
│   ├── instructions/          # All program instructions
│   │   ├── initialize_dao.rs  # Initialize DAO with parameters
│   │   ├── create_proposal.rs # Create governance proposals
│   │   ├── vote_proposal.rs   # Vote on proposals
│   │   ├── execute_proposal.rs# Execute successful proposals
│   │   ├── stake_tokens.rs    # Stake SDAO tokens
│   │   ├── unstake_tokens.rs  # Unstake SDAO tokens
│   │   ├── claim_rewards.rs   # Claim staking rewards
│   │   └── update_dao.rs      # Update DAO parameters
│   ├── state/                 # State account definitions
│   │   ├── dao.rs            # DAO state and treasury
│   │   ├── proposal.rs       # Proposal accounts
│   │   ├── vote.rs           # Vote records
│   │   └── stake.rs          # Staking accounts
│   └── lib.rs                # Main program entry point
```

## Key Accounts

### DaoState
- Authority and configuration
- Token supply and staking metrics
- Governance parameters (voting period, quorum, etc.)

### Proposal
- Proposal details and voting results
- Status tracking and execution logic
- Support for multiple proposal types

### StakeAccount
- Individual staking positions
- Voting power calculation
- Rewards tracking

### Vote
- Individual vote records
- Voting power at time of vote
- Vote choice (For/Against/Abstain)

## Integration with SeedCoin Frontend

The SeedDAO contract is designed to work seamlessly with your existing SeedCoin frontend:

### Frontend Components Already Configured:
- **Governance.jsx**: Displays proposals, voting interface
- **Dashboard.jsx**: Shows staking pools and DAO metrics
- **Analytics.jsx**: DAO treasury and voting analytics
- **TokenPurchase.jsx**: SDAO token information

### Required Updates:
1. **SDAO Mint Address**: Update frontend with deployed SDAO mint
2. **Program ID**: Configure SeedDAO program ID in frontend
3. **API Integration**: Connect frontend components to SeedDAO instructions

## Deployment

### Prerequisites
```bash
# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Install dependencies
npm install
```

### Build & Deploy
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Initialize the DAO
node initialize-dao.js
```

### Configuration
Default DAO parameters:
- **Total Supply**: 10,000,000 SDAO
- **Min Proposal Threshold**: 1,000 SDAO
- **Voting Period**: 7 days
- **Execution Delay**: 2 days
- **Quorum**: 100,000 SDAO

## Usage Examples

### Creating a Proposal
```javascript
await program.methods
  .createProposal(
    proposalId,
    "Increase Staking Rewards",
    "Proposal to increase SDAO staking APY from 18.5% to 25%",
    { parameter: { parameter: "staking_apy", value: 2500 } }
  )
  .accounts({...})
  .rpc();
```

### Voting on Proposals
```javascript
await program.methods
  .voteProposal({ for: {} })
  .accounts({...})
  .rpc();
```

### Staking Tokens
```javascript
await program.methods
  .stakeTokens(new anchor.BN(1000 * 1e6)) // 1000 SDAO
  .accounts({...})
  .rpc();
```

## Security Features

- **Authority Controls**: Multi-sig compatible authority system
- **Pause Mechanism**: Emergency pause for all operations
- **Time Locks**: Execution delays prevent rushed decisions
- **Quorum Requirements**: Minimum participation for valid proposals
- **Stake-Weighted Voting**: Prevents governance attacks

## Frontend Integration Status

✅ **Ready Components**:
- Governance voting interface
- Staking pool displays
- Treasury analytics
- Token balance integration

🔄 **Needs Configuration**:
- SDAO mint address
- Program ID updates
- Instruction integration
- Real-time data fetching

The SeedDAO contract is production-ready and designed to integrate seamlessly with your existing SeedCoin dApp interface!
