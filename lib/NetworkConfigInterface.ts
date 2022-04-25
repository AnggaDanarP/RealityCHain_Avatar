export default interface NetworkConfigInterface {
    chainId: number;
    symbol: string;
    blockExplorer: {
        name: string;
        generatorContractUrl: (contractAddress: string) => string;
    };
};