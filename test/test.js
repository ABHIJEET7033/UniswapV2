const { expect } = require("chai");
const { ethers } = require("hardhat");
const { describe, it } = require("mocha");
const { expandTo18Decimals } = require("./utilities/utilities");
describe("Uniswap Contracts", function () {
  let factory;
  let tokenA;
  let tokenB;
  let owner;
  let deployer;
  let pair;
  let Hash;
  let weth;
  let router;
  let temp;
  beforeEach(async function () {
    [owner, temp] = await ethers.getSigners();
    const TokenA = await ethers.getContractFactory("Token1");
    tokenA = await TokenA.deploy("Token1", "TK1", expandTo18Decimals(10000));
    const TokenB = await ethers.getContractFactory("Token2");
    tokenB = await TokenB.deploy("Token2", "TK2", expandTo18Decimals(10000));
    const WETH = await ethers.getContractFactory("WETHToken");
    weth = await WETH.deploy();
    const UniswapV2Factory = await ethers.getContractFactory(
      "UniswapV2Factory"
    );
    factory = await UniswapV2Factory.deploy(owner.address);
    const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
    pair = await uniswapv2pair.deploy();
    const UniswapV2Router = await ethers.getContractFactory(
      "UniswapV2Router02"
    );
    router = await UniswapV2Router.deploy(factory.target, weth.target);
  });
  describe("checking uniswap details", function () {
    it("tokenA name should be TokenA and symbol should be TKA", async function () {
      expect(await tokenA.name()).to.equal("Token1");
      expect(await tokenA.symbol()).to.equal("TK1");
    });
    it("tokenB name should be TokenB and symbol should be TKB", async function () {
      expect(await tokenB.name()).to.equal("Token2");
      expect(await tokenB.symbol()).to.equal("TK2");
    });
    it("get hash and add liquidity", async () => {
      const hash = await ethers.getContractFactory("CalHash");
      Hash = await hash.deploy();
      //console.log(await Hash.getInitHash());
    });
    it("should create pair in liquidity pool", async function () {
      const pairaddress = await factory.createPair(
        tokenA.target,
        tokenB.target
      );
      expect(await factory.getPair(tokenA.target, tokenB.target)).to.equal(
        await factory.allPairs(0)
      );
    });
    it("checking  addliquidity", async function () {
      const ad = router.target;
      await tokenA.approve(ad, expandTo18Decimals(5000));
      await tokenB.approve(ad, expandTo18Decimals(5000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(1000),
          expandTo18Decimals(1000),
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          owner.address,
          1696118399
        );
      const remainingBalance = await tokenB.balanceOf(owner.address);
      expect(remainingBalance).to.equal(expandTo18Decimals(9000));
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      const obj = await pairinstance.getReserves();
      expect(Number(obj._reserve0)).to.equal(Number(expandTo18Decimals(1000)));
      expect(Number(obj._reserve1)).to.equal(Number(expandTo18Decimals(1000)));
    });
    it("checking addLiquidityETH", async function () {
      await tokenA.approve(router.target, expandTo18Decimals(5000));
      await router
        .connect(owner)
        .addLiquidityETH(
          tokenA.target,
          expandTo18Decimals(1000),
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          owner.address,
          1696118399,
          { value: "1000" }
        );
      const Pair = await factory.getPair(tokenA.target, weth.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      const obj = await pairinstance.getReserves();
      expect(Number(obj._reserve0)).to.equal(Number(expandTo18Decimals(1000)));
      expect(Number(obj._reserve1)).to.equal(Number(1000));
    });
    it("Edge cases for addliquidity function ", async function () {
      await tokenA
        .connect(owner)
        .transfer(temp.address, expandTo18Decimals(100));
      await tokenB
        .connect(owner)
        .transfer(temp.address, expandTo18Decimals(100));
      await tokenA
        .connect(temp)
        .approve(router.target, expandTo18Decimals(1000));
      await tokenB
        .connect(temp)
        .approve(router.target, expandTo18Decimals(1000));
      await expect(
        router
          .connect(temp)
          .addLiquidity(
            tokenA.target,
            tokenB.target,
            expandTo18Decimals(910),
            expandTo18Decimals(90),
            expandTo18Decimals(10),
            expandTo18Decimals(10),
            temp.address,
            1696118399
          )
      ).revertedWith("TransferHelper::transferFrom: transferFrom failed");
    });
    it("Edge cases for addliquidityEth", async function () {
      await tokenA
        .connect(owner)
        .transfer(temp.address, expandTo18Decimals(100));
      await tokenA
        .connect(temp)
        .approve(router.target, expandTo18Decimals(1000));
      await expect(
        router
          .connect(temp)
          .addLiquidityETH(
            tokenA.target,
            expandTo18Decimals(190),
            expandTo18Decimals(10),
            expandTo18Decimals(10),
            temp.address,
            1696118399,
            { value: "125" }
          )
      ).revertedWith("TransferHelper::transferFrom: transferFrom failed");
    });

    it("checking  removeliquidity", async function () {
      const ad = router.target;
      await tokenA.approve(ad, expandTo18Decimals(5000));
      await tokenB.approve(ad, expandTo18Decimals(5000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(8),
          expandTo18Decimals(8),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      const liquidityToken = await pairinstance.balanceOf(owner.address);
      await pairinstance.connect(owner).approve(router.target, liquidityToken);
      await router
        .connect(owner)
        .removeLiquidity(
          tokenA.target,
          tokenB.target,
          liquidityToken,
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      let obj = await pairinstance.getReserves();
      let prevReserve_0 = Number(obj._reserve0);
      let prevReserve_1 = Number(obj._reserve1);
      console.log("resreveo before", prevReserve_0);
      console.log("reserve1 before", prevReserve_1);
      expect(await pairinstance.balanceOf(owner.address)).to.equal(0);
    });
    it("checking  removeliquidityEth", async function () {
      const ad = router.target;
      await tokenA.approve(ad, expandTo18Decimals(5000));
      await router
        .connect(owner)
        .addLiquidityETH(
          tokenA.target,
          expandTo18Decimals(1000),
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          owner.address,
          1696118399,
          { value: expandTo18Decimals(1000) }
        );
      const Pair = await factory.getPair(tokenA.target, weth.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      const liquidityToken = await pairinstance.balanceOf(owner.address);
      await pairinstance.connect(owner).approve(router.target, liquidityToken);
      await router
        .connect(owner)
        .removeLiquidityETH(
          tokenA.target,
          liquidityToken,
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          owner.address,
          1696118399
        );
      expect(await pairinstance.balanceOf(owner.address)).to.equal(0);
    });
    it("checking removeLiquidityWithPermit", async function () {
      const ad = router.target;
      await tokenA.approve(ad, expandTo18Decimals(5000));
      await tokenB.approve(ad, expandTo18Decimals(5000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(1000),
          expandTo18Decimals(1000),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      const liquidityToken = await pairinstance.balanceOf(owner.address);
      const signatureDigest = await owner.signTypedData(
        {
          name: await pairinstance.name(),
          version: "1",
          chainId: 0,
          verifyingContract: Pair,
        },
        {
          Permit: [
            {
              name: "owner",
              type: "address",
            },
            {
              name: "spender",
              type: "address",
            },
            {
              name: "value",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
        },
        {
          owner: owner.address,
          spender: router.target,
          value: liquidityToken,
          nonce: await pairinstance.nonces(owner.address),
          deadline: 1696118399,
        }
      );
      const splitsig = ethers.Signature.from(signatureDigest);
      await router
        .connect(owner)
        .removeLiquidityWithPermit(
          tokenA.target,
          tokenB.target,
          liquidityToken,
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399,
          false,
          splitsig.v,
          splitsig.r,
          splitsig.s
        );
      expect(await pairinstance.balanceOf(owner.address)).to.equal(0);
    });

    it("checking removeLiquidityETHWithPermit", async function () {
      const ad = router.target;
      await tokenA.approve(ad, expandTo18Decimals(5000));
      await router
        .connect(owner)
        .addLiquidityETH(
          tokenA.target,
          expandTo18Decimals(1000),
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          owner.address,
          1696118399,
          { value: expandTo18Decimals(1000) }
        );
      const Pair = await factory.getPair(tokenA.target, weth.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      const liquidityToken = await pairinstance.balanceOf(owner.address);
      await pairinstance.connect(owner).approve(router.target, liquidityToken);
      const signatureDigest = await owner.signTypedData(
        {
          name: await pairinstance.name(),
          version: "1",
          chainId: 0,
          verifyingContract: Pair,
        },
        {
          Permit: [
            {
              name: "owner",
              type: "address",
            },
            {
              name: "spender",
              type: "address",
            },
            {
              name: "value",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
        },
        {
          owner: owner.address,
          spender: router.target,
          value: liquidityToken,
          nonce: await pairinstance.nonces(owner.address),
          deadline: 1696118399,
        }
      );
      const splitsig = ethers.Signature.from(signatureDigest);
      await router
        .connect(owner)
        .removeLiquidityETHWithPermit(
          tokenA.target,
          liquidityToken,
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399,
          false,
          splitsig.v,
          splitsig.r,
          splitsig.s
        );
      expect(await pairinstance.balanceOf(owner.address)).to.equal(0);
    });

    it("checking swapExactTokensForTokens", async function () {
      let path = [tokenA.target, tokenB.target];
      await tokenA.approve(router.target, expandTo18Decimals(1000));
      await tokenB.approve(router.target, expandTo18Decimals(1000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      let obj = await pairinstance.getReserves();
      let prevReserve_0 = Number(obj._reserve0);
      let prevReserve_1 = Number(obj._reserve1);
      console.log("resreveo before", prevReserve_0);
      console.log("reserve1 before", prevReserve_1);
      await router
        .connect(owner)
        .swapExactTokensForTokens(
          expandTo18Decimals(2),
          expandTo18Decimals(1),
          path,
          owner.address,
          1696118399
        );
      obj = await pairinstance.getReserves();
      const aftReserve_0 = Number(obj._reserve0);
      const aftReserve_1 = Number(obj._reserve1);
      console.log("resreveo afetr", aftReserve_0);
      console.log("reserve1 after", aftReserve_1);
      expect(aftReserve_0).to.equal(Number(expandTo18Decimals(12)));
      expect(aftReserve_1).to.lessThanOrEqual(Number(expandTo18Decimals(8.34)));
    });

    it("checking swapTokensForExactTokens", async function () {
      let path = [tokenA.target, tokenB.target];
      await tokenA.approve(router.target, expandTo18Decimals(1000));
      await tokenB.approve(router.target, expandTo18Decimals(1000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      let obj = await pairinstance.getReserves();
      let prevReserve_0 = Number(obj._reserve0);
      let prevReserve_1 = Number(obj._reserve1);
      console.log("resreveo before", prevReserve_0);
      console.log("reserve1 before", prevReserve_1);
      await router
        .connect(owner)
        .swapTokensForExactTokens(
          expandTo18Decimals(2),
          expandTo18Decimals(3),
          path,
          owner.address,
          1696118399
        );
      obj = await pairinstance.getReserves();
      const aftReserve_0 = Number(obj._reserve0);
      const aftReserve_1 = Number(obj._reserve1);
      console.log("resreveo afetr", aftReserve_0);
      console.log("reserve1 after", aftReserve_1);
      let AmountIn = await router
        .connect(owner)
        .getAmountsIn(expandTo18Decimals(2), path);
      console.log("Amountout length", AmountIn);
      console.log("amountout is ", Number(AmountIn[0]));
      console.log("amountout is ", Number(AmountIn[1]));
      expect(prevReserve_0).to.be.lessThan(aftReserve_0);
      expect(aftReserve_1).to.equal(Number(expandTo18Decimals(8)));
    });

    it("checking swapExactTokensForTokensSupportingFeeOnTransferTokens", async function () {
      let path = [tokenA.target, tokenB.target];
      await tokenA.approve(router.target, expandTo18Decimals(1000));
      await tokenB.approve(router.target, expandTo18Decimals(1000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      let obj = await pairinstance.getReserves();
      let prevReserve_0 = Number(obj._reserve0);
      let prevReserve_1 = Number(obj._reserve1);
      console.log("resreveo before", prevReserve_0);
      console.log("reserve1 before", prevReserve_1);
      await router
        .connect(owner)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          expandTo18Decimals(2),
          expandTo18Decimals(1),
          path,
          temp.address,
          1696118399
        );
      obj = await pairinstance.getReserves();
      const aftReserve_0 = Number(obj._reserve0);
      const aftReserve_1 = Number(obj._reserve1);
      console.log("resreveo afetr", aftReserve_0);
      console.log("reserve1 after", aftReserve_1);
      expect(aftReserve_1).to.equal(Number(expandTo18Decimals(12)));
      expect(aftReserve_0).to.be.lessThan(prevReserve_0);
    });

    it("checking getAmountOut using swapExactTokensForTokens", async function () {
      let path = [tokenA.target, tokenB.target];
      await tokenA.approve(router.target, expandTo18Decimals(1000));
      await tokenB.approve(router.target, expandTo18Decimals(1000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      let amountout = await router
        .connect(owner)
        .getAmountsOut(expandTo18Decimals(2), path);
      console.log("amount out before swap is ", amountout);
      expect(await amountout[1]).to.be.lessThanOrEqual(
        expandTo18Decimals(1.67)
      );
      await router
        .connect(owner)
        .swapExactTokensForTokens(
          expandTo18Decimals(2),
          expandTo18Decimals(1),
          path,
          owner.address,
          1696118399
        );
      amountout = await router
        .connect(owner)
        .getAmountsOut(expandTo18Decimals(2), path);
      expect(await amountout[1]).to.be.lessThanOrEqual(
        expandTo18Decimals(1.19)
      );
    });

    it("checking getAmountIn using swapTokensForExactTokens", async function () {
      let path = [tokenA.target, tokenB.target];
      await tokenA.approve(router.target, expandTo18Decimals(1000));
      await tokenB.approve(router.target, expandTo18Decimals(1000));
      await router
        .connect(owner)
        .addLiquidity(
          tokenA.target,
          tokenB.target,
          expandTo18Decimals(10),
          expandTo18Decimals(10),
          expandTo18Decimals(1),
          expandTo18Decimals(1),
          owner.address,
          1696118399
        );
      const Pair = await factory.getPair(tokenA.target, tokenB.target);
      const uniswapv2pair = await ethers.getContractFactory("UniswapV2Pair");
      const pairinstance = uniswapv2pair.attach(Pair);
      let amountIn = await router
        .connect(owner)
        .getAmountsIn(expandTo18Decimals(2), path);
      console.log("amount In before swap is ", amountIn);
      expect(await amountIn[1]).to.be.lessThanOrEqual(expandTo18Decimals(2.51));
      await router
        .connect(owner)
        .swapTokensForExactTokens( 
          expandTo18Decimals(2),
          expandTo18Decimals(3),
          path,
          owner.address,
          1696118399
        );
      amountIn = await router
        .connect(owner)
        .getAmountsIn(expandTo18Decimals(2), path);
      expect(await amountIn[0]).to.be.lessThanOrEqual(expandTo18Decimals(4.19));
    });
    
    
  
  });
});



