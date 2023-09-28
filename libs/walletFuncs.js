const { Web3, HttpProvider } = require('web3');
const tokenAbi = require('../abis/tokenAbi');  // Assuming ABI is in the same directory

const providerURL = {
    Binance: "https://bsc-testnet.publicnode.com",
    Ethereum: "https://goerli.infura.io/v3/81f1f856e5854cda96f939fe2a658c40",
};

function convertTokenBalance(value, decimals) {
    const valueBigInt = BigInt(value);
    const ten = BigInt(10);
    let divisor = BigInt(1);

    for (let i = 0; i < decimals; i++) {
        divisor *= ten;
    }

    return valueBigInt / divisor;
}
async function getETHBalnace(address) {
    const provider = new HttpProvider(providerURL['Ethereum']);
    const web3 = new Web3(provider);
    let balanceWei = await web3.eth.getBalance(address);
    let balanceEth = web3.utils.fromWei(balanceWei, 'ether');
    return balanceEth;
}
async function getBNBBalnace(address) {
    const provider = new HttpProvider(providerURL['Binance']);
    const web3 = new Web3(provider);
    let balanceWei = await web3.eth.getBalance(address);
    let balanceBNB = web3.utils.fromWei(balanceWei, 'ether');
    return balanceBNB;
}
async function getTokenBalnaceETH(address, tokenAddress) {
    try {
        const provider = new HttpProvider(providerURL['Ethereum']);
        const web3 = new Web3(provider);
        const contract = new web3.eth.Contract(tokenAbi, tokenAddress);
        const balance = await contract.methods.balanceOf(address).call();
        const decimals = await contract.methods.decimals().call();
        return convertTokenBalance(balance, decimals).toString();
    } catch (err) {
        console.log(err);
        return 0;
    }
}

async function getTokenBalanceBNB(address, tokenAddress) {
    try {
        const provider = new HttpProvider(providerURL['Binance']);
        const web3 = new Web3(provider);
        const contract = new web3.eth.Contract(tokenAbi, tokenAddress);
        const balance = await contract.methods.balanceOf(address).call();
        const decimals = await contract.methods.decimals().call();
        return convertTokenBalance(balance, decimals).toString();
    } catch (err) { console.log(err); return 0; }
}

async function getTotalBalanceETH(address) {
    try {
        const USDTAddress = { Etheruem: "0x509ee0d083ddf8ac028f2a56731412edd63223b9", Binance: "0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684" };
        const BlazeXAddress = { Etheruem: "0xd268e5279D4D2206727485C442C0f873AACF9bb5", Binance: "0x31052dD33d9a183bCC8E82E94844AA5153a9b7CF" };
        const ETH_USDT_amount = await getTokenBalnaceETH(address, USDTAddress.Etheruem);
        const ETH_BLAZEX_amount = await getTokenBalnaceETH(address, BlazeXAddress.Etheruem);
        const ETH_amount = await getETHBalnace(address);

        return { USDT: ETH_USDT_amount, BLAZEX: ETH_BLAZEX_amount, NATIVE: ETH_amount };
    } catch (err) {
        console.log(err);
        return 0;
    }
}

async function getTotalBalanceBNB(address) {
    try {
        const USDTAddress = { Etheruem: "0x509ee0d083ddf8ac028f2a56731412edd63223b9", Binance: "0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684" };
        const BlazeXAddress = { Etheruem: "0xd268e5279D4D2206727485C442C0f873AACF9bb5", Binance: "0x31052dD33d9a183bCC8E82E94844AA5153a9b7CF" };
        const BNB_USDT_amount = await getTokenBalanceBNB(address, USDTAddress.Binance);
        const BNB_BLAZEX_amount = await getTokenBalanceBNB(address, BlazeXAddress.Binance);
        const BNB_amount = await getBNBBalnace(address);

        return { USDT: BNB_USDT_amount, BLAZEX: BNB_BLAZEX_amount, NATIVE: BNB_amount };
    } catch (err) {
        console.log(err);
        return 0;
    }
}

async function getTotalBalance(address) {
    try {
        const balanceBNB = await getTotalBalanceBNB(address);
        const balanceETH = await getTotalBalanceETH(address);

        return { "Binance": balanceBNB, "Ethereum": balanceETH };
    }
    catch (err) { console.log(err) }
}

module.exports = getTotalBalance;