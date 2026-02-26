// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgenticVault} from "../src/AgenticVault.sol";

contract DeployAgenticVault is Script {
    function run() external returns (AgenticVault vault) {
        vm.startBroadcast();
        address deployer = msg.sender;

        console2.log("Deploying AgenticVault...");
        console2.log("Deployer / Owner:", deployer);
        console2.log("Chain ID:", block.chainid);

        vault = new AgenticVault(deployer);
        vm.stopBroadcast();

        console2.log("AgenticVault deployed at:", address(vault));
    }
}
