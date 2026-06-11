import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TradeLogger } from "../typechain-types";

describe("TradeLogger", function () {
  async function deployTradeLoggerFixture() {
    const [owner, executor, unauthorized] = await ethers.getSigners();

    const TradeLogger = await ethers.getContractFactory("TradeLogger");
    const tradeLogger = await TradeLogger.deploy();

    return { tradeLogger, owner, executor, unauthorized };
  }

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      const { tradeLogger, owner } = await loadFixture(
        deployTradeLoggerFixture
      );
      expect(await tradeLogger.owner()).to.equal(owner.address);
    });

    it("should initialize trade count to 0", async function () {
      const { tradeLogger } = await loadFixture(deployTradeLoggerFixture);
      expect(await tradeLogger.tradeCount()).to.equal(0);
    });
  });

  describe("logTrade", function () {
    it("should allow the owner to log a trade", async function () {
      const { tradeLogger, owner } = await loadFixture(
        deployTradeLoggerFixture
      );

      await expect(
        tradeLogger.logTrade("BTC/USDT", "BUY", 1000, 50000, "strategy-alpha")
      )
        .to.emit(tradeLogger, "TradeLogged")
        .withArgs(
          0,
          "BTC/USDT",
          "BUY",
          1000,
          50000,
          "strategy-alpha",
          owner.address,
          (value: any) => true // timestamp is dynamic
        );

      expect(await tradeLogger.tradeCount()).to.equal(1);
    });

    it("should allow an authorized executor to log a trade", async function () {
      const { tradeLogger, executor } = await loadFixture(
        deployTradeLoggerFixture
      );

      await tradeLogger.addExecutor(executor.address);

      await expect(
        tradeLogger
          .connect(executor)
          .logTrade("ETH/USDT", "SELL", 500, 3000, "strategy-beta")
      ).to.emit(tradeLogger, "TradeLogged");

      expect(await tradeLogger.tradeCount()).to.equal(1);
    });

    it("should revert when an unauthorized address tries to log a trade", async function () {
      const { tradeLogger, unauthorized } = await loadFixture(
        deployTradeLoggerFixture
      );

      await expect(
        tradeLogger
          .connect(unauthorized)
          .logTrade("BTC/USDT", "BUY", 1000, 50000, "strategy-alpha")
      )
        .to.be.revertedWithCustomError(tradeLogger, "UnauthorizedExecutor")
        .withArgs(unauthorized.address);
    });

    it("should correctly store trade data", async function () {
      const { tradeLogger } = await loadFixture(deployTradeLoggerFixture);

      await tradeLogger.logTrade(
        "BTC/USDT",
        "BUY",
        1000,
        50000,
        "strategy-alpha"
      );

      const trade = await tradeLogger.getTrade(0);
      expect(trade.asset).to.equal("BTC/USDT");
      expect(trade.direction).to.equal("BUY");
      expect(trade.size).to.equal(1000);
      expect(trade.price).to.equal(50000);
      expect(trade.strategyId).to.equal("strategy-alpha");
    });

    it("should increment trade count for multiple trades", async function () {
      const { tradeLogger } = await loadFixture(deployTradeLoggerFixture);

      await tradeLogger.logTrade(
        "BTC/USDT",
        "BUY",
        1000,
        50000,
        "strategy-alpha"
      );
      await tradeLogger.logTrade(
        "ETH/USDT",
        "SELL",
        500,
        3000,
        "strategy-beta"
      );
      await tradeLogger.logTrade(
        "SOL/USDT",
        "BUY",
        2000,
        100,
        "strategy-gamma"
      );

      expect(await tradeLogger.tradeCount()).to.equal(3);
    });
  });

  describe("getTrade", function () {
    it("should return the correct trade data", async function () {
      const { tradeLogger, owner } = await loadFixture(
        deployTradeLoggerFixture
      );

      await tradeLogger.logTrade(
        "BTC/USDT",
        "BUY",
        1000,
        50000,
        "strategy-alpha"
      );

      const trade = await tradeLogger.getTrade(0);
      expect(trade.asset).to.equal("BTC/USDT");
      expect(trade.direction).to.equal("BUY");
      expect(trade.size).to.equal(1000);
      expect(trade.price).to.equal(50000);
      expect(trade.strategyId).to.equal("strategy-alpha");
      expect(trade.executor).to.equal(owner.address);
      expect(trade.timestamp).to.be.greaterThan(0);
    });

    it("should revert for a non-existent trade ID", async function () {
      const { tradeLogger } = await loadFixture(deployTradeLoggerFixture);

      await expect(tradeLogger.getTrade(0))
        .to.be.revertedWithCustomError(tradeLogger, "TradeNotFound")
        .withArgs(0);
    });
  });

  describe("getTradeCount", function () {
    it("should return the correct trade count", async function () {
      const { tradeLogger } = await loadFixture(deployTradeLoggerFixture);

      expect(await tradeLogger.getTradeCount()).to.equal(0);

      await tradeLogger.logTrade(
        "BTC/USDT",
        "BUY",
        1000,
        50000,
        "strategy-alpha"
      );

      expect(await tradeLogger.getTradeCount()).to.equal(1);
    });
  });

  describe("Authorization", function () {
    it("should add an executor", async function () {
      const { tradeLogger, executor } = await loadFixture(
        deployTradeLoggerFixture
      );

      await expect(tradeLogger.addExecutor(executor.address))
        .to.emit(tradeLogger, "ExecutorAdded")
        .withArgs(executor.address);

      expect(await tradeLogger.authorizedExecutors(executor.address)).to.be
        .true;
    });

    it("should remove an executor", async function () {
      const { tradeLogger, executor } = await loadFixture(
        deployTradeLoggerFixture
      );

      await tradeLogger.addExecutor(executor.address);
      await expect(tradeLogger.removeExecutor(executor.address))
        .to.emit(tradeLogger, "ExecutorRemoved")
        .withArgs(executor.address);

      expect(await tradeLogger.authorizedExecutors(executor.address)).to.be
        .false;
    });

    it("should prevent non-owner from adding executors", async function () {
      const { tradeLogger, executor, unauthorized } = await loadFixture(
        deployTradeLoggerFixture
      );

      await expect(
        tradeLogger.connect(unauthorized).addExecutor(executor.address)
      ).to.be.revertedWithCustomError(tradeLogger, "OwnableUnauthorizedAccount");
    });

    it("should prevent non-owner from removing executors", async function () {
      const { tradeLogger, executor, unauthorized } = await loadFixture(
        deployTradeLoggerFixture
      );

      await tradeLogger.addExecutor(executor.address);

      await expect(
        tradeLogger.connect(unauthorized).removeExecutor(executor.address)
      ).to.be.revertedWithCustomError(tradeLogger, "OwnableUnauthorizedAccount");
    });

    it("should prevent a removed executor from logging trades", async function () {
      const { tradeLogger, executor } = await loadFixture(
        deployTradeLoggerFixture
      );

      await tradeLogger.addExecutor(executor.address);
      await tradeLogger.removeExecutor(executor.address);

      await expect(
        tradeLogger
          .connect(executor)
          .logTrade("BTC/USDT", "BUY", 1000, 50000, "strategy-alpha")
      )
        .to.be.revertedWithCustomError(tradeLogger, "UnauthorizedExecutor")
        .withArgs(executor.address);
    });
  });
});
