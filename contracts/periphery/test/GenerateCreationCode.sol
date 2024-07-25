// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.5.0;

import "../../core/DonkeV2Pair.sol";

contract GenerateCreationCode {
    function generateDonkeV2PairCreationCode() public pure returns (bytes memory,bytes32) {
        bytes memory bytecode = type(DonkeV2Pair).creationCode;
        bytes32 salt = keccak256(bytecode);
        return (bytecode,salt);
    }
}
