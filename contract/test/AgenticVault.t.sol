// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AgenticVault} from "../src/AgenticVault.sol";

// ─────────────────────────────────────────────
// Helper: receives ETH, can reject it
// ─────────────────────────────────────────────
contract MockReceiver {
    bool public shouldRevert;

    function setShouldRevert(bool _revert) external {
        shouldRevert = _revert;
    }

    receive() external payable {
        if (shouldRevert) revert("MockReceiver: rejected");
    }
}

// ─────────────────────────────────────────────
// Helper: malicious reentrancy attacker
// ─────────────────────────────────────────────
contract ReentrancyAttacker {
    AgenticVault public vault;
    uint256 public attackCount;

    constructor(address _vault) {
        vault = AgenticVault(payable(_vault));
    }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw(msg.value);
    }

    receive() external payable {
        if (attackCount < 3 && address(vault).balance >= 1 ether) {
            attackCount++;
            vault.withdraw(1 ether);
        }
    }
}

// ─────────────────────────────────────────────
// Main Test Suite
// ─────────────────────────────────────────────
contract AgenticVaultTest is Test {
    AgenticVault public vaultContract;

    address public owner;
    address public alice;
    address public bob;
    address public agent;

    uint256 constant ONE_ETH = 1 ether;
    uint256 constant HALF_ETH = 0.5 ether;

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        agent = makeAddr("agent");

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(agent, 1 ether);

        vm.prank(owner);
        vaultContract = new AgenticVault(owner);
    }

    // ─────────────────────────────────────────
    // Deposit
    // ─────────────────────────────────────────
    function test_Deposit_Success() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit AgenticVault.Deposited(alice, ONE_ETH);
        vaultContract.deposit{value: ONE_ETH}();

        (uint256 balance, , bool active) = vaultContract.getVault(alice);
        assertEq(balance, ONE_ETH);
        assertTrue(active);
    }

    function test_Deposit_ZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("InsufficientBalance()"));
        vaultContract.deposit{value: 0}();
    }

    function test_Deposit_MultipleAccumulates() public {
        vm.startPrank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vaultContract.deposit{value: HALF_ETH}();
        vm.stopPrank();

        (uint256 balance,,) = vaultContract.getVault(alice);
        assertEq(balance, ONE_ETH + HALF_ETH);
    }

    function test_Deposit_ViaReceive() public {
        vm.prank(alice);
        (bool ok,) = address(vaultContract).call{value: ONE_ETH}("");
        assertTrue(ok);
        (uint256 balance,,) = vaultContract.getVault(alice);
        assertEq(balance, ONE_ETH);
    }

    function test_Deposit_PausedReverts() public {
        vm.prank(owner);
        vaultContract.pause();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vaultContract.deposit{value: ONE_ETH}();
    }

    // ─────────────────────────────────────────
    // Assign / Revoke Agent
    // ─────────────────────────────────────────
    function test_AssignAgent_Success() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit AgenticVault.AgentAssigned(alice, agent);
        vaultContract.assignAgent(agent);

        (, address storedAgent,) = vaultContract.getVault(alice);
        assertEq(storedAgent, agent);
    }

    function test_AssignAgent_ZeroAddressReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddress()"));
        vaultContract.assignAgent(address(0));
    }

    function test_AssignAgent_PausedReverts() public {
        vm.prank(owner);
        vaultContract.pause();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vaultContract.assignAgent(agent);
    }

    function test_RevokeAgent_Success() public {
        vm.startPrank(alice);
        vaultContract.assignAgent(agent);

        vm.expectEmit(true, false, false, false);
        emit AgenticVault.AgentRevoked(alice);
        vaultContract.revokeAgent();
        vm.stopPrank();

        (, address storedAgent,) = vaultContract.getVault(alice);
        assertEq(storedAgent, address(0));
    }

    function test_RevokeAgent_WorksWhenPaused() public {
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(owner);
        vaultContract.pause();

        vm.prank(alice);
        vaultContract.revokeAgent(); // should succeed even paused
        (, address storedAgent,) = vaultContract.getVault(alice);
        assertEq(storedAgent, address(0));
    }

    // ─────────────────────────────────────────
    // Withdraw
    // ─────────────────────────────────────────
    function test_Withdraw_Success() public {
        vm.startPrank(alice);
        vaultContract.deposit{value: ONE_ETH}();

        uint256 balanceBefore = alice.balance;
        vm.expectEmit(true, false, false, true);
        emit AgenticVault.Withdrawn(alice, ONE_ETH);
        vaultContract.withdraw(ONE_ETH);
        vm.stopPrank();

        assertEq(alice.balance, balanceBefore + ONE_ETH);
        (uint256 vaultBalance,,) = vaultContract.getVault(alice);
        assertEq(vaultBalance, 0);
    }

    function test_Withdraw_PartialAmount() public {
        vm.startPrank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vaultContract.withdraw(HALF_ETH);
        vm.stopPrank();

        (uint256 vaultBalance,,) = vaultContract.getVault(alice);
        assertEq(vaultBalance, HALF_ETH);
    }

    function test_Withdraw_ZeroReverts() public {
        vm.startPrank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.expectRevert(abi.encodeWithSignature("InsufficientBalance()"));
        vaultContract.withdraw(0);
        vm.stopPrank();
    }

    function test_Withdraw_ExcessReverts() public {
        vm.startPrank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.expectRevert(abi.encodeWithSignature("InsufficientBalance()"));
        vaultContract.withdraw(2 ether);
        vm.stopPrank();
    }

    function test_Withdraw_VaultNotActiveReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("VaultNotActive()"));
        vaultContract.withdraw(ONE_ETH);
    }

    function test_Withdraw_PausedReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();

        vm.prank(owner);
        vaultContract.pause();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vaultContract.withdraw(ONE_ETH);
    }

    function test_Withdraw_Isolation() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();

        vm.prank(bob);
        vaultContract.deposit{value: 2 ether}();

        // Alice withdraws only her balance
        vm.prank(alice);
        vaultContract.withdraw(ONE_ETH);

        (uint256 bobBalance,,) = vaultContract.getVault(bob);
        assertEq(bobBalance, 2 ether);
    }

    // ─────────────────────────────────────────
    // Agent Execution
    // ─────────────────────────────────────────
    function test_ExecuteAsAgent_Success() public {
        MockReceiver receiver = new MockReceiver();

        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(agent);
        vm.expectEmit(true, true, true, true);
        emit AgenticVault.AgentExecuted(alice, agent, address(receiver), HALF_ETH);
        vaultContract.executeAsAgent(alice, address(receiver), HALF_ETH, "");

        assertEq(address(receiver).balance, HALF_ETH);
        (uint256 vaultBalance,,) = vaultContract.getVault(alice);
        assertEq(vaultBalance, HALF_ETH);
    }

    function test_ExecuteAsAgent_NotAgentReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("Unauthorized()"));
        vaultContract.executeAsAgent(alice, bob, HALF_ETH, "");
    }

    function test_ExecuteAsAgent_NoAgentAssignedReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("AgentNotAssigned()"));
        vaultContract.executeAsAgent(alice, agent, HALF_ETH, "");
    }

    function test_ExecuteAsAgent_VaultNotActiveReverts() public {
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("VaultNotActive()"));
        vaultContract.executeAsAgent(alice, agent, 0, "");
    }

    function test_ExecuteAsAgent_InsufficientBalanceReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("InsufficientBalance()"));
        vaultContract.executeAsAgent(alice, agent, 2 ether, "");
    }

    function test_ExecuteAsAgent_ZeroTargetReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddress()"));
        vaultContract.executeAsAgent(alice, address(0), 0, "");
    }

    function test_ExecuteAsAgent_FailedCallReverts() public {
        MockReceiver receiver = new MockReceiver();
        receiver.setShouldRevert(true);

        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("ExecutionFailed()"));
        vaultContract.executeAsAgent(alice, address(receiver), HALF_ETH, "");

        // Balance must be restored (revert unwinds)
        (uint256 vaultBalance,,) = vaultContract.getVault(alice);
        assertEq(vaultBalance, ONE_ETH);
    }

    function test_ExecuteAsAgent_AfterRevokeReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);
        vm.prank(alice);
        vaultContract.revokeAgent();

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("AgentNotAssigned()"));
        vaultContract.executeAsAgent(alice, agent, 0, "");
    }

    function test_ExecuteAsAgent_PausedReverts() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        vm.prank(alice);
        vaultContract.assignAgent(agent);

        vm.prank(owner);
        vaultContract.pause();

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vaultContract.executeAsAgent(alice, agent, 0, "");
    }

    // ─────────────────────────────────────────
    // Pause / Unpause
    // ─────────────────────────────────────────
    function test_Pause_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        vaultContract.pause();
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(owner);
        vaultContract.pause();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        vaultContract.unpause();
    }

    function test_PauseUnpause_Cycle() public {
        vm.prank(owner);
        vaultContract.pause();
        assertTrue(vaultContract.paused());

        vm.prank(owner);
        vaultContract.unpause();
        assertFalse(vaultContract.paused());

        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();
        (uint256 bal,,) = vaultContract.getVault(alice);
        assertEq(bal, ONE_ETH);
    }

    // ─────────────────────────────────────────
    // Emergency Withdraw
    // ─────────────────────────────────────────
    function test_EmergencyWithdraw_Success() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();

        uint256 ownerBefore = owner.balance;

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit AgenticVault.EmergencyWithdraw(owner, ONE_ETH);
        vaultContract.emergencyWithdraw();

        assertEq(owner.balance, ownerBefore + ONE_ETH);
        assertEq(address(vaultContract).balance, 0);
    }

    function test_EmergencyWithdraw_ZeroBalanceReverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("InsufficientBalance()"));
        vaultContract.emergencyWithdraw();
    }

    function test_EmergencyWithdraw_OnlyOwner() public {
        vm.prank(alice);
        vaultContract.deposit{value: ONE_ETH}();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        vaultContract.emergencyWithdraw();
    }

    // ─────────────────────────────────────────
    // Reentrancy
    // ─────────────────────────────────────────
    function test_Reentrancy_WithdrawProtected() public {
        ReentrancyAttacker attacker = new ReentrancyAttacker(address(vaultContract));
        vm.deal(address(attacker), 2 ether);

        // Attacker tries to drain via reentrancy
        vm.expectRevert();
        attacker.attack{value: 1 ether}();

        // Contract should still have its ETH
        assertGe(address(vaultContract).balance, 0);
    }

    // ─────────────────────────────────────────
    // Fallback
    // ─────────────────────────────────────────
    function test_Fallback_RevertsWithData() public {
        vm.prank(alice);
        (bool ok,) = address(vaultContract).call{value: 0}(hex"deadbeef");
        assertFalse(ok);
    }

    // ─────────────────────────────────────────
    // View
    // ─────────────────────────────────────────
    function test_GetVault_DefaultValues() public view {
        (uint256 balance, address storedAgent, bool active) = vaultContract.getVault(alice);
        assertEq(balance, 0);
        assertEq(storedAgent, address(0));
        assertFalse(active);
    }

    // ─────────────────────────────────────────
    // Fuzz Tests
    // ─────────────────────────────────────────
    function testFuzz_Deposit(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(alice, amount);
        vm.prank(alice);
        vaultContract.deposit{value: amount}();
        (uint256 balance,,) = vaultContract.getVault(alice);
        assertEq(balance, amount);
    }

    function testFuzz_WithdrawPartial(uint256 depositAmount, uint256 withdrawAmount) public {
        depositAmount = bound(depositAmount, 1, 100 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount);

        vm.deal(alice, depositAmount);
        vm.startPrank(alice);
        vaultContract.deposit{value: depositAmount}();
        vaultContract.withdraw(withdrawAmount);
        vm.stopPrank();

        (uint256 balance,,) = vaultContract.getVault(alice);
        assertEq(balance, depositAmount - withdrawAmount);
    }

    function testFuzz_VaultIsolation(uint256 aliceAmount, uint256 bobAmount) public {
        aliceAmount = bound(aliceAmount, 1, 50 ether);
        bobAmount = bound(bobAmount, 1, 50 ether);

        vm.deal(alice, aliceAmount);
        vm.deal(bob, bobAmount);

        vm.prank(alice);
        vaultContract.deposit{value: aliceAmount}();

        vm.prank(bob);
        vaultContract.deposit{value: bobAmount}();

        (uint256 aliceBal,,) = vaultContract.getVault(alice);
        (uint256 bobBal,,) = vaultContract.getVault(bob);

        assertEq(aliceBal, aliceAmount);
        assertEq(bobBal, bobAmount);
    }
}
