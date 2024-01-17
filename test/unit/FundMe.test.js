const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.parseEther("1"); // 1 ETH (1 * 10 ** 18)
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]); // Deploy all contracts from "deploy" folder
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      describe("constructor", async function () {
        it("Sets the aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed();
          // console.log(`response: ${response}`);

          mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
          // console.log(`mockV3Aggregator: ${await mockV3Aggregator.getAddress()}`);

          assert.equal(response, await mockV3Aggregator.getAddress());
        });
      });

      describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.revertedWith("Didn't send enough ETH");
        });

        it("Adds funder to array of funders", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });

        it("Updates the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("Withdraw ETH from a single funder", async function () {
          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingDeployerBalance,
            endingDeployerBalance + gasCost,
          );
        });

        it("Allows us to withdraw with multiple funders", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            // i=0 is deployer
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingDeployerBalance,
            endingDeployerBalance + gasCost,
          );

          // Make sure the funders array and the mappings are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
          }
        });

        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1]; // accounts[0] is deployer
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(
            fundMe,
            "FundMe__NotOwner()",
          );
        });

        // Gas Efficient Withdraw
        it("efficientWithdraw - Allows us to withdraw with multiple funders", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            // i=0 is deployer
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.efficientWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingDeployerBalance,
            endingDeployerBalance + gasCost,
          );

          // Make sure the funders array and the mappings are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
          }
        });

        it("efficientWithdraw - Withdraw ETH from a single funder", async function () {
          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.efficientWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingDeployerBalance,
            endingDeployerBalance + gasCost,
          );
        });
      });
    });
