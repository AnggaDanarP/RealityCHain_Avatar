import NetworkConfigInterface from "./NetworkConfigInterface";
import MarketplaceConfigInterface from "./MarketplaceConfigInterface";

interface SaleConfig {
    price: number;
    maxMintAmountPerTx: number;
}

export default interface CollectionConfigInterface {
    testnet: NetworkConfigInterface;
    mainnet: NetworkConfigInterface;
    contractName: string;
    tokenName: string;
    tokenSymbol: string;
    hiddenMetadataUri: string;
    maxSupply: number;
    maxSupplyPreSale: number;
    maxSupplyPublicSale: number;
    whitelistSale: SaleConfig;
    preSale: SaleConfig;
    publicSale1: SaleConfig;
    publicSale2: SaleConfig;
    contractAddress: string|null;
    whiteListAddresses: string[];
    marketplaceIdentifier: string;
    marketplaceConfig: MarketplaceConfigInterface;
};