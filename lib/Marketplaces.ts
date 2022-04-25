import MarketplaceConfigInterface from "./MarketplaceConfigInterface";

export const openSea: MarketplaceConfigInterface = {
    name: "OpenSea",
    generatorCollectionUrl: (marketplaceIdentifier: string, isMainnet: boolean) => "https://" + (isMainnet ? "www" : "testnet") + ".opensea.io/collection/" + marketplaceIdentifier,
};