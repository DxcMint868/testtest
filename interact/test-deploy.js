const ethers = require("ethers");

async function testDeploy() {
  try {
    // Connect to local node
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    
    // Use one of the pre-funded accounts from genesis
    const privateKey = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Wallet address:", wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    
    // Simple storage contract
    const abi = [
      "function store(uint256 num) public",
      "function retrieve() public view returns (uint256)"
    ];
    
    const bytecode = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b6040516100509190610090565b60405180910390f35b610073600480360381019061006e91906100dc565b61007e565b005b60008054905090565b8060008190555050565b610089816100f0565b82525050565b60006020820190506100a56000830184610080565b92915050565b600080fd5b6100b9816100f0565b81146100c457600080fd5b50565b6000813590506100d6816100b0565b92915050565b6000602082840312156100f2576100f16100ab565b5b6000610100848285016100c7565b91505092915050565b6000819050919050565b61011d816100f0565b811461012857600080fd5b5056fea26469706673582212208a76097aefa85bdc088e3339874f64c9ee5c2eef3bb82bb5cccecff8e91ab67f64736f6c634300081a0033";
    
    // Get chain ID
    const network = await provider.getNetwork();
    console.log("Chain ID:", network.chainId);
    
    // Check gas price
    const gasPrice = await provider.getFeeData();
    console.log("Gas price:", gasPrice.gasPrice?.toString());
    
    // Deploy with explicit gas settings
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log("\nDeploying contract...");
    const contract = await factory.deploy({
      gasLimit: 3000000,
      gasPrice: 0  // Free gas on private network
    });
    
    console.log("Transaction hash:", contract.deploymentTransaction().hash);
    console.log("Waiting for deployment...");
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("Contract deployed to:", address);
    
    // Test contract interaction
    console.log("\nTesting contract interaction...");
    const tx = await contract.store(42, {
      gasLimit: 100000,
      gasPrice: 0
    });
    console.log("Store transaction hash:", tx.hash);
    await tx.wait();
    
    const value = await contract.retrieve();
    console.log("Retrieved value:", value.toString());
    
  } catch (error) {
    console.error("Error:", error);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    if (error.reason) {
      console.error("Error reason:", error.reason);
    }
  }
}

testDeploy();
