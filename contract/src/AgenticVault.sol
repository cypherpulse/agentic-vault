// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error NotVaultOwner();
error VaultNotActive();
error AgentNotAssigned();
error ZeroAddress();
error InsufficientBalance();
error ExecutionFailed();
error Unauthorized();

contract AgenticVault is Ownable, Pausable, ReentrancyGuard {
    struct Vault {
        uint256 balance;
        address agent;
        bool active;
    }

    mapping(address => Vault) private vaults;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event AgentAssigned(address indexed user, address agent);
    event AgentRevoked(address indexed user);
    event AgentExecuted(address indexed user, address agent, address target, uint256 value);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyVaultOwner(address user) {
        if (msg.sender != user) revert NotVaultOwner();
        _;
    }

    modifier vaultActive(address user) {
        if (!vaults[user].active) revert VaultNotActive();
        _;
    }

    modifier onlyAssignedAgent(address user) {
        if (vaults[user].agent == address(0)) revert AgentNotAssigned();
        if (msg.sender != vaults[user].agent) revert Unauthorized();
        _;
    }

    function deposit() external payable whenNotPaused {
        if (msg.value == 0) revert InsufficientBalance();
        Vault storage v = vaults[msg.sender];
        v.balance += msg.value;
        v.active = true;
        emit Deposited(msg.sender, msg.value);
    }

    function assignAgent(address agent) external whenNotPaused {
        if (agent == address(0)) revert ZeroAddress();
        vaults[msg.sender].agent = agent;
        emit AgentAssigned(msg.sender, agent);
    }

    function revokeAgent() external {
        vaults[msg.sender].agent = address(0);
        emit AgentRevoked(msg.sender);
    }

    function executeAsAgent(
        address user,
        address target,
        uint256 value,
        bytes calldata data
    )
        external
        whenNotPaused
        nonReentrant
        vaultActive(user)
        onlyAssignedAgent(user)
    {
        Vault storage v = vaults[user];
        if (value > v.balance) revert InsufficientBalance();
        if (target == address(0)) revert ZeroAddress();

        v.balance -= value;

        (bool success,) = target.call{value: value}(data);
        if (!success) revert ExecutionFailed();

        emit AgentExecuted(user, msg.sender, target, value);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused vaultActive(msg.sender) {
        Vault storage v = vaults[msg.sender];
        if (amount == 0 || amount > v.balance) revert InsufficientBalance();

        v.balance -= amount;

        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert ExecutionFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InsufficientBalance();

        (bool success,) = owner().call{value: balance}("");
        if (!success) revert ExecutionFailed();

        emit EmergencyWithdraw(owner(), balance);
    }

    function getVault(address user) external view returns (uint256 balance, address agent, bool active) {
        Vault storage v = vaults[user];
        return (v.balance, v.agent, v.active);
    }

    receive() external payable {
        Vault storage v = vaults[msg.sender];
        v.balance += msg.value;
        v.active = true;
        emit Deposited(msg.sender, msg.value);
    }

    fallback() external payable {
        revert ExecutionFailed();
    }
}
