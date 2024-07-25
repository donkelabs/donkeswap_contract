import hre, {ethers} from "hardhat";
import * as dotenv from "dotenv";
import {DonkeV2Router02, WETH9} from "../../typechain-types";
import {deployContract} from "../helpers/deployments";

dotenv.config();

async function main() {
    const [deployerSinger] = await ethers.getSigners();
    const networkName = hre.network.name;
    const signerAddress = await deployerSinger.getAddress();
    console.log("signerAddress:", signerAddress);
    const wrapToken = process.env.WRAP_TOKEN || "";
// sei testnet
    const tokenTotalSupply = ethers.parseEther("1000000000");
    const tokenAContract = await deployContract(networkName, "TestERC20", ["TokenA", "TKA", tokenTotalSupply], false, "TokenA");
    const tokenBContract = await deployContract(networkName, "TestERC20", ["TokenB", "TKB", tokenTotalSupply], false, "TokenB");
    const tokenDContract = await deployContract(networkName, "TestERC20", ["TokenD", "TKD", tokenTotalSupply], false, "TokenD");
    const tokenA = await tokenAContract.getAddress();
    const tokenB = await tokenBContract.getAddress();
    const tokenD = await tokenDContract.getAddress();

    // if(true){
    //     const recipient = "0x9a90b4E61eC19F74bCFDf02f3f32a11C8A1E54D6";
    //     await testTransferToken(tokenA, recipient, "1000000");
    //     await testTransferToken(tokenB, recipient, "1000000");
    //     await testTransferToken(tokenD, recipient, "1000000");
    //     return;
    // }
    const testFactoryContract = await deployContract(networkName, "DonkeV2Factory", [signerAddress], true);
    const testFactory = await testFactoryContract.getAddress();
    const testRouterContract = await deployContract(networkName, "DonkeV2Router02", [testFactory, wrapToken], true);
    const testRouter = await testRouterContract.getAddress();


    // swap 1 a-b
    await testSwapToken(testRouter, testFactory, tokenA, tokenB);

    // swap 1 a-D
    await testSwapToken(testRouter, testFactory, tokenA, tokenD);

    // swap 1 b-D
    await testSwapToken(testRouter, testFactory, tokenB, tokenD);

    // swap 2
    await testWrapNativeTokenSwap(wrapToken);
    await testNativeTokenSwap(testFactory, testRouter, tokenA, wrapToken);

    const factoryContract = await ethers.getContractAt(
        "DonkeV2Factory",
        testFactory
    );
    const pairLength = await factoryContract.allPairsLength();
    console.log("pairLength:", pairLength.toString());
    for (let i = 0; i < pairLength; i++) {
        const pairAddress = await factoryContract.allPairs(i);
        const pairContract = await ethers.getContractAt(
            "DonkeV2Pair",
            pairAddress
        );
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();
        console.info("token0:", token0);
        console.info("token1:", token1);
        console.log("pairAddress:", pairAddress);
    }
}

async function testTransferToken(tokenA: string, recipient: string, amount: string) {
    const tokenContract = await ethers.getContractAt("TestERC20", tokenA);
    const tokenDecimals = await tokenContract.decimals();
    await tokenContract.transfer(recipient, ethers.parseUnits(amount, tokenDecimals));
    const balance = await tokenContract.balanceOf(recipient);
    console.info("balance:", ethers.formatEther(balance.toString()).toString());
}

async function testNativeTokenSwap(
    factory: string,
    router: string,
    tokenA: string,
    wrapToken: string
) {
    console.log("=== testWrapSwap enter.");
    const [deployerSinger] = await ethers.getSigners();
    const signerAddress = await deployerSinger.getAddress();
    const routerContract = await ethers.getContractAt(
        "DonkeV2Router02",
        router
    );
    // add liquidityETH
    // approve tokenA
    await addLiquidityETH(tokenA, signerAddress, router, routerContract);

    const factoryContract = await ethers.getContractAt(
        "DonkeV2Factory",
        factory
    );
    const pairAddress = await factoryContract.getPair(tokenA, wrapToken);
    console.log("pairAddress:", pairAddress);
    const pairContract = await ethers.getContractAt("DonkeV2Pair", pairAddress);
    const balancePair = await pairContract.balanceOf(signerAddress);
    console.info(
        "balancePair:",
        ethers.formatEther(balancePair.toString()).toString()
    );

    // swap
    await swapNativeToken(router, tokenA, wrapToken, signerAddress, routerContract);
}

async function swapNativeToken(
    router: string,
    tokenA: string,
    wrapToken: string,
    signerAddress: string,
    routerContract: DonkeV2Router02
) {
    const amountIn = ethers.parseEther("0.01");
    // approve tokenA
    const tokenAContract = await ethers.getContractAt("ERC20", tokenA);
    const signerTokenABalance = await tokenAContract.balanceOf(signerAddress);
    console.log(
        "signerTokenABalance:",
        ethers.formatEther(signerTokenABalance.toString()).toString()
    );
    const allowance = await tokenAContract.allowance(signerAddress, router);
    console.log(
        "allowance:",
        ethers.formatEther(allowance.toString()).toString()
    );
    if (allowance < amountIn) {
        console.log("approve tokenA");
        const approveTx = await tokenAContract.approve(router, amountIn);
        const approveReceipt = await approveTx.wait();
        console.log("approveTokenAReceipt:", approveReceipt?.hash);
    }
    const amountOutMin = ethers.parseEther("0");
    const path = [tokenA, wrapToken];
    const to = signerAddress;
    const deadlineSwap = Math.floor(Date.now() / 1000) + 60 * 20;
    const swapTx = await routerContract
        .swapExactTokensForETH(amountIn, amountOutMin, path, to, deadlineSwap)
        .catch((error: any) => {
            console.error(error);
            process.exitCode = 1;
        });
    const swapReceipt = await swapTx?.wait();
    console.log("swapTx:", swapReceipt?.hash);
}

async function addLiquidityETH(
    tokenA: string,
    signerAddress: string,
    router: string,
    routerContract: DonkeV2Router02
) {
    const tokenAContract = await ethers.getContractAt("ERC20", tokenA);
    const signerTokenABalance = await tokenAContract.balanceOf(signerAddress);
    console.log(
        "signerTokenABalance:",
        ethers.formatEther(signerTokenABalance.toString()).toString()
    );
    const amountA = ethers.parseEther("100");
    const allowance = await tokenAContract.allowance(signerAddress, router);
    if (allowance < amountA) {
        console.log("addLiquidityETH - approve tokenA");
        const approveTx = await tokenAContract.approve(router, amountA);
        const approveReceipt = await approveTx.wait();
        console.log("approveTokenAReceipt:", approveReceipt?.hash);
    }
    // add liquidityEth
    const amountTokenADesired = ethers.parseEther("100");
    const amountTokenBDesired = ethers.parseEther("0.01");
    const amountTokenAMin = ethers.parseEther("0");
    const amountTokenBMin = ethers.parseEther("0");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const tx = await routerContract
        .addLiquidityETH(
            tokenA,
            amountTokenADesired,
            amountTokenAMin,
            amountTokenBMin,
            signerAddress,
            deadline,
            {value: amountTokenBDesired}
        )
        .catch((error: any) => {
            console.error("addLiquidityETH error: ", error);
            process.exitCode = 1;
        });
    const receipt = await tx?.wait();
    console.log("receipt:", receipt?.hash);
}

async function testWrapNativeTokenSwap(wrapToken: string) {
    const [deployerSinger] = await ethers.getSigners();

    const signerAddress = await deployerSinger.getAddress();

    const wrapNativeContract = await ethers.getContractAt("WETH9", wrapToken);
    await depositWrapNativeToken(wrapNativeContract, signerAddress);

    // withdraw
    await withdrawWrapNativeToken(signerAddress, wrapNativeContract);
}

async function withdrawWrapNativeToken(signerAddress: string, wrapNativeContract: WETH9) {
    // Native balance
    const singerNativeBalance = await ethers.provider.getBalance(signerAddress);
    console.log(
        "singerNativeBalance:",
        ethers.formatEther(singerNativeBalance.toString()).toString()
    );

    const signerWrapTokenBalance = await wrapNativeContract.balanceOf(signerAddress);
    console.log(
        "signerWrapNativeBalance:",
        ethers.formatEther(signerWrapTokenBalance.toString()).toString()
    );
    const amountOut = ethers.parseEther("0.01");

    const withdrawResponse = await wrapNativeContract.withdraw(amountOut);
    const withdrawReceipt = await withdrawResponse.wait();
    console.log("withdrawReceipt:", withdrawReceipt?.hash);
    const signerWrapTokenBalanceAfterWithdraw = await wrapNativeContract.balanceOf(
        signerAddress
    );
    console.log(
        "signerWrapNativeBalanceAfterWithdraw:",
        ethers.formatEther(signerWrapTokenBalanceAfterWithdraw.toString()).toString()
    );

    const singerNativeBalanceAfterWithdraw = await ethers.provider.getBalance(
        signerAddress
    );
    console.log(
        "singerNativeBalanceAfterWithdraw:",
        ethers.formatEther(singerNativeBalanceAfterWithdraw.toString()).toString()
    );
}

async function depositWrapNativeToken(wrapNativeContract: WETH9, signerAddress: string) {
    const signerWrapTokenBalance = await wrapNativeContract.balanceOf(signerAddress);
    console.log(
        "signerWrapNativeBalance:",
        ethers.formatEther(signerWrapTokenBalance.toString()).toString()
    );
    const amountIn = ethers.parseEther("0.01");

    const depositResponse = await wrapNativeContract.deposit({value: amountIn});
    const depositReceipt = await depositResponse.wait();
    console.log("depositReceipt:", depositReceipt?.hash);
    const signerWrapTokenBalanceAfterDeposit = await wrapNativeContract.balanceOf(
        signerAddress
    );
    console.log(
        "signerWrapNativeBalanceAfterDeposit:",
        ethers.formatEther(signerWrapTokenBalanceAfterDeposit.toString()).toString()
    );
}

async function testSwapToken(
    router: string,
    factory: string,
    tokenA: string,
    tokenB: string
) {
    console.log("=== testSwapToken enter.");

    const [deployerSinger] = await ethers.getSigners();

    const signerAddress = await deployerSinger.getAddress();

    // approve

    //check allowance
    await addTokenLiquidity(signerAddress, router, tokenB, tokenA);

    // swap
    await swapToken(tokenA, signerAddress, router, tokenB);

    // remove liquidity
    // get pair
    await removeLiquidity(factory, tokenA, tokenB, signerAddress, router);
}

async function createPair(factory: string, tokenA: string, tokenB: string) {
    const factoryContract = await ethers.getContractAt(
        "DonkeV2Factory",
        factory
    );
    const tx = await factoryContract.createPair(tokenA, tokenB);
    const receipt = await tx.wait();
    console.log("receipt:", receipt?.hash);
}

async function reDeployRouter(factoryAddress: string, wrapToken: string) {
    const router = await ethers.deployContract("DonkeV2Router02", [
        factoryAddress,
        wrapToken,
    ]);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("DonkeV2Router02 deployed to:", routerAddress);
    return routerAddress;
}

async function swapToken(
    tokenA: string,
    signerAddress: string,
    router: string,
    tokenB: string
) {
    console.log("=== swapToken enter. tokenA: {} / tokenB: {}", tokenA, tokenB);
    const routerContract = await ethers.getContractAt(
        "DonkeV2Router02",
        router
    );
    const amountIn = ethers.parseEther("1");
    // approve tokenA
    const tokenAContract = await ethers.getContractAt("ERC20", tokenA);
    const signerTokenABalance = await tokenAContract.balanceOf(signerAddress);
    console.log(
        "signerTokenABalance:",
        ethers.formatEther(signerTokenABalance.toString()).toString()
    );
    const allowance = await tokenAContract.allowance(signerAddress, router);
    console.log(
        "allowance:",
        ethers.formatEther(allowance.toString()).toString()
    );
    if (allowance < amountIn) {
        console.log("swapToken - approve tokenA");
        const approveTx = await tokenAContract.approve(router, amountIn);
        const approveReceipt = await approveTx.wait();
        console.log("approveTokenAReceipt:", approveReceipt?.hash);
    }
    const amountOutMin = ethers.parseEther("0");
    const path = [tokenA, tokenB];
    const to = signerAddress;
    const deadlineSwap = Math.floor(Date.now() / 1000) + 60 * 20;
    const swapTx = await routerContract
        .swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadlineSwap)
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
    const swapReceipt = await swapTx?.wait();
    console.log("swapToken tx: ", swapReceipt?.hash);
}

async function addTokenLiquidity(
    signerAddress: string,
    router: string,
    tokenB: string,
    tokenA: string
) {
    console.log(
        `=== addTokenLiquidity enter. tokenA: ${tokenA} / tokenB: ${tokenB}`
    );

    const routerContract = await ethers.getContractAt(
        "DonkeV2Router02",
        router
    );
    const tokenAContract = await ethers.getContractAt("ERC20", tokenA);
    const signerTokenABalance = await tokenAContract.balanceOf(signerAddress);
    console.log(
        "signerTokenABalance:",
        ethers.formatEther(signerTokenABalance.toString()).toString()
    );
    const amountA = ethers.parseEther("100");
    const allowance = await tokenAContract.allowance(signerAddress, router);

    console.log(
        "allowance:",
        ethers.formatEther(allowance.toString()).toString()
    );
    if (allowance < amountA) {
        console.log("addTokenLiquidity - approve tokenA");
        const approveTx = await tokenAContract.approve(router, amountA);
        const approveReceipt = await approveTx.wait();
        console.log("approveTokenAReceipt:", approveReceipt?.hash);
    }

    // approve tokenB
    const tokenContractB = await ethers.getContractAt("ERC20", tokenB);
    const signerTokenBBalance = await tokenContractB.balanceOf(signerAddress);
    console.log(
        "signerTokenBBalance:",
        ethers.formatEther(signerTokenBBalance.toString()).toString()
    );
    const amountB = ethers.parseEther("100");
    const allowanceB = await tokenContractB.allowance(signerAddress, router);
    console.log(
        "allowanceB:",
        ethers.formatEther(allowanceB.toString()).toString()
    );
    if (allowanceB < amountB) {
        console.log("addTokenLiquidity - approve tokenB");
        const approveTxB = await tokenContractB.approve(router, amountB);
        const approveReceiptB = await approveTxB.wait();
        console.log("approveReceiptB:", approveReceiptB?.hash);
    }

    // add liquidity
    const amountTokenADesired = ethers.parseEther("100");
    const amountTokenBDesired = ethers.parseEther("100");
    const amountTokenAMin = ethers.parseEther("0");
    const amountTokenBMin = ethers.parseEther("0");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const tx = await routerContract
        .addLiquidity(
            tokenA,
            tokenB,
            amountTokenADesired,
            amountTokenBDesired,
            amountTokenAMin,
            amountTokenBMin,
            signerAddress,
            deadline
        )
        .catch((error: any) => {
            console.error("addTokenLiquidity error: ", error);
            process.exitCode = 1;
        });

    const receipt = await tx?.wait();
    console.log("addTokenLiquidity receipt:", receipt?.hash);
}

async function removeLiquidity(
    factory: string,
    tokenA: string,
    tokenB: string,
    signerAddress: string,
    router: string
) {
    console.log(
        "=== removeLiquidity enter. tokenA: {} / tokenB: {}",
        tokenA,
        tokenB
    );
    const routerContract = await ethers.getContractAt(
        "DonkeV2Router02",
        router
    );
    const factoryContract = await ethers.getContractAt(
        "DonkeV2Factory",
        factory
    );
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    console.log("pairAddress:", pairAddress);
    const pairContract = await ethers.getContractAt("DonkeV2Pair", pairAddress);
    const balance = await pairContract.balanceOf(signerAddress);
    console.log("balance:", ethers.formatEther(balance.toString()).toString());
    const amount = ethers.parseEther("1");
    const amountAMin = ethers.parseEther("0");
    const amountBMin = ethers.parseEther("0");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    // approve pair for router
    const pairAllowance = await pairContract.allowance(signerAddress, router);
    console.log(
        "pairAllowance:",
        ethers.formatEther(pairAllowance.toString()).toString()
    );
    if (pairAllowance < amount) {
        console.log("removeLiquidity - approve pair");
        const approvePairTx = await pairContract.approve(router, amount);
        const approvePairReceipt = await approvePairTx.wait();
        console.log("approvePairReceipt:", approvePairReceipt?.hash);
    }
    const removeTx = await routerContract
        .removeLiquidity(
            tokenA,
            tokenB,
            amount,
            amountAMin,
            amountBMin,
            signerAddress,
            deadline
        )
        .catch((error: any) => {
            console.error(error);
            process.exitCode = 1;
        });

    const removeReceipt = await removeTx?.wait();
    console.log("removeLiquidity tx: ", removeReceipt?.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
