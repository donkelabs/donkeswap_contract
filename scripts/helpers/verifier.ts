import hre from "hardhat";

// https://blog.nomic.foundation/how-to-verify-your-deployment-on-etherscan-with-hardhat-ignition-5cbb7ee6c7be
export const verifyContracts = async (networkName: string, address: string, args: any[], verifyFlag?: boolean) => {
    if (networkName === "hardhat") {
        console.log("Skipping verification for hardhat network");
        return true;
    }
    if (verifyFlag) {
        console.log("Verifying contract:", address);
        await hre.run("verify:verify", {
            address,
            constructorArguments: args,
        });
        return true;
    } else {
        console.log("Skipping verification for contract:", address);
    }
    return false;

}