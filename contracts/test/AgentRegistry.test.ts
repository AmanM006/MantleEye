import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { AgentRegistry } from "../typechain-types";

describe("AgentRegistry", function () {
  async function deployAgentRegistryFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();

    return { agentRegistry, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      const { agentRegistry, owner } = await loadFixture(
        deployAgentRegistryFixture
      );
      expect(await agentRegistry.owner()).to.equal(owner.address);
    });

    it("should have the correct name and symbol", async function () {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);
      expect(await agentRegistry.name()).to.equal("MANTLEYE Agent");
      expect(await agentRegistry.symbol()).to.equal("MEYE");
    });
  });

  describe("registerAgent", function () {
    it("should mint an agent NFT to the caller", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await expect(
        agentRegistry
          .connect(user1)
          .registerAgent("Alpha Agent", "ipfs://metadata/alpha")
      )
        .to.emit(agentRegistry, "AgentRegistered")
        .withArgs(0, user1.address, "Alpha Agent");

      expect(await agentRegistry.ownerOf(0)).to.equal(user1.address);
    });

    it("should set the correct token URI", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      expect(await agentRegistry.tokenURI(0)).to.equal(
        "ipfs://metadata/alpha"
      );
    });

    it("should initialize agent stats correctly", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      const stats = await agentRegistry.getAgentStats(0);
      expect(stats.totalTrades).to.equal(0);
      expect(stats.winCount).to.equal(0);
      expect(stats.lossCount).to.equal(0);
      expect(stats.totalPnL).to.equal(0);
      expect(stats.registeredAt).to.be.greaterThan(0);
    });

    it("should increment token IDs for multiple registrations", async function () {
      const { agentRegistry, user1, user2 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");
      await agentRegistry
        .connect(user2)
        .registerAgent("Beta Agent", "ipfs://metadata/beta");

      expect(await agentRegistry.ownerOf(0)).to.equal(user1.address);
      expect(await agentRegistry.ownerOf(1)).to.equal(user2.address);
    });

    it("should return the minted token ID", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      const tx = await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");
      const receipt = await tx.wait();

      // Check via event
      const event = receipt?.logs.find((log) => {
        try {
          return agentRegistry.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          })?.name === "AgentRegistered";
        } catch {
          return false;
        }
      });

      const parsed = agentRegistry.interface.parseLog({
        topics: [...event!.topics],
        data: event!.data,
      });
      expect(parsed?.args.tokenId).to.equal(0);
    });
  });

  describe("updateStats", function () {
    it("should update stats for a winning trade", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await expect(agentRegistry.updateStats(0, true, 500))
        .to.emit(agentRegistry, "AgentStatsUpdated")
        .withArgs(0, 1, 1, 0, 500);

      const stats = await agentRegistry.getAgentStats(0);
      expect(stats.totalTrades).to.equal(1);
      expect(stats.winCount).to.equal(1);
      expect(stats.lossCount).to.equal(0);
      expect(stats.totalPnL).to.equal(500);
    });

    it("should update stats for a losing trade", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await agentRegistry.updateStats(0, false, -200);

      const stats = await agentRegistry.getAgentStats(0);
      expect(stats.totalTrades).to.equal(1);
      expect(stats.winCount).to.equal(0);
      expect(stats.lossCount).to.equal(1);
      expect(stats.totalPnL).to.equal(-200);
    });

    it("should accumulate stats over multiple trades", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await agentRegistry.updateStats(0, true, 500);
      await agentRegistry.updateStats(0, true, 300);
      await agentRegistry.updateStats(0, false, -200);
      await agentRegistry.updateStats(0, true, 100);

      const stats = await agentRegistry.getAgentStats(0);
      expect(stats.totalTrades).to.equal(4);
      expect(stats.winCount).to.equal(3);
      expect(stats.lossCount).to.equal(1);
      expect(stats.totalPnL).to.equal(700); // 500 + 300 - 200 + 100
    });

    it("should revert for a non-existent agent", async function () {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);

      await expect(agentRegistry.updateStats(99, true, 500))
        .to.be.revertedWithCustomError(agentRegistry, "AgentNotFound")
        .withArgs(99);
    });

    it("should only allow the owner to update stats", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await expect(
        agentRegistry.connect(user1).updateStats(0, true, 500)
      ).to.be.revertedWithCustomError(
        agentRegistry,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("getAgentStats", function () {
    it("should return stats for a valid agent", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      const stats = await agentRegistry.getAgentStats(0);
      expect(stats.totalTrades).to.equal(0);
      expect(stats.registeredAt).to.be.greaterThan(0);
    });

    it("should revert for a non-existent agent", async function () {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);

      await expect(agentRegistry.getAgentStats(42))
        .to.be.revertedWithCustomError(agentRegistry, "AgentNotFound")
        .withArgs(42);
    });
  });

  describe("getWinRate", function () {
    it("should calculate correct win rate", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      // 3 wins, 1 loss = 75% win rate
      await agentRegistry.updateStats(0, true, 500);
      await agentRegistry.updateStats(0, true, 300);
      await agentRegistry.updateStats(0, true, 100);
      await agentRegistry.updateStats(0, false, -200);

      const winRate = await agentRegistry.getWinRate(0);
      expect(winRate).to.equal(7500); // 75.00%
    });

    it("should return 10000 for 100% win rate", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await agentRegistry.updateStats(0, true, 500);
      await agentRegistry.updateStats(0, true, 300);

      const winRate = await agentRegistry.getWinRate(0);
      expect(winRate).to.equal(10000); // 100.00%
    });

    it("should return 0 for 0% win rate", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await agentRegistry.updateStats(0, false, -500);
      await agentRegistry.updateStats(0, false, -300);

      const winRate = await agentRegistry.getWinRate(0);
      expect(winRate).to.equal(0); // 0.00%
    });

    it("should revert when no trades have been recorded", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      await expect(agentRegistry.getWinRate(0))
        .to.be.revertedWithCustomError(agentRegistry, "NoTradesRecorded")
        .withArgs(0);
    });

    it("should revert for a non-existent agent", async function () {
      const { agentRegistry } = await loadFixture(deployAgentRegistryFixture);

      await expect(agentRegistry.getWinRate(99))
        .to.be.revertedWithCustomError(agentRegistry, "AgentNotFound")
        .withArgs(99);
    });

    it("should handle precise win rate calculations", async function () {
      const { agentRegistry, user1 } = await loadFixture(
        deployAgentRegistryFixture
      );

      await agentRegistry
        .connect(user1)
        .registerAgent("Alpha Agent", "ipfs://metadata/alpha");

      // 1 win, 2 losses = 33.33% win rate → floors to 3333
      await agentRegistry.updateStats(0, true, 500);
      await agentRegistry.updateStats(0, false, -200);
      await agentRegistry.updateStats(0, false, -100);

      const winRate = await agentRegistry.getWinRate(0);
      expect(winRate).to.equal(3333); // 33.33% (integer division floors)
    });
  });
});
