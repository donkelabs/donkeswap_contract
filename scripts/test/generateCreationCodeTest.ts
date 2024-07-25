import {ethers} from "hardhat";

async function main() {
    const [deployerSinger] = await ethers.getSigners();
    const signerAddress = await deployerSinger.getAddress();
    const contract = await ethers.deployContract("GenerateCreationCode", []);
    const pairCode = await contract.generateDonkeV2PairCreationCode();

    console.log(pairCode[1]);
    // 0xf08adbd9a095248fdfe94e13abc6410378938d840a4c78668dd747093356116e
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
