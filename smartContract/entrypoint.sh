#!/bin/sh

# Start Hardhat node in background
npx hardhat node --hostname 0.0.0.0 &

# Wait for the node to be ready
echo "Waiting for Hardhat node to start..."
sleep 5

# Deploy the contract to localhost
echo "Deploying smart contract..."
npx hardhat run scripts/deploy.ts --network localhost

# Keep the container running
wait
