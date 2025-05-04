// deploy/01_deploy_MerchAttestation.ts (nombre de archivo actualizado)

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// Ya no necesitamos importar Contract o parseEther para este contrato simple
// import { Contract, parseEther } from "ethers";

/**
 * Deploys the "MerchAttestation" contract using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMerchAttestation: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
 */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Preparing to deploy the MerchAttestation contract...");

  await deploy("MerchAttestation", {
    from: deployer, // The account used to deploy the contract (read from .env)
    // args: [], // Your MerchAttestation contract does not need constructor arguments
    log: true, // Display logs during deployment
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true, // Keep this for local testing, no effect on live networks
    waitConfirmations: 1, // Wait for 1 block confirmation after deployment
  });

  console.log("MerchAttestation contract deployed!");

  // Opcional: Obtener el contrato desplegado para interactuar si es necesario
  // const merchAttestation = await hre.deployments.get("MerchAttestation");
  // console.log("Dirección del contrato MerchAttestation:", merchAttestation.address);
};

export default deployMerchAttestation;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags MerchAttestation
deployMerchAttestation.tags = ["MerchAttestation"];
