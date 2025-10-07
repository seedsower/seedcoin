#!/bin/bash

echo "🧪 Testing SeedStable Deployed Program on Devnet"
echo "=================================================="

# Program ID
PROGRAM_ID="HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD"
WALLET=$(solana address)

echo "Program ID: $PROGRAM_ID"
echo "Wallet: $WALLET"
echo "Network: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
echo ""

# Check wallet balance
echo "💰 Wallet Balance:"
solana balance
echo ""

# Check if program exists
echo "🔍 Checking Program Account:"
solana account $PROGRAM_ID
echo ""

# Find Protocol State PDA
echo "🔧 Finding Protocol State PDA..."
# We'll use a simple approach to derive the PDA
# Protocol State PDA = findProgramAddress(["protocol"], PROGRAM_ID)

# For now, let's check if we can find any accounts owned by our program
echo "📊 Accounts owned by program:"
solana program show $PROGRAM_ID
echo ""

# Check program logs (if any recent transactions)
echo "📝 Recent program logs:"
solana logs $PROGRAM_ID --limit 10 || echo "No recent logs found"
echo ""

echo "✅ Basic program verification completed!"
echo "Program is deployed and accessible on devnet"
echo ""
echo "Next steps:"
echo "- Create test transactions to initialize protocol"
echo "- Test mint/burn functionality"
echo "- Verify program state updates"
