const { ethers } = require("hardhat");
const {BigNumber}=require("ethers");

function expandTo18Decimals(n) {
     return  ethers.parseUnits(n.toString(),18);
  }

module.exports= { expandTo18Decimals} ;