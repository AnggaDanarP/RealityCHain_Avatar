import NetworkConfigInterface from "./NetworkConfigInterface";
import MarketplaceConfigInterface from "./MarketplaceConfigInterface";

export default interface CollectionConfigInterface {
    testnet: NetworkConfigInterface;
    mainnet: NetworkConfigInterface;
    contractName: string;
    hiddenMetadata: string;
    contractAddress: string|null;
    freeMintAddress: string[];
    fcfsAddress: string[];
    guarantedAddress: string[];
    marketplaceIdentifier: string;
    marketplaceConfig: MarketplaceConfigInterface;
};