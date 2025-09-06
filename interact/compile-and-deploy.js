const ethers = require("ethers");
const solc = require("solc");
const fs = require("fs");

async function compileAndDeploy() {
  try {
    // Read the contract source
    const contractSource = fs.readFileSync("SimpleStorage.sol", "utf8");
    
    // Compile the contract
    const input = {
      language: "Solidity",
      sources: {
        "SimpleStorage.sol": {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"]
          }
        },
        evmVersion: "london"  // Use London EVM version since it's enabled at block 0
      }
    };
    
    console.log("Compiling contract...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
      output.errors.forEach(err => {
        if (err.severity === "error") {
          console.error("Compilation error:", err.formattedMessage);
        }
      });
    }
    
    const contract = output.contracts["SimpleStorage.sol"]["SimpleStorage"];
    const bytecode = "0x" + contract.evm.bytecode.object;
    const abi = contract.abi;
    
    console.log("Contract compiled successfully");
    console.log("Bytecode length:", bytecode.length);
    
    // Connect to the network
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const privateKey = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const balance = await provider.getBalance(wallet.address);
    console.log("\nWallet address:", wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    
    // Get network info
    const network = await provider.getNetwork();
    console.log("Chain ID:", network.chainId);
    
    // Deploy the contract
    console.log("\nDeploying contract...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    const deploymentOptions = {
      gasLimit: 3000000,
      gasPrice: 0  // Zero gas price as configured in genesis
    };
    
    const deployedContract = await factory.deploy(deploymentOptions);
    console.log("Transaction hash:", deployedContract.deploymentTransaction().hash);
    
    console.log("Waiting for deployment...");
    await deployedContract.waitForDeployment();
    
    const contractAddress = await deployedContract.getAddress();
    console.log("Contract deployed to:", contractAddress);
    
    // Verify deployment
    const deployedCode = await provider.getCode(contractAddress);
    console.log("Deployed code exists:", deployedCode.length > 2);
    
    // Test the contract
    console.log("\nTesting contract...");
    
    // Store a value
    console.log("Storing value 42...");
    const storeTx = await deployedContract.store(42, {
      gasLimit: 100000,
      gasPrice: 0
    });
    console.log("Store transaction hash:", storeTx.hash);
    const storeReceipt = await storeTx.wait();
    console.log("Store transaction status:", storeReceipt.status);
    
    // Retrieve the value
    const value = await deployedContract.retrieve();
    console.log("Retrieved value:", value.toString());
    
    // Try reading the public variable directly
    const number = await deployedContract.number();
    console.log("Public variable 'number':", number.toString());
    
  } catch (error) {
    console.error("\nError:", error.message);
    if (error.receipt) {
      console.error("Transaction failed!");
      console.error("Status:", error.receipt.status);
      console.error("Gas used:", error.receipt.gasUsed.toString());
      console.error("Block number:", error.receipt.blockNumber);
    }
    if (error.transaction) {
      console.error("Failed transaction data:", {
        from: error.transaction.from,
        to: error.transaction.to,
        data: error.transaction.data?.substring(0, 100) + "..."
      });
    }
  }
}

compileAndDeploy();
