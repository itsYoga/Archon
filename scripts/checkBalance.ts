import { ethers } from "hardhat";

async function main() {
  const RwaToken = await ethers.getContractFactory("RwaToken");
  const rwaToken = RwaToken.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
  
  const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const balance = await rwaToken.balanceOf(userAddress);
  console.log("User balance:", balance.toString());
  
  // Check if user has any tokens
  if (balance > 0) {
    for (let i = 0; i < balance; i++) {
      const tokenId = await rwaToken.tokenOfOwnerByIndex(userAddress, i);
      console.log("Token ID:", tokenId.toString());
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 