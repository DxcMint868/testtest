const ethers = require("ethers");

async function testWithChainId() {
  try {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const privateKey = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
    
    // Get the network info
    const network = await provider.getNetwork();
    console.log("Network chainId:", network.chainId);
    
    // Create wallet with correct network
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Wallet address:", wallet.address);
    
    // Simple storage contract bytecode (compiled with Solidity 0.8.0)
    const bytecode = "0x608060405234801561001057600080fd5b5060f78061001f6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80632e64cec11460415780636057361d146053575b600080fd5b60005460405190151581526020015b60405180910390f35b605e605f36600460613b565b600055565b005b600035600e565b606f81606a565b8114607957600080fd5b50565b600081359050608881606681565b92915050565b600060208284031215609f57609e60615760a9565b600060ab84828501607c565b91505092915050565bfea26469706673582212207c5b0e8f361b69ba8b98056ea17bb88b8f5b2e8df3e8e35e5cf64c10c68e9ff64736f6c63430008000033";
    
    const abi = [
      "function retrieve() public view returns (uint256)",
      "function store(uint256 num) public"
    ];
    
    console.log("\nDeploying contract...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy with explicit chainId in transaction
    const deployTx = await factory.getDeployTransaction({
      gasLimit: 3000000,
      gasPrice: 1000000000,  // 1 gwei
      type: 0  // Legacy transaction type
    });
    
    console.log("Deploy transaction data length:", deployTx.data.length);
    
    // Send the deployment transaction
    const tx = await wallet.sendTransaction({
      ...deployTx,
      chainId: Number(network.chainId)
    });
    
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    
    console.log("Receipt status:", receipt.status);
    console.log("Contract address:", receipt.contractAddress);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.status === 1 && receipt.contractAddress) {
      console.log("\nContract deployed successfully!");
      
      // Create contract instance
      const contract = new ethers.Contract(receipt.contractAddress, abi, wallet);
      
      // Test storing a value
      console.log("\nStoring value 42...");
      const storeTx = await contract.store(42, {
        gasLimit: 100000,
        gasPrice: 1000000000
      });
      await storeTx.wait();
      console.log("Value stored!");
      
      // Test retrieving the value
      const value = await contract.retrieve();
      console.log("Retrieved value:", value.toString());
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.receipt) {
      console.log("Receipt status:", error.receipt.status);
      console.log("Gas used:", error.receipt.gasUsed?.toString());
    }
    if (error.reason) {
      console.log("Revert reason:", error.reason);
    }
  }
}

testWithChainId();
