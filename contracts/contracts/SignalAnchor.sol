// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SignalAnchor
 * @notice Commit-reveal on-chain proof of AI decisions BEFORE execution.
 * @dev Emits benchmarking events compatible with the Mantle ERC-8004 specification.
 */
contract SignalAnchor {
    
    struct RevealedDecision {
        address agentId;
        bytes32 commitHash;
        uint8 signalType;
        uint256 confidence;
        string reasoning;
        string tradeIntent;
        uint256 timestamp;
    }

    // Maps commitHash to the address of the agent that committed it
    mapping(bytes32 => address) public pendingCommits;
    
    // Maps commitHash to its revealed decision details
    mapping(bytes32 => RevealedDecision) public revealedDecisions;
    
    // Array of all revealed commit hashes for enumeration
    bytes32[] public revealedCommits;

    // Events
    event Committed(
        address indexed agentId,
        bytes32 indexed commitHash,
        uint256 timestamp
    );

    event DecisionLogged(
        address indexed agentId,
        bytes32 commitHash,
        uint8 signalType,       // 0=depeg, 1=whaleExit, 2=accumulation, 3=divergence
        uint256 confidence,     // LLM score 0-100
        string reasoning,       // plaintext revealed rationale
        string tradeIntent,     // what action was taken
        uint256 timestamp
    );

    /**
     * @notice Commit a decision hash before execution.
     * @param commitHash keccak256(abi.encodePacked(reasoning, tradeIntent, nonce, signalType, confidence))
     */
    function commitDecision(bytes32 commitHash) external {
        require(pendingCommits[commitHash] == address(0), "Commit already exists");
        pendingCommits[commitHash] = msg.sender;
        emit Committed(msg.sender, commitHash, block.timestamp);
    }

    /**
     * @notice Reveal the decision details. Recomputes the hash and verifies it matches the commit.
     */
    function revealDecision(
        string memory reasoning,
        string memory tradeIntent,
        uint256 nonce,
        uint8 signalType,
        uint256 confidence
    ) external {
        bytes32 computedHash = keccak256(
            abi.encodePacked(reasoning, tradeIntent, nonce, signalType, confidence)
        );
        
        address committer = pendingCommits[computedHash];
        require(committer != address(0), "No matching commit found");
        require(revealedDecisions[computedHash].agentId == address(0), "Already revealed");

        // Save full record
        revealedDecisions[computedHash] = RevealedDecision({
            agentId: committer,
            commitHash: computedHash,
            signalType: signalType,
            confidence: confidence,
            reasoning: reasoning,
            tradeIntent: tradeIntent,
            timestamp: block.timestamp
        });

        revealedCommits.push(computedHash);

        // Emit ERC-8004 compatible benchmarking event
        emit DecisionLogged(
            committer,
            computedHash,
            signalType,
            confidence,
            reasoning,
            tradeIntent,
            block.timestamp
        );
    }

    /**
     * @notice Returns the total number of revealed decisions.
     */
    function getRevealedCount() external view returns (uint256) {
        return revealedCommits.length;
    }

    /**
     * @notice Get all revealed commits.
     */
    function getRevealedCommits() external view returns (bytes32[] memory) {
        return revealedCommits;
    }
}
