// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TradeLogger
 * @notice Immutable on-chain record of every trade with risk management checks.
 */
contract TradeLogger is Ownable {
    
    struct TradeRecord {
        uint256 tradeId;
        uint8 tradeType;        // 0=buy, 1=sell, 2=hedge
        address asset;
        uint256 amount;         // position size in USD equivalent (18 decimals)
        uint256 price;          // asset price
        string signalRef;       // txhash or commitHash reference from SignalAnchor
        string venue;           // "MerchantMoe" or "Bybit"
        uint256 timestamp;
        address executor;
    }

    uint256 public maxPositionSizeUSD = 1000e18; // 1000 USD equivalent (18 decimals)
    bool public emergencyStop = false;
    uint256 public tradeCount = 0;

    mapping(uint256 => TradeRecord) public trades;
    mapping(address => bool) public authorizedAgents;

    // Events
    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed agent,
        uint8 tradeType,
        address asset,
        uint256 amount,
        uint256 price,
        string signalRef,
        string venue,
        uint256 timestamp
    );

    event EmergencyStopToggled(bool stopped);
    event MaxPositionSizeChanged(uint256 newLimit);
    event AgentStatusUpdated(address indexed agent, bool status);

    constructor() Ownable(msg.sender) {
        authorizedAgents[msg.sender] = true;
    }

    // Modifiers
    modifier onlyAgent() {
        require(authorizedAgents[msg.sender] || msg.sender == owner(), "Caller is not an authorized agent");
        _;
    }

    modifier notStopped() {
        require(!emergencyStop, "Circuit breaker active");
        _;
    }

    modifier withinPositionLimit(uint256 amount) {
        require(amount <= maxPositionSizeUSD, "Exceeds max position");
        _;
    }

    /**
     * @notice Log an executed trade with on-chain risk checks.
     */
    function logTrade(
        uint8 tradeType,
        address asset,
        uint256 amount,
        uint256 price,
        string calldata signalRef,
        string calldata venue
    ) external onlyAgent notStopped withinPositionLimit(amount) {
        uint256 tradeId = tradeCount;

        trades[tradeId] = TradeRecord({
            tradeId: tradeId,
            tradeType: tradeType,
            asset: asset,
            amount: amount,
            price: price,
            signalRef: signalRef,
            venue: venue,
            timestamp: block.timestamp,
            executor: msg.sender
        });

        emit TradeExecuted(
            tradeId,
            msg.sender,
            tradeType,
            asset,
            amount,
            price,
            signalRef,
            venue,
            block.timestamp
        );

        tradeCount++;
    }

    /**
     * @notice Toggle emergency circuit breaker.
     */
    function setEmergencyStop(bool _stop) external onlyOwner {
        emergencyStop = _stop;
        emit EmergencyStopToggled(_stop);
    }

    /**
     * @notice Set the maximum position size limit in USD (18 decimals).
     */
    function setMaxPositionSize(uint256 _max) external onlyOwner {
        maxPositionSizeUSD = _max;
        emit MaxPositionSizeChanged(_max);
    }

    /**
     * @notice Set status of authorized agents.
     */
    function setAgentStatus(address agent, bool status) external onlyOwner {
        authorizedAgents[agent] = status;
        emit AgentStatusUpdated(agent, status);
    }

    /**
     * @notice Get trade record by ID.
     */
    function getTrade(uint256 tradeId) external view returns (TradeRecord memory) {
        require(tradeId < tradeCount, "Trade record not found");
        return trades[tradeId];
    }
}
