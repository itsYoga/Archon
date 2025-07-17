import { expect } from "chai";
import { ethers } from "hardhat";

describe("RwaToken", function () {
  let didIdentity: any;
  let rwaToken: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const DidIdentity = await ethers.getContractFactory("DidIdentity");
    didIdentity = await DidIdentity.deploy();
    await didIdentity.waitForDeployment();
    const RwaToken = await ethers.getContractFactory("RwaToken");
    rwaToken = await RwaToken.deploy(await didIdentity.getAddress());
    await rwaToken.waitForDeployment();
  });

  it("should only allow owner to mint", async function () {
    await didIdentity.setKycStatus(user1.address, true);
    await expect(rwaToken.connect(user1).mint(user1.address)).to.be.revertedWith("Not owner");
    await expect(rwaToken.mint(user1.address)).to.emit(rwaToken, "Minted");
  });

  it("should not mint to non-KYC user", async function () {
    await expect(rwaToken.mint(user1.address)).to.be.revertedWith("Recipient not KYC verified");
  });

  it("should allow transfer between KYC users", async function () {
    await didIdentity.setKycStatus(user1.address, true);
    await didIdentity.setKycStatus(user2.address, true);
    await rwaToken.mint(user1.address);
    await rwaToken.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, 1);
    expect(await rwaToken.ownerOf(1)).to.equal(user2.address);
  });

  it("should revert transfer to non-KYC user", async function () {
    await didIdentity.setKycStatus(user1.address, true);
    await rwaToken.mint(user1.address);
    await expect(
      rwaToken.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user3.address, 1)
    ).to.be.revertedWith("Recipient not KYC verified");
  });
}); 