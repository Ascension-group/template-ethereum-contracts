// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import {Contract} from "contracts/Contract.sol";

import "lib/forge-std/src/Test.sol";

contract TestContract is Test {
    address deployer;

    function setUp() public {
        deployer = vm.addr(69);
        vm.startPrank(deployer);
        vm.deal(deployer, 1000 ether);
    }
}
