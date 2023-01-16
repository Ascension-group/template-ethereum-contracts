import 'dotenv/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-foundry';
import 'hardhat-deploy';
import 'hardhat-tracer';
import 'hardhat-interact';
import {task} from 'hardhat/config';
import {HardhatUserConfig, HDAccountsUserConfig, HttpNetworkUserConfig, NetworksUserConfig} from 'hardhat/types';

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: '0.8.17',
                settings: {
                    viaIR: process.env.IS_COVERAGE ? false : true, //Temporary workaround for https://github.com/sc-forks/solidity-coverage/issues/715
                    optimizer: {
                        enabled: true,
                        runs: 2000,
                    },
                },
            },
        ],
    },

    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },

    networks: addForkConfiguration({
        hardhat: {
            initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
        },
        localhost: {
            url: node_url('localhost'),
            accounts: getAccount(),
        },
        mainnet: {
            url: node_url('mainnet'),
            accounts: getAccount(),
        },
        goerli: {
            url: node_url('goerli'),
            accounts: getAccount(),
        },
        optimism: {
            url: node_url('optimism'),
            accounts: getAccount(),
        },
        arbitrum: {
            url: node_url('arbitrum'),
            accounts: getAccount(),
            verify: {
                etherscan: {
                    apiKey: process.env.ETHERSCAN_API_KEY_ARBITRUM || '',
                    apiUrl: 'https://arbiscan.io/',
                },
            },
        },
        polygon: {
            url: node_url('polygon'),
            accounts: getAccount(),
            verify: {
                etherscan: {
                    apiKey: process.env.ETHERSCAN_API_KEY_POLYGON || '',
                    apiUrl: 'https://polygonscan.com/',
                },
            },
        },
        bsc: {
            url: node_url('bsc'),
            accounts: getAccount(),
            verify: {
                etherscan: {
                    apiKey: process.env.ETHERSCAN_API_KEY_BSC || '',
                    apiUrl: 'https://bscscan.com/',
                },
            },
        },
        avalanche: {
            url: node_url('avalanche'),
            accounts: getAccount(),
        },
    }),

    paths: {
        sources: 'contracts',
    },

    gasReporter: {
        currency: 'USD',
        gasPrice: 30,
        enabled: process.env.REPORT_GAS ? true : false,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        maxMethodDiff: 10,
    },

    typechain: {
        outDir: 'typechain',
        target: 'ethers-v5',
    },

    external: process.env.HARDHAT_FORK
        ? {
              deployments: {
                  // process.env.HARDHAT_FORK will specify the network that the fork is made from.
                  // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
                  hardhat: ['deployments/' + process.env.HARDHAT_FORK],
                  localhost: ['deployments/' + process.env.HARDHAT_FORK],
              },
          }
        : undefined,
};

export default config;

task('seed', 'Prints a new wallet seed phrase', async (_, {ethers}) => {
    const wallet = ethers.Wallet.createRandom();
    console.log(`Public Address[0]: ${wallet.address}`);
    console.log(`Mnemonic: ${wallet.mnemonic.phrase}`);
    console.log(`Private Key[0]: ${wallet.privateKey}`);
});

function getAccount(): string[] | {mnemonic: string} {
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey && privateKey !== '') {
        return [`${privateKey}`];
    }

    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic || mnemonic === '') {
        return {
            mnemonic: 'test test test test test test test test test test test junk',
        };
    }
    return {mnemonic: mnemonic};
}

function node_url(networkName: string): string {
    if (networkName) {
        const uri = process.env['NODE_URI_' + networkName.toUpperCase()];
        if (uri && uri !== '') {
            return uri;
        }
    }

    if (networkName === 'localhost') {
        // do not use ETH_NODE_URI
        return 'http://localhost:8545';
    }

    return '';
}

export function addForkConfiguration(networks: NetworksUserConfig): NetworksUserConfig {
    // While waiting for hardhat PR: https://github.com/nomiclabs/hardhat/pull/1542
    if (process.env.HARDHAT_FORK) {
        process.env['HARDHAT_DEPLOY_FORK'] = process.env.HARDHAT_FORK;
    }

    const currentNetworkName = process.env.HARDHAT_FORK;
    let forkURL: string | undefined = currentNetworkName && node_url(currentNetworkName);
    let hardhatAccounts: HDAccountsUserConfig | undefined;
    if (currentNetworkName && currentNetworkName !== 'hardhat') {
        const currentNetwork = networks[currentNetworkName] as HttpNetworkUserConfig;
        if (currentNetwork) {
            forkURL = currentNetwork.url;
            if (
                currentNetwork.accounts &&
                typeof currentNetwork.accounts === 'object' &&
                'mnemonic' in currentNetwork.accounts
            ) {
                hardhatAccounts = currentNetwork.accounts;
            }
        }
    }

    const newNetworks = {
        ...networks,
        hardhat: {
            ...networks.hardhat,
            ...{
                accounts: hardhatAccounts,
                forking: forkURL
                    ? {
                          url: forkURL,
                          blockNumber: process.env.HARDHAT_FORK_NUMBER
                              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
                              : undefined,
                      }
                    : undefined,
                mining: process.env.MINING_INTERVAL
                    ? {
                          auto: false,
                          interval: process.env.MINING_INTERVAL.split(',').map((v) => parseInt(v)) as [number, number],
                      }
                    : undefined,
            },
        },
    };
    return newNetworks;
}
