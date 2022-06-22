This is a Smart contract NFT project

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
5. Try the feature
    - Open/close whitelist minting
        ```bash
        yarn whitelist-open --network <your network>
        ```
        ```bash
        yarn whitelist-close --network <your network>
        ```
    - Open/Close Pre sale minting
        ```bash
        yarn presale-open --network <your network>
        ```
        ```bash
        yarn presale-close --network <your network>
        ```
    - Open/Close Prublic sale minting
        ```bash
        yarn public-sale-open --network <your network>
        ```
        ```bash
        yarn public-sale-close --network <your network>
        ```
    - Revealed the NFT
        ```bash
        yarn reveal --network <your network>
        ```
    - Withdraw the funds
        ```bash
        yarn withdraw --network <your network>
        ```
    To see all the CLI command, see `package.jason` file, and see script section.

###### Dont forget to close the feature to make your smart contract save 
    


