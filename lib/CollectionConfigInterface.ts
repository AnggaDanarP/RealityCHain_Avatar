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
    addressTreasury: string[];
    amountTreasury: number[];
    marketplaceIdentifier: string;
    marketplaceConfig: MarketplaceConfigInterface;
};