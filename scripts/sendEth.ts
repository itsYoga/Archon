import { ethers } from "hardhat";

async function main() {
  // Get the signer (this will be the first account with ETH)
  const [signer] = await ethers.getSigners();
  
  // The address that needs ETH (your MetaMask account)
  const recipientAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account 3
  
  // Send 100 ETH to the recipient
  const amount = ethers.parseEther("100");
  
  console.log(`Sending ${ethers.formatEther(amount)} ETH to ${recipientAddress}...`);
  
  const tx = await signer.sendTransaction({
    to: recipientAddress,
    value: amount,
  });
  
  await tx.wait();
  
  console.log(`Transaction successful! Hash: ${tx.hash}`);
  
  // Check the balance
  const balance = await ethers.provider.getBalance(recipientAddress);
  console.log(`New balance: ${ethers.formatEther(balance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 