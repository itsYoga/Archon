import { ethers } from "hardhat";
import { RwaToken } from "../typechain-types"; // adjust path if needed

async function main() {
  const address = "YOUR_CONTRACT_ADDRESS";
  const rwaToken = (await ethers.getContractAt("RwaToken", address)) as RwaToken;
  const balance = await rwaToken.balanceOf("USER_ADDRESS");
  console.log("Balance:", balance.toString());

  // Example for ERC721:
  // import { MyNFT } from "../typechain-types";
  // const nft = (await ethers.getContractAt("MyNFT", address)) as MyNFT;
  // const tokenId = await nft.tokenOfOwnerByIndex("USER_ADDRESS", 0);
  // console.log("Token ID:", tokenId.toString());
}
main(); 