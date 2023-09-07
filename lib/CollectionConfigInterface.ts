import NetworkConfigInterface from "./NetworkConfigInterface";
import MarketplaceConfigInterface from "./MarketplaceConfigInterface";

export default interface CollectionConfigInterface {
    testnet: NetworkConfigInterface;
    mainnet: NetworkConfigInterface;
    contractName: string;
    tokenName: string;
    tokenSymbol: string;
    hiddenMetadata: string;
    contractAddress: string|null;
    AirdropcontractAddress: string|null;
    legendaryAddress: string[];
    epicAddress: string[];
    rareAddress: string[];
    marketplaceIdentifier: string;
    marketplaceConfig: MarketplaceConfigInterface;
};