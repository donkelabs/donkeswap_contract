import hre, {ethers} from "hardhat";
import * as dotenv from "dotenv";
import {deployContract} from "./helpers/deployments";

dotenv.config();

async function main() {

    const [deployerSinger] = await ethers.getSigners();
    const networkName = hre.network.name;
    const signerAddress = await deployerSinger.getAddress();
    console.log("signerAddress:", signerAddress);
    const beforeBalance = await deployerSinger.provider.getBalance(signerAddress);
    console.log("BeforeBalance:", ethers.formatEther(beforeBalance.toString()).toString());
    let wrapToken = process.env.WRAP_TOKEN || '';
    if (wrapToken === '') {
        const argsArray = Object.values({});
        const warpTokenContract = await deployContract(networkName, "WETH9",
            argsArray, true);
        wrapToken = await warpTokenContract.getAddress();
    }


    const factory = await deployContract(networkName, "DonkeV2Factory", [signerAddress], true);
    const factoryAddress = await factory.getAddress();
    console.log("DonkeV2Factory deployed to:", factoryAddress);

    const router = await deployContract(networkName, "DonkeV2Router02", [factoryAddress, wrapToken], true);
    const routerAddress = await router.getAddress();
    console.log("DonkeV2Router02 deployed to:", routerAddress);

    const afterBalance = await deployerSinger.provider.getBalance(signerAddress);
    console.log("beforeBalance:", ethers.formatEther(beforeBalance.toString()).toString());
    console.log("afterBalance:", ethers.formatEther(afterBalance.toString()).toString());
    console.log("usedBalance:", ethers.formatEther((beforeBalance - afterBalance).toString()).toString());

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
