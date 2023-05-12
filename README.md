# NFT Minting Random
This is a Smart contract NFT project that using minting random concept using [ERC721R library](https://medium.com/@dumbnamenumbers/erc721r-a-new-erc721-contract-for-random-minting-so-people-dont-snipe-all-the-rares-68dd06611e5) to get token ID randomly.

## Features
1. Free minting: This phase is free minting but the NFT is cannot tradeable by the time that setup from owner. Each address will only get 1 NFT.
2. Rserve: Holders will reserve nft tokens but they do not directly get the nft and only reserve tokens. Each Address only have 2 NFT.
3. Guaranteed: Normal minting with low prices and each address only has the opportunity to get 2 NFTs.
4. FCFS: Like the public minting feature, this feature is also like normal minting but has a higher price.
5. Claiming Reserve: This feature is only open on FCFS where addresses that have reserved before can claim tokens for the number of tokens that were reserved.
6. Airdrop: This function is only performed by the owner who can provide tokens to the specified address and then supply them based on the minting phase determined by the owner.
7. Public mint: This feature will be opened if it is needed under certain conditions by the owner.

## Getting Started

First, install all the pakages:

```bash
yarn 
```

You can start copiying the file and modifying `.env.example`. The file must be raname to `.env`.
## Requirements :

- Collection Uri Prefix
    you can use my dummy data for NFT to try this project `ipfs://QmayPxabgZjQYEqkKdMLfHwp6hZawDHERQRCBjPwKLM1cF/`
- Network server (Infura, Achemy, etc)
    In this section you need 2 server for testnet and mainnet. Use Rinkeby for testnet and mainnet for mainnet. You must have an account and make an API in HTTP. To more information [klik here](https://docs.alchemy.com/alchemy/introduction/getting-started)
- Private wallet address 
    To get the private key, see [this](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key)
- Block Explorer (Etherscan for Ethereum, etc)
    You must have an account and make an API in HTTP. To make and API you can see in this [video](https://www.youtube.com/watch?v=QDeAQa-75xs)

## Implementation

1. Rename contract
    Rename the smart contract first using terminal and run:
    ```bash
    yarn rename-contract
    ```
2. Modify `config/CollectionConfig.ts`
    Modify that file to setting like token symbol, hidden metadata URI, sale price and maximum amount per transaction.
    You can use my dummy hidden metadata to use it `ipfs://QmayPxabgZjQYEqkKdMLfHwp6hZawDHERQRCBjPwKLM1cF/`
3. Deploy the contract
    Open terminal and use this CLI to try testnet:
    ```bash
    yarn deploy --network <your network>
    ```
    You can place `<your network>` to `testnet` to try testnet like Rinkeby, Ropsten, etc and `mainnet` to use real ethereum. 
    The system will pop up the transaction hash, copy it and paste to `config/CollectionConfig.ts` on property `contractAddress` (string)
4. Verify the smart contract
    Use this CLI:
    ```bash
    yarn verify <transaction hash> --network <your network>
    ```
    `<transaction hash>` place to transaction hash that you get from deploy.
    the output will show the link to [etherscan](https://rinkeby.etherscan.io/)

###### Dont forget to close the feature to make your smart contract save 
    


