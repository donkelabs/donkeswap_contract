import {DeployContractOptions} from "@nomicfoundation/hardhat-ethers/types";
import {ethers} from "hardhat";
import {ethers as ethersJs} from "ethers";
import {verifyContracts} from "./verifier";
import {getContractDeployInfo, saveContractDeployInfo} from "./deployInfo";

export const deployContract = async (
    networkName: string,
    contractName: string,
    args: any[],
    verifyFlag?: boolean,
    deployName?: string,
    signerOrOptions?: ethersJs.Signer | DeployContractOptions) => {
    const _deployName = deployName || contractName;

    let contractDeployInfo = await getContractDeployInfo(networkName, _deployName);
    let contract;
    if (!ethers.isAddress(contractDeployInfo.address) || !ethers.isHexString(contractDeployInfo.deployHash)) {
        contract = await ethers.deployContract(contractName, args, signerOrOptions);
        const address = await contract.getAddress();
        const txHash = contract.deploymentTransaction()?.hash;
        contractDeployInfo.contractName = contractName;
        contractDeployInfo.address = address;
        contractDeployInfo.deployHash = txHash || '';
        console.log(`Contract ${contractName} deployed to ${address} with tx ${txHash}`);
    } else {
        contract = await ethers.getContractAt(contractName, contractDeployInfo.address);
        console.log(`Contract ${contractName} already deployed at address ${contractDeployInfo.address}`)
    }
    contractDeployInfo.verifyFlag = verifyFlag || false;

    if (contractDeployInfo.verifyFlag && !contractDeployInfo.execVerifyFlag) {
        try {
            await verifyContracts(networkName, contractDeployInfo.address, args, verifyFlag);
        } catch (e) {
            console.error(`Failed to verify contract ${contractName} with address ${contractDeployInfo.address}`, e);
        } finally {
            contractDeployInfo.execVerifyFlag = true;
        }
    } else {
        console.log(`Skipping verification for contract ${contractName} with address ${contractDeployInfo.address}`)
    }

    await saveContractDeployInfo(networkName, _deployName, contractDeployInfo);


    return contract;
}


