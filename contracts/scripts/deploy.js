const { ethers } = require("hardhat");

async function main() {
  const contract = await ethers.getContractFactory("chainScout");
  
  console.log("Deploying contract...");
  const deployedContract = await contract.deploy("0xaA4D74cacC47aCAD1a9fd5FD6eD1f81A2E57fA17");

  // This is the new way to wait for deployment in Ethers.js v6
  await deployedContract.waitForDeployment();

  // This is the new way to get the address in Ethers.js v6
  console.log(`Contract Deployed at address: ${deployedContract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});