pragma solidity =0.5.16;

import "../DonkeV2ERC20.sol";

contract ERC20 is DonkeV2ERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
