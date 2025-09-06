require('dotenv/config');
const ethers=require("ethers");

// Load private key from environment variable
const privateKey = process.env.DEV_PRIVATE_KEYS;
if (!privateKey) {
  throw new Error("Private key not found in environment variables. Set PRIVATE_KEY in .env file.");
}

const provider = new ethers.JsonRpcProvider("http://18.139.224.28:8545");
const wallet = new ethers.Wallet(privateKey, provider);

// Replace with your contract ABI and bytecode
const abi = [
  "function setValue(uint256 _value) public",
  "function getValue() public view returns (uint256)"
];
const bytecode = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b578063d09de08a14610059575b600080fd5b610043610075565b60405161005091906100a9565b60405180910390f35b610073600480360361006c5760003573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610094565b005b60008054905090565b806000819055505b50565b6000819050919050565b610095816100828356fe";

const factory = new ethers.ContractFactory(abi, bytecode, wallet);

async function deployContract() {
  console.log("Deploying contract...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
  console.log("Setting value to 100");
  await contract.setValue(BigInt(100));
  const val = await contract.getValue();
  console.log('Retrieved value: ', value);
}

deployContract().catch((error) => {
  console.error("Error deploying contract:", error);
});
