import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignalAnchor } from "../typechain-types";

describe("SignalAnchor", function () {
  async function deploySignalAnchorFixture() {
    const [generator1, generator2, verifier] = await ethers.getSigners();

    const SignalAnchor = await ethers.getContractFactory("SignalAnchor");
    const signalAnchor = await SignalAnchor.deploy();

    // Create a sample signal hash
    const sampleData = ethers.toUtf8Bytes(
      '{"asset":"BTC","direction":"BUY","confidence":0.95}'
    );
    const sampleHash = ethers.keccak256(sampleData);

    return {
      signalAnchor,
      generator1,
      generator2,
      verifier,
      sampleHash,
    };
  }

  describe("Deployment", function () {
    it("should initialize signal count to 0", async function () {
      const { signalAnchor } = await loadFixture(deploySignalAnchorFixture);
      expect(await signalAnchor.signalCount()).to.equal(0);
    });
  });

  describe("anchorSignal", function () {
    it("should allow anyone to anchor a signal", async function () {
      const { signalAnchor, generator1, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      await expect(
        signalAnchor
          .connect(generator1)
          .anchorSignal(sampleHash, "SMART_MONEY")
      )
        .to.emit(signalAnchor, "SignalAnchored")
        .withArgs(
          0,
          sampleHash,
          "SMART_MONEY",
          generator1.address,
          (value: any) => true // timestamp is dynamic
        );

      expect(await signalAnchor.signalCount()).to.equal(1);
    });

    it("should correctly store signal data", async function () {
      const { signalAnchor, generator1, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "ANOMALY");

      const signal = await signalAnchor.getSignal(0);
      expect(signal.signalHash).to.equal(sampleHash);
      expect(signal.generator).to.equal(generator1.address);
      expect(signal.signalType).to.equal("ANOMALY");
      expect(signal.timestamp).to.be.greaterThan(0);
    });

    it("should increment signal count for multiple signals", async function () {
      const { signalAnchor, generator1, generator2, sampleHash } =
        await loadFixture(deploySignalAnchorFixture);

      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("signal-2"));
      const hash3 = ethers.keccak256(ethers.toUtf8Bytes("signal-3"));

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");
      await signalAnchor
        .connect(generator2)
        .anchorSignal(hash2, "MOMENTUM");
      await signalAnchor
        .connect(generator1)
        .anchorSignal(hash3, "ANOMALY");

      expect(await signalAnchor.signalCount()).to.equal(3);
    });
  });

  describe("verifySignal", function () {
    it("should return true for a matching hash", async function () {
      const { signalAnchor, generator1, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");

      expect(await signalAnchor.verifySignal(0, sampleHash)).to.be.true;
    });

    it("should return false for a non-matching hash", async function () {
      const { signalAnchor, generator1, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");

      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-data"));
      expect(await signalAnchor.verifySignal(0, wrongHash)).to.be.false;
    });

    it("should revert for a non-existent signal ID", async function () {
      const { signalAnchor, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      await expect(signalAnchor.verifySignal(0, sampleHash))
        .to.be.revertedWithCustomError(signalAnchor, "SignalNotFound")
        .withArgs(0);
    });

    it("should allow a third party to verify a signal", async function () {
      const { signalAnchor, generator1, verifier, sampleHash } =
        await loadFixture(deploySignalAnchorFixture);

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");

      expect(
        await signalAnchor.connect(verifier).verifySignal(0, sampleHash)
      ).to.be.true;
    });
  });

  describe("getSignal", function () {
    it("should return the correct signal data", async function () {
      const { signalAnchor, generator1, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");

      const signal = await signalAnchor.getSignal(0);
      expect(signal.signalHash).to.equal(sampleHash);
      expect(signal.generator).to.equal(generator1.address);
      expect(signal.signalType).to.equal("SMART_MONEY");
    });

    it("should revert for a non-existent signal ID", async function () {
      const { signalAnchor } = await loadFixture(deploySignalAnchorFixture);

      await expect(signalAnchor.getSignal(99))
        .to.be.revertedWithCustomError(signalAnchor, "SignalNotFound")
        .withArgs(99);
    });
  });

  describe("getSignalsByGenerator", function () {
    it("should return signal IDs for a generator", async function () {
      const { signalAnchor, generator1, sampleHash } = await loadFixture(
        deploySignalAnchorFixture
      );

      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("signal-2"));

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");
      await signalAnchor
        .connect(generator1)
        .anchorSignal(hash2, "ANOMALY");

      const signalIds = await signalAnchor.getSignalsByGenerator(
        generator1.address
      );
      expect(signalIds).to.have.lengthOf(2);
      expect(signalIds[0]).to.equal(0);
      expect(signalIds[1]).to.equal(1);
    });

    it("should return empty array for a generator with no signals", async function () {
      const { signalAnchor, generator2 } = await loadFixture(
        deploySignalAnchorFixture
      );

      const signalIds = await signalAnchor.getSignalsByGenerator(
        generator2.address
      );
      expect(signalIds).to.have.lengthOf(0);
    });

    it("should only return signals for the specified generator", async function () {
      const { signalAnchor, generator1, generator2, sampleHash } =
        await loadFixture(deploySignalAnchorFixture);

      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("signal-2"));

      await signalAnchor
        .connect(generator1)
        .anchorSignal(sampleHash, "SMART_MONEY");
      await signalAnchor
        .connect(generator2)
        .anchorSignal(hash2, "MOMENTUM");

      const gen1Signals = await signalAnchor.getSignalsByGenerator(
        generator1.address
      );
      const gen2Signals = await signalAnchor.getSignalsByGenerator(
        generator2.address
      );

      expect(gen1Signals).to.have.lengthOf(1);
      expect(gen2Signals).to.have.lengthOf(1);
      expect(gen1Signals[0]).to.equal(0);
      expect(gen2Signals[0]).to.equal(1);
    });
  });
});
