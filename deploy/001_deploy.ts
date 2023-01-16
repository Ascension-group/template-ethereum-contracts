import {DeployFunction} from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre) {
    const {deployments, getNamedAccounts} = hre
    const {deploy} = deployments

    const {deployer} = await getNamedAccounts()

    await deploy('Contract', {
        from: deployer,
        args: [],
        skipIfAlreadyDeployed: false, // if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
        log: true, // if true, it will log the result of the deployment (tx hash, address and gas used)
        linkedData: undefined, // This allow to associate any JSON data to the deployment. Useful for merkle tree data for example
        libraries: undefined, // This let you associate libraries to the deployed contract
        proxy: false, // This options allow to consider your contract as a proxy
        value: '0', //how much ether to send with the transaction
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
        deterministicDeployment: false, // if true, it will deploy the contract at a deterministic address based on bytecode and constructor arguments. The address will be the same across all network. It use create2 opcode for that, if it is a string, the string will be used as the salt.
        waitConfirmations: 1, // number of the confirmations to wait after the transactions is included in the chain
    })
}
export default func
func.tags = ['Contract']
