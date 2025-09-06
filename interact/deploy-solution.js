const ethers = require("ethers");
const solc = require("solc");
const fs = require("fs");

/**
 * Solution for deploying and interacting with smart contracts on Quorum private blockchain
 * Key points:
 * 1. Use correct EVM version (London) as configured in genesis
 * 2. Use zero gas price as configured in the network
 * 3. Properly compile contracts with solc
 * 4. Handle chainId correctly (1337 for this network)
 */

async function deployContract(contractSource, contractName) {
  // Compile the contract
  const input = {
    language: "Solidity",
    sources: {
      [`${contractName}.sol`]: {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"]
        }
      },
      evmVersion: "london", // Important: Match the EVM version in genesis config
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for compilation errors
  if (output.errors) {
    const errors = output.errors.filter(err => err.severity === "error");
    if (errors.length > 0) {
      throw new Error(`Compilation failed: ${errors[0].formattedMessage}`);
    }
  }
  
  const contract = output.contracts[`${contractName}.sol`][contractName];
  return {
    bytecode: "0x" + contract.evm.bytecode.object,
    abi: contract.abi
  };
}

async function main() {
  try {
    // Configuration
    const RPC_URL = "http://localhost:8545";
    const PRIVATE_KEY = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
    
    // Connect to the network
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log("=".repeat(60));
    console.log("Quorum Private Blockchain - Smart Contract Deployment");
    console.log("=".repeat(60));
    
    // Network information
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);
    const blockNumber = await provider.getBlockNumber();
    
    console.log("\nNetwork Information:");
    console.log("  Chain ID:", network.chainId);
    console.log("  Current Block:", blockNumber);
    console.log("\nWallet Information:");
    console.log("  Address:", wallet.address);
    console.log("  Balance:", ethers.formatEther(balance), "ETH");
    
    // Example 1: Simple Storage Contract
    console.log("\n" + "=".repeat(60));
    console.log("Example 1: Simple Storage Contract");
    console.log("=".repeat(60));
    
    const simpleStorageSource = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract SimpleStorage {
        uint256 public number;
        event NumberChanged(uint256 newNumber, address changedBy);
        
        function store(uint256 num) public {
            number = num;
            emit NumberChanged(num, msg.sender);
        }
        
        function retrieve() public view returns (uint256) {
            return number;
        }
        
        function increment() public {
            number++;
            emit NumberChanged(number, msg.sender);
        }
    }`;
    
    const { bytecode: storageBytecode, abi: storageAbi } = await deployContract(
      simpleStorageSource, 
      "SimpleStorage"
    );
    
    console.log("\nDeploying SimpleStorage contract...");
    const storageFactory = new ethers.ContractFactory(storageAbi, storageBytecode, wallet);
    
    // Deploy with proper gas settings for private network
    const storageContract = await storageFactory.deploy({
      gasLimit: 3000000,
      gasPrice: 0  // Zero gas price for private network
    });
    
    await storageContract.waitForDeployment();
    const storageAddress = await storageContract.getAddress();
    console.log("✓ SimpleStorage deployed to:", storageAddress);
    
    // Test SimpleStorage
    console.log("\nTesting SimpleStorage contract:");
    
    // Store a value
    const storeTx = await storageContract.store(100, {
      gasLimit: 100000,
      gasPrice: 0
    });
    await storeTx.wait();
    console.log("✓ Stored value: 100");
    
    // Retrieve the value
    const retrievedValue = await storageContract.retrieve();
    console.log("✓ Retrieved value:", retrievedValue.toString());
    
    // Increment
    const incrementTx = await storageContract.increment({
      gasLimit: 100000,
      gasPrice: 0
    });
    await incrementTx.wait();
    const newValue = await storageContract.number();
    console.log("✓ After increment:", newValue.toString());
    
    // Example 2: Token Contract (simplified ERC20)
    console.log("\n" + "=".repeat(60));
    console.log("Example 2: Simple Token Contract");
    console.log("=".repeat(60));
    
    const tokenSource = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract SimpleToken {
        mapping(address => uint256) public balances;
        uint256 public totalSupply;
        string public name = "SimpleToken";
        string public symbol = "STK";
        uint8 public decimals = 18;
        
        event Transfer(address indexed from, address indexed to, uint256 value);
        
        constructor(uint256 _initialSupply) {
            totalSupply = _initialSupply * 10 ** uint256(decimals);
            balances[msg.sender] = totalSupply;
        }
        
        function balanceOf(address account) public view returns (uint256) {
            return balances[account];
        }
        
        function transfer(address to, uint256 amount) public returns (bool) {
            require(balances[msg.sender] >= amount, "Insufficient balance");
            balances[msg.sender] -= amount;
            balances[to] += amount;
            emit Transfer(msg.sender, to, amount);
            return true;
        }
    }`;
    
    const { bytecode: tokenBytecode, abi: tokenAbi } = await deployContract(
      tokenSource,
      "SimpleToken"
    );
    
    console.log("\nDeploying SimpleToken contract...");
    const tokenFactory = new ethers.ContractFactory(tokenAbi, tokenBytecode, wallet);
    
    const tokenContract = await tokenFactory.deploy(1000000, {
      gasLimit: 3000000,
      gasPrice: 0
    });
    
    await tokenContract.waitForDeployment();
    const tokenAddress = await tokenContract.getAddress();
    console.log("✓ SimpleToken deployed to:", tokenAddress);
    
    // Test Token Contract
    console.log("\nTesting SimpleToken contract:");
    
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    console.log("✓ Initial balance:", ethers.formatEther(tokenBalance), "STK");
    
    // Transfer some tokens to another address
    const recipientAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    const transferAmount = ethers.parseEther("100");
    
    const transferTx = await tokenContract.transfer(recipientAddress, transferAmount, {
      gasLimit: 100000,
      gasPrice: 0
    });
    await transferTx.wait();
    console.log("✓ Transferred 100 STK to:", recipientAddress);
    
    const recipientBalance = await tokenContract.balanceOf(recipientAddress);
    console.log("✓ Recipient balance:", ethers.formatEther(recipientBalance), "STK");
    
    const senderBalance = await tokenContract.balanceOf(wallet.address);
    console.log("✓ Sender balance after transfer:", ethers.formatEther(senderBalance), "STK");
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("Deployment Summary");
    console.log("=".repeat(60));
    console.log("\n✅ Successfully deployed and tested contracts:");
    console.log("   1. SimpleStorage at:", storageAddress);
    console.log("   2. SimpleToken at:", tokenAddress);
    console.log("\n📝 Key Configuration for Quorum with CLIQUE consensus:");
    console.log("   - Chain ID: 1337");
    console.log("   - Gas Price: 0 (free gas)");
    console.log("   - EVM Version: London");
    console.log("   - Block time: ~15 seconds");
    console.log("\n💡 Tips for successful contract deployment:");
    console.log("   - Always use gas price of 0 for this private network");
    console.log("   - Compile with London EVM version or earlier");
    console.log("   - Set reasonable gas limits (3M for deployment, 100K for transactions)");
    console.log("   - Wait for transaction receipts to ensure mining");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.receipt) {
      console.error("Transaction Receipt:", {
        status: error.receipt.status,
        gasUsed: error.receipt.gasUsed.toString(),
        blockNumber: error.receipt.blockNumber
      });
    }
  }
}

// Run the main function
main().catch(console.error);
