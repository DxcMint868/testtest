const ethers = require("ethers");

async function checkEVM() {
  try {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const privateKey = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Try deploying the absolute simplest contract possible
    // This is just: contract Simple { }
    const simplestBytecode = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea265627a7a72315820e5bb6e8f5e9b7f68c917e9a6b4e8e8f5e9b7f68c917e9a6b4e8e8f5e9b7f68c64736f6c63430005110032";
    
    // Alternative: Just return 42 - minimal runtime code
    const minimalBytecode = "0x602a60005260206000f3";  // PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
    
    console.log("Testing minimal contract deployment...");
    
    // Send raw transaction for deployment
    const tx = {
      from: wallet.address,
      data: minimalBytecode,
      gasLimit: 1000000,
      gasPrice: 0,
      nonce: await provider.getTransactionCount(wallet.address)
    };
    
    console.log("Transaction:", tx);
    
    const signedTx = await wallet.signTransaction(tx);
    console.log("Signed transaction");
    
    const txResponse = await provider.broadcastTransaction(signedTx);
    console.log("Transaction hash:", txResponse.hash);
    
    const receipt = await txResponse.wait();
    console.log("Receipt status:", receipt.status);
    console.log("Contract address:", receipt.contractAddress);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.contractAddress) {
      const code = await provider.getCode(receipt.contractAddress);
      console.log("Deployed code:", code);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.receipt) {
      console.log("Receipt:", error.receipt);
    }
  }
}

checkEVM();
