import { expect } from "chai";
import { ethers } from "hardhat";

describe("DidIdentity", function () {
  let didIdentity: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const DidIdentity = await ethers.getContractFactory("DidIdentity");
    didIdentity = await DidIdentity.deploy();
    await didIdentity.waitForDeployment();
  });

  it("should set the deployer as admin", async function () {
    expect(await didIdentity.admin()).to.equal(owner.address);
  });

  it("should allow admin to set and get KYC status", async function () {
    await didIdentity.setKycStatus(user.address, true);
    expect(await didIdentity.isVerified(user.address)).to.be.true;
    await didIdentity.setKycStatus(user.address, false);
    expect(await didIdentity.isVerified(user.address)).to.be.false;
  });

  it("should not allow non-admin to set KYC status", async function () {
    await expect(
      didIdentity.connect(user).setKycStatus(user.address, true)
    ).to.be.revertedWith("Not admin");
  });
}); 