# NFT Metaverse Smart Contract

## Table of Contents
1. [Introduction](#introduction)
2. [Smart Contract Overview](#smart-contract-overview)
3. [Features](#features)
4. [Usage](#usage)
5. [Getting Started](#getting-started)
6. [Smart Contract Functions](#smart-contract-functions)

---

## 1. Introduction

Welcome to the NFT Metaverse Smart Contract! This smart contract is designed to enable the creation and management of NFTs (Non-Fungible Tokens) with a unique minting system. The contract supports three tiers of minting: Legendary, Epic, and Rare. Legendary and Epic mints are reserved for whitelisted addresses, while Rare mints are open to the public.

Then there is airdrop smart contract for admin can send token NFT in ERC20, ERC721, ERC1155 for the holder of NFT Avatar only. This smart contract only for admin and kind of some reward for the player

### Key Features
1. NFT Avatar
    - Three-tier minting system.
    - Whitelist functionality for Legendary and Epic mints.
    - One-time minting for Legendary mints per wallet address.
    - Public minting for Rare NFTs.
2. Airdrop
    - airdrop token in ERC20
    - airdrop Non-Fungible Token in ERC721
    - airdrop Semi Non-Fungible Token in ERC1155

---

## 2. Smart Contract Overview

This NFT Avatar smart contract  is built on the Arbitrum blockchain and utilizes the ERC-721 standard for NFTs. It provides a customizable and secure solution for creating and distributing NFTs within your metaverse project.

The Airdrop contract is also build under the NFT Avatar smart contract to verify that wallet address is holder and what tier was minted.

---

## 3. Features

### NFT Avatar
3.1. Three-tier Minting
- **Legendary Mint**: Reserved for whitelisted addresses, allowing one-time minting per wallet address.
- **Epic Mint**: Also for whitelisted addresses, enabling multiple mintings.
- **Rare Mint**: Open to the public, allowing anyone to mint NFTs.
3.2. Whitelist Management
- Admins can add or remove addresses from the whitelist.
- Whitelist addresses have exclusive access to Legendary and Epic mints.
3.3. Unique NFTs
- Legendary NFTs are unique and limited to one per wallet address.
- Epic and Rare NFTs can be minted multiple times.

### Airdrop
3.4. Airdrop of Tokens (ERC20)
- **Admin sending token to the holder
- **Admin sending token to the holder and the amount can automated by the tier token was minted
3.5. Airdrop of Non-Fungible Token (ERC721)
- **Admin sending NFT to the holder
3.6. Airdrop of Semi Non-Fungible Token (ERC1155)
- **Admin sending NFT to the holder
- **Admin sending NFT to the holder and the amount can automated by the tier token was minted
---

## 4. Usage

To use this smart contract, you will need to deploy it on the Arbitrum blockchain. Once deployed, you can interact with the contract through Ethereum wallet software or by utilizing web3.js or ethers.js libraries in your DApp.

To deploy Airdrop need smart contract address from NFT Avatar and it on the Arbitrum blockchain. Every function in this smart contract airdrop, need a smart contract address like ERC20, ERC721, ERC1155 to interact and it is following what token want to transfer. Make sure wallet address and token id Avatar is valid. All function only running by admin.

---

## 5. Getting Started

### Prerequisites
- Ethereum development environment.
- Knowledge of Solidity and Ethereum smart contracts.

### Deployment
1. Deploy the contract
    Open terminal and use this CLI to try testnet:
    ```bash
    yarn deploy --network <your network>
    ```
    You can place `<your network>` to `testnet` to try testnet like Rinkeby, Ropsten, etc and `mainnet` to use real ethereum. 
    The system will pop up the smart contract address, copy it and paste to `config/CollectionConfig.ts` on property `contractAddress` (string)
2. Verify the smart contract
    Use this CLI:
    ```bash
    yarn verify <smart contract address> --network <your network>
    ```
    `<smart contract address>` place to smart contract address that you get from deploy.
    the output will show the link to [etherscan](https://rinkeby.etherscan.io/)

### Integration
Integrate the smart contract with your NFT Metaverse application by using the contract's functions in your codebase.

---

## 6. Smart Contract Functions

### NFT Avatar
Below are the key functions provided by the smart contract:
- `mintLegendary()`: Allows whitelisted addresses to mint Legendary NFTs (one-time per address).
- `mintEpic()`: Allows whitelisted addresses to mint Epic NFTs (multiple times).
- `mintRare()`: Allows the public to mint Rare NFTs.
- `toggleMint()`: Admin function to open mint feature.
- `setMerkleRoot()`: Admin function to set merkle root for Legendary and Epic mint.
- `setBaseUri()`: Admin function to set metadata NFT Avatar.
- `withdraw()`: Admin function to draining all the fund in smart contract.
- `getAddressAlreadyClaimed()`: public function to check a wallet address is already mint by the tier function mint.
- `exist()`: public function to check a token ID is exist ar already minted before.

### Airdrop
Below are the key functions provided by the smart contract:
- `setAmountErc20ByTier()`: setup amount token ERC20 by tier of avatar minting.
- `setAmountErc1155ByTier()`: setup amount token ERC1155 by tier of avatar minting.
- `airdropToken()`: airdrop token function in ERC20 to single wallet
- `batchAirdropToken()`: airdrop token function in ERC20 to many wallets.
- `airdropTokenToByTier()`: airdrop token function in ERC20 to single wallet and the amount is already determined
- `batchAirdropTokenByTier()`: airdrop token function in ERC20 to many wallets and the amount is already determined
- `airdropNFT721()`: airdrop NFT function in ERC721 to single wallet
- `batchAirdropNFT721()`: airdrop NFT function in ERC721 to many wallets.
- `airdropNFT1155()`: airdrop NFT function in ERC1155 to single wallet
- `batchAirdropNFT1155()`: airdrop NFT function in ERC1155 to many wallets.
- `airdropNFT1155ByTier()`: airdrop NFT function in ERC1155 to single wallet and the amount is already determined
- `batchAirdropNFT1155ByTier()`: airdrop NFT function in ERC1155 to many wallets and the amount is already determined

---

**Disclaimer:** This README provides a high-level overview of the NFT Metaverse Smart Contract. Detailed implementation and security considerations should be thoroughly reviewed before deployment in a production environment.
