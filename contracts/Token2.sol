//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token2 is ERC20 {
    address public admin;
    // uint public amount;
    
    constructor(string memory tokenName, string memory tokenSymbol, uint amountToBePaid) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, amountToBePaid);
        admin = msg.sender;
    }
    
    function mint(address to, uint amount) external{
        require(msg.sender == admin, "Only admin");
        _mint(to, amount);
    }

    function burn(uint amount) external{
        _burn(msg.sender, amount);
    }
    
}