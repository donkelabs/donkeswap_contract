import fs from 'fs';
import path from 'path';

const DEPLOY_INFO_DIRECTORY = path.join(__dirname, '../deploy-info');

export interface IContractDeployInfo {
    contractName: string,
    address: string,
    deployHash: string
    verifyFlag: boolean,
    execVerifyFlag?: boolean
}

const defaultDeployContractInfo: IContractDeployInfo = {
    contractName: '',
    address: '',
    deployHash: '',
    verifyFlag: false,
    execVerifyFlag: false
}
export const getContractDeployInfo = async (networkName: string, deployName: string) => {
    const filePath = path.join(DEPLOY_INFO_DIRECTORY, `${networkName}.json`);
    const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    if (!fs.existsSync(DEPLOY_INFO_DIRECTORY)) {
        fs.mkdirSync(DEPLOY_INFO_DIRECTORY, {recursive: true});
    }

    let deployContractInfo: IContractDeployInfo = {...defaultDeployContractInfo};
    if (fileExists) {
        const deployInfo: Record<string, IContractDeployInfo> = JSON.parse(fs.readFileSync(filePath).toString());
        deployContractInfo = deployInfo[deployName];
        if (!deployContractInfo) {
            deployContractInfo = {...defaultDeployContractInfo};
        }
    }

    return deployContractInfo;
}

export const saveContractDeployInfo = async (networkName: string, deployName: string, contractDeployInfo: IContractDeployInfo) => {
    const filePath = path.join(DEPLOY_INFO_DIRECTORY, `${networkName}.json`);
    const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    const newFileContents: Record<string, IContractDeployInfo> = fileExists ? JSON.parse(fs.readFileSync(filePath).toString()) : {};
    newFileContents[deployName] = contractDeployInfo;
    console.log(`Saving contract deploy info for ${deployName} on network ${networkName}`)
    fs.writeFileSync(filePath, JSON.stringify(newFileContents, null, 2));
}