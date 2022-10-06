import NetworkConfigInterface from "./NetworkConfigInterface";

/*  
 * Local Networks 
*/
export const hardhatLocal: NetworkConfigInterface = {
    chainId: 31337,
    symbol: "eth (test)",
    blockExplorer: {
        name: "Block explorer (not available for local chains)",
        generatorContractUrl: (contractAddress: string) => "#",
        generateTransactionUrl: (transactionAddress: string) => `#`,
    },
}

/*
 * Ethereum 
 */
export const ethereumTestnet: NetworkConfigInterface = {
    chainId: 4,
    symbol: "ETH (test)",
    blockExplorer: {
        name: "Etherscan (Rinkeby)",
        generatorContractUrl: (contractAddress: string) => `https://rinkeby.etherscan.io/address/${contractAddress}`,
        generateTransactionUrl: (transactionAddress: string) => `https://rinkeby.etherscan.io/tx/${transactionAddress}`,
    },
}

export const ethereumMainnet: NetworkConfigInterface = {
    chainId: 1,
    symbol: "ETH",
    blockExplorer: {
        name: "Etherscan",
        generatorContractUrl: (contractAddress: string) => `https://etherscan.io/address/${contractAddress}`,
        generateTransactionUrl: (transactionAddress: string) => `https://etherscan.io/tx/${transactionAddress}`,
    },
}

/*
 * Polygon
 */
export const polygonTestnet: NetworkConfigInterface = {
    chainId: 80001,
    symbol: "MATIC (test)",
    blockExplorer: {
        name: "Polygonscan (Mumbai)",
        generatorContractUrl: (contractAddress: string) => `https://mumbai.polygonscan.com/address/${contractAddress}`,
        generateTransactionUrl: (transactionAddress: string) => `https://mumbai.polygonscan.com/tx/${transactionAddress}`,
    },
}

export const polygonMainnet: NetworkConfigInterface = {
    chainId: 137,
    symbol: "MATIC",
    blockExplorer: {
        name: "Polygonscan",
        generatorContractUrl: (contractAddress: string) => `https://polygonscan.com/address/${contractAddress}`,
        generateTransactionUrl: (transactionAddress: string) => `https://polygonscan.com/tx/${transactionAddress}`,
    },
}