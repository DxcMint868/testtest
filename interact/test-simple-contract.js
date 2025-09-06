const ethers = require("ethers");

async function testSimpleContract() {
  try {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const privateKey = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Wallet address:", wallet.address);
    
    // Even simpler contract - just stores a value
    const contractSource = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract SimpleStorage {
        uint256 public storedData;
        
        constructor() {
            storedData = 100;
        }
        
        function set(uint256 x) public {
            storedData = x;
        }
        
        function get() public view returns (uint256) {
            return storedData;
        }
    }`;
    
    // Compiled bytecode for the above contract (Solidity 0.8.0)
    const bytecode = "0x608060405234801561001057600080fd5b5060646000819055506101128061002960003960006f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632a1afcd91460375780636057361d14604c575b600080fd5b60005460405190151581526020015b60405180910390f35b6057605736600460595b600055565b005b600035600e565b6000819050919050565b606e81605f565b8114607857600080fd5b50565b600081359050608881606581565b92915050565b600060208284031215609f57609e605a5760a95760ab565b600060b684828501607b565b91505092915050565b600060ca82605f565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820160fb5760fa60fc565b5b600182019050919050565bfe7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fdfea26469706673582212207c32e0fd361b69ba8b98056ea17bb88b8f5b2e8df3e8e35e5cf64c10c68e9ff64736f6c63430008130033";
    
    const abi = [
      "function storedData() public view returns (uint256)",
      "function set(uint256 x) public",
      "function get() public view returns (uint256)"
    ];
    
    // Check current block
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block:", blockNumber);
    
    // Deploy contract
    console.log("\nDeploying SimpleStorage contract...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy with higher gas limit
    const contract = await factory.deploy({
      gasLimit: 5000000,
      gasPrice: 0  // Try with zero gas price first
    });
    
    console.log("Transaction hash:", contract.deploymentTransaction().hash);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log("Contract deployed to:", address);
    
    // Verify deployment
    const code = await provider.getCode(address);
    console.log("Contract code exists:", code.length > 2);
    
    // Try to read initial value
    console.log("\nReading initial value...");
    try {
      const initialValue = await contract.get();
      console.log("Initial value from get():", initialValue.toString());
    } catch (e) {
      console.log("Error reading with get():", e.message);
    }
    
    try {
      const storedValue = await contract.storedData();
      console.log("Initial value from storedData():", storedValue.toString());
    } catch (e) {
      console.log("Error reading storedData:", e.message);
    }
    
    // Try to set a new value with higher gas
    console.log("\nSetting new value to 42...");
    try {
      const tx = await contract.set(42, {
        gasLimit: 500000,
        gasPrice: 0
      });
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction mined, status:", receipt.status);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      if (receipt.status === 1) {
        const newValue = await contract.get();
        console.log("New value:", newValue.toString());
      }
    } catch (e) {
      console.log("Error in set transaction:", e.message);
      if (e.receipt) {
        console.log("Receipt status:", e.receipt.status);
        console.log("Gas used:", e.receipt.gasUsed.toString());
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.info) {
      console.error("Error info:", error.info);
    }
  }
}

testSimpleContract();
