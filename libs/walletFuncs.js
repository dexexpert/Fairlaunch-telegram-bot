const Web3 = require('web3');
const tokenAbi = require('../abis/tokenAbi');  // Assuming ABI is in the same directory

const providerURL = {
    Binance: "https://bsc-testnet.public.blastapi.io",
    Ethereum: "https://goerli.infura.io/v3/81f1f856e5854cda96f939fe2a658c40",
  };

  function convertTokenBalance(rawBalance, decimals) {
    return rawBalance / (10 ** decimals);
}
async function getETHBalnace(address) {
    const web3 = new Web3(providerURL['Etheruem']);
    let balanceWei = await web3.eth.getBalance(address);
    let balanceEth = web3.utils.fromWei(balanceWei, 'ether');
    return balanceEth;
}
async function getBNBBalnace(address) {
    const web3 = new Web3(providerURL['Binance']);
    let balanceWei = await web3.eth.getBalance(address);
    let balanceBNB = web3.utils.fromWei(balanceWei, 'ether');
    return balanceBNB;
}
async function getTokenBalnaceETH(address, tokenAddress){
    const web3 = new Web3(providerURL['Etheruem']);
    const contract = new web3.eth.Contract(tokenABI, contractAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = await contract.methods.decimals().call();
    return convertTokenBalance(balance, decimals);
}

async function getTokenBalanceBNB(address, tokenAddress){
    const web3 = new Web3(providerURL['Binance']);
    const contract = new web3.eth.Contract(tokenABI, contractAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = await contract.methods.decimals().call();
    return convertTokenBalance(balance, decimals);
}

async function getTotalBalanceETH(address) {
    const USDTAddress = {Etheruem : "0xdac17f958d2ee523a2206206994597c13d831ec7", Binance: "0x55d398326f99059ff775485246999027b3197955"};
    const BlazeXAddress = {Etheruem : "0x07f2716ed1536a2cdf8b2cbc12046d172c1a6433", Binance: "0xDD1b6B259986571A85dA82A84f461e1c212591c0"};
    const ETH_USDT_amount = await getTokenBalnaceETH(address, USDTAddress.Etheruem);
    const ETH_BLAZEX_amount = await getTokenBalnaceETH(address, BlazeXAddress.Etheruem);
    const ETH_amount = await getETHBalnace(address);

    return {USDT : ETH_USDT_amount, BLAZEX : ETH_BLAZEX_amount, NATIVE : ETH_amount};
}

async function getTotalBalanceBNB(address) {
    const USDTAddress = {Etheruem : "0xdac17f958d2ee523a2206206994597c13d831ec7", Binance: "0x55d398326f99059ff775485246999027b3197955"};
    const BlazeXAddress = {Etheruem : "0x07f2716ed1536a2cdf8b2cbc12046d172c1a6433", Binance: "0xDD1b6B259986571A85dA82A84f461e1c212591c0"};
    const BNB_USDT_amount = await getTokenBalanceBNB(address, USDTAddress.Binance);
    const BNB_BLAZEX_amount = await getTokenBalanceBNB(address, BlazeXAddress.Binance);
    const BNB_amount = await getBNBBalnace(address);
    
    return {USDT : BNB_USDT_amount, BLAZEX : BNB_BLAZEX_amount, NATIVE : BNB_amount};
}

async function getTotalBalance(address) {
    const balnaceBNB = await getTotalBalanceBNB(address);
    const balanceETH = await getTotalBalanceETH(address);

    return {Binance : balanceBNB, Ethereum : balanceETH};
}

module.exports = getTotalBalance;