export default interface MarketplaceConfigInterface {
    name: string;
    generatorCollectionUrl: (marketplaceIdentifier: any, isMainnet: boolean) => string;
};