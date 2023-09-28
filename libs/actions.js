const fetch = require('node-fetch');
const ETHERSCAN_API_KEY = 'E29Y4T9JQV3JDH75CCTKRJ7GJKV1CI5QJE';
const GAS_PRICE_API_URL = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${ETHERSCAN_API_KEY}`;
const { Web3 } = require("web3");
const factoryABI = require('../abis/factoryABI');
const tokenAbi = require('../abis/tokenAbi');
function formatDate(date1) {
  const date = new Date(date1 * 1000);
  const year = date.getFullYear();

  // JavaScript's getMonth() function returns month index starting from 0 (0 = January, 1 = February, ...)
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function fetchCurrentGwei() {
  try {
    const response = await fetch(GAS_PRICE_API_URL);
    const data = await response.json();

    // Convert Wei to Gwei
    const gwei = Number(data.result) / 1e9;
    console.log(gwei);
    return gwei;

  } catch (error) {
    console.error("Error fetching gas price:", error);
    return null;
  }
}

async function replyReviewLaunch(ctx, session, launchInlineKeyboard, isLaunch) {
  try {
    const fields = Object.keys(session);
    let textOutput = "";
    session.isExpectingAnswer = "";
    for (const fieldItem of fields) {
      if (
        session[fieldItem].hasOwnProperty("validation") &&
        fieldItem !== "importedWallet"
      ) {
        if (session[fieldItem].value !== undefined && session[fieldItem].value !== '') {
          if (fieldItem === "startTime" || fieldItem === "endTime") {
            const stringOfDate = formatDate(session[fieldItem].value);
            textOutput += `✔️ ${fieldItem}: <b>${stringOfDate}</b>\n`;
          } else {
            if (typeof session[fieldItem].value !== "boolean")
              textOutput += `✔️ ${fieldItem}: <b>${session[fieldItem].value}</b>\n`;
            else
              textOutput += `${fieldItem}: ${session[fieldItem].value ? "✅" : "🚫"
                }\n`;
          }
        } else {
          if (isLaunch === true)
            textOutput += `${fieldItem} : <b>Not Set</b>\n`;
        }
      }
    }
    const gwei = await fetchCurrentGwei();
    textOutput += "------------------------------\n";
    textOutput += `GWei: ${gwei.toFixed(2)}\n`;
    textOutput += `Deploy cost: 0.23 ${session.chain.value === "Binance" ? "BNB" : "ETH"}\n`;
    textOutput += `Service Fee: 0.01 ${session.chain.value === "Binance" ? "BNB" : "ETH"}\n`;
    textOutput += `Total: 0.24 ${session.chain.value === "Binance" ? "BNB" : "ETH"}\n`;
    ctx.reply(textOutput, {
      parse_mode: "HTML",
      reply_markup: launchInlineKeyboard,
    });
  } catch (err) {
    console.log("review & launch", err);
  }
}
// Your Ethereum node's RPC URL (could be local, Infura, Alchemy, etc.)
const providerURL = {
  Binance: "https://bsc-testnet.public.blastapi.io",
  Ethereum: "https://goerli.infura.io/v3/81f1f856e5854cda96f939fe2a658c40",
};

async function getPresaleInformation(presale_address, token_address, session) {
  try {

    const privateKey = session.wallets[session.selectedWallet - 1];
    // Setup provider with the private key
    const provider = new HDWalletProvider({
      privateKeys: [privateKey],
      providerOrUrl: providerURL[session.chain.value],
    });

    const web3 = new Web3(provider);

    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];
    const presaleContract = new web3.eth.Contract(factoryABI, presale_address);
    const tokenAddress = await presaleContract.methods.tokenAddress().call({ from: sender });

    const tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);
    const symbol = tokenContract.methods.symbol().call({ from: sender });
    const name = tokenContract.methods.symbol().call({ from: sender });
    const supply = tokenContract.methods.totalSupply().call({ from: sender });

    const sellAmount = await presaleContract.methods.sellAmount().call({ from: sender });
    const softCap = await presaleContract.methods.softCap().call({ from: sender });
    const totalRaises = await presaleContract.methods.totalDepositAmount().call({ from: sender });
    const totalContributors = await presaleContract.methods.totalContributors().call({ from: sender });
    const liquidityRatio = await presaleContract.methods.calcCurrentRate().call({ from: sender });
    const marketCap = await presaleContract.methods.calcInitialMarketCapInToken().call({ from: sender });
    const userRes = await presaleContract.methods.user(sender).call({ from: sender });
    const minimumBuyAmount = await presaleContract.methods.minimumBuyAmount().call({ from: sender });
    const maximumBuyAmount = await presaleContract.methods.maximumBuyAmount().call({ from: sender });
    const startTime = await presaleContract.methods.startTime().call({ from: sender });
    const endTime = await presaleContract.methods.endTime().call({ from: sender });
    const maxContributionAmount = await presaleContract.methods.maxContributionAmount().call({ from: sender });
    const isFinalized = await presaleContract.methods.isFinalized().call({ from: sender });
    return {
      tokenAddress,
      name,
      symbol,
      supply,
      sellAmount,
      softCap,
      minimumBuyAmount,
      maximumBuyAmount,
      startTime,
      endTime,
      maxContributionAmount,
      totalRaises,
      totalContributors,
      liquidityRatio,
      marketCap,
      isFinalized,
      contributionAmount: userRes._amount
    };
  } catch (err) {
    console.log(err);
  }
}

async function showInformationAboutProjectOwner(poolData, ctx, tokenInfomationResult, session, replyInlineKeyboard) {
  const outPutText = `<b>Project Information</b>\n  ----name: <b>${tokenInfomationResult.name}</b>\n  ----symbol: <b>${tokenInfomationResult.symbol}</b>\n  ----supply: <b>${tokenInfomationResult.supply}</b>\n${poolData.websiteURL ? '  ----website: <b>' + poolData.websiteURL + '</b>\n' : ''}${poolData.twitterURL ? '  ----twitter: <b>' + poolData.twitterURL + '</b>\n' : ''}${poolData.telegramURL ? '  ----telegram: <b>' + poolData.telegramURL + '</b>\n' : ''}${poolData.facebookURL ? '  ----facebook: <b>' + poolData.facebookURL + '</b>\n' : ''}${poolData.discordURL ? '  ----discord: <b>' + poolData.discordURL + '</b>\n' : ''}${poolData.githubURL ? '  ----github: <b>' + poolData.githubURL + '</b>\n' : ''}${poolData.instagramURL ? '  ----instagram: <b>' + poolData.instagramURL + '</b>\n' : ''}${poolData.redditURL ? '  ----reddit: <b>' + poolData.redditURL + '</b>\n' : ''}<b>Financial Metrics</b>\n  ----Funds Raised: <b>${tokenInfomationResult.totalRaises}${poolData.accepted_currency}</b>\n  ----Currency Used: <b>${tokenInfomationResult.accepted_currency}</b>\n<b>Presale Progress & Metrics</b>\n  ----Tokens Supplied: <b>${tokenInfomationResult.sellAmount}</b>\n  ----Softcap: <b>${tokenInfomationResult.softCap}</b>\n  ----Minimum Buy Amount: <b>${tokenInfomationResult.minimumBuyAmount ? tokenInfomationResult.minimumBuyAmount + poolData.accepted_currency : 'Not set'}</b>\n  ----Maximum Buy Amount: <b>${tokenInfomationResult.maximumBuyAmount ? tokenInfomationResult.maximumBuyAmount + poolData.maximumBuyAmount : 'Not Set'}</b>\n<b>Timeline & Status</b>\n  ----Launch Start Time: <b>${formatDate(tokenInfomationResult.startTime)}</b>\n  ----Launch End Time: <b>${formateDate(tokenInfomationResult.endTime)}</b>\n<b>Investors Insight</b>\n  ----Total Participants: <b>${tokenInfomationResult.totalContributors}</b>\n  ----Biggest Contribution: <b>${tokenInfomationResult.maxContributionAmount}${poolData.accepted_currency}</b>\n  ----Average Contribution: <b>${Number(tokenInfomationResult.totalDepositAmount / tokenInfomationResult.totalContributors).toFixed(4)}${poolData.accepted_currency}</b>\n<b>Post Launch Information</b>\n  ----Router For Listing: <b>${poolData.router}</b>\n  ----Liquidity Percentage: <b>${poolData.liquidityPercentage}%</b>\n`
  ctx.reply(outPutText, { parse_mode: 'HTML', reply_markup: replyInlineKeyboard });
}

module.exports = { replyReviewLaunch, getPresaleInformation };