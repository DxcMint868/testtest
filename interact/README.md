# Quorum Private Blockchain - Smart Contract Deployment Guide

## Problem Identified
Your smart contracts were reverting because:
1. The contracts weren't compiled with the correct EVM version
2. Gas price configuration needed to match the genesis configuration

## Solution

### Key Configuration
- **Chain ID**: 1337
- **Gas Price**: 0 (zero-fee transactions as per genesis config)
- **EVM Version**: London (enabled at block 0 in your genesis)
- **Consensus**: CLIQUE with 15-second block time

### Required Setup
```bash
npm install ethers solc
```

### Correct Contract Deployment Process

1. **Compile contracts with proper EVM version**:
```javascript
const input = {
  language: "Solidity",
  sources: { /* your contract */ },
  settings: {
    evmVersion: "london",  // Critical: must match genesis config
    // ... other settings
  }
};
```

2. **Deploy with correct gas settings**:
```javascript
const contract = await factory.deploy({
  gasLimit: 3000000,  // Sufficient gas limit
  gasPrice: 0         // Zero gas price for private network
});
```

3. **Interact with contracts**:
```javascript
const tx = await contract.someMethod(param, {
  gasLimit: 100000,
  gasPrice: 0
});
await tx.wait();  // Always wait for confirmation
```

## Working Examples

### Quick Test
```bash
# Test simple storage contract
node compile-and-deploy.js

# Full example with multiple contracts
node deploy-solution.js
```

### Using Your Existing Script
Update your `deploy.js` to:
1. Use proper bytecode (compile with solc)
2. Set gasPrice to 0
3. Set appropriate gasLimit
4. Fix the typo: change `value` to `val` on line 29

## Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| "Wrong chainId" error | Ethers v6 auto-detects chainId, no manual setting needed |
| Transaction reverts | Use gasPrice: 0 and sufficient gasLimit |
| Contract not found | Always wait for deployment: `await contract.waitForDeployment()` |
| Gas exhaustion | Increase gasLimit to 3000000 for deployment |

## Network Details
- RPC Endpoint: http://localhost:8545
- Explorer: http://localhost:25000
- Pre-funded accounts in genesis (with private keys for testing)

## Additional Resources
- Besu Documentation: https://besu.hyperledger.org/
- Quorum Documentation: https://docs.goquorum.consensys.net/
- Ethers.js v6: https://docs.ethers.org/v6/
