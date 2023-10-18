const fetch = require("node-fetch");
const ETHERSCAN_API_KEY = "E29Y4T9JQV3JDH75CCTKRJ7GJKV1CI5QJE";
const GAS_PRICE_API_URL = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${ETHERSCAN_API_KEY}`;
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { formatUnits, BigNumber, formatEther } = require("ethers");
const factoryABI = require("../abis/factoryABI");
const tokenAbi = require("../abis/tokenAbi");
const fairlaunchAbi = require("../abis/FairLaunch");
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
function parseSoftCap(softcap, accepted_currency) {
  let decimalValue = 18;
  if (accepted_currency === "BlazeX") decimalValue = 9;
  else if (accepted_currency === "USDT") decimalValue = 6;
  return formatUnits(softcap, decimalValue);
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

async function replyCertainCategoryMessage(ctx, pool, category) {
  try {
    const fields = Object.keys(pool);
    console.log("poolInfunction : ", pool);
    console.log("fields", fields);
    let textOutput = "";
    const categoryArray = {
      poolAddress: "setup",
      deployerAddress: "setup",
      deployerUsername: "setup",
      token_address: "setup",
      token_name: "setup",
      token_symbol: "setup",
      accepted_currency: "setup",
      chain: "setup",
      sellAmount: "configuration",
      softcap: "configuration",
      minimumBuyAmount: "configuration",
      maximumBuyAmount: "configuration",
      whitelist_enabled: "configuration",
      referralEnabled: "configuration",
      router: "configuration",
      refundType: "configuration",
      liquidityPercentage: "configuration",
      startTime: "configuration",
      endTime: "configuration",
      lockupPeriod: "configuration",
      logoURL: "information",
      websiteURL: "information",
      twitterURL: "information",
      telegramURL: "information",
      facebookURL: "information",
      discordURL: "information",
      githubURL: "information",
      instagramURL: "information",
      redditURL: "information",
      preview: "information",
      description: "information",
    };
    for (const fieldItem in pool) {
      if (
        fieldItem === "token_name" ||
        category === undefined ||
        categoryArray[fieldItem] == category
      ) {
        if (
          pool[fieldItem] !== undefined &&
          pool[fieldItem] !== ""
        ) {
          if (fieldItem === "startTime" || fieldItem === "endTime") {
            const stringOfDate = formatDate(pool[fieldItem]);
            textOutput += `${fieldItem}: <b>${stringOfDate}</b>\n`;
          } else {
            if (typeof pool[fieldItem] !== "boolean") {
              let showValue = pool[fieldItem];
              let currencyValue = "";
              if (fieldItem === "sellAmount" || fieldItem === "token_supply") {
                showValue = formatUnits(
                  showValue,
                  parseInt(pool.token_decimals)
                );
                currencyValue = pool.token_symbol;
              } else if (
                fieldItem === "softcap" ||
                fieldItem === "minimumBuyAmount" ||
                fieldItem === "maximumBuyAmount"
              ) {
                let decimalValue = 18;
                if (pool["accepted_currency"] === "BlazeX")
                  decimalValue = 9;
                else if (pool["accepted_currency"] === "USDT")
                  decimalValue = 6;
                showValue = formatUnits(showValue, decimalValue);
                currencyValue = pool.accepted_currency;
              }
              textOutput += `${fieldItem}: <b>${showValue} ${currencyValue}</b>\n`;
            } else
              textOutput += `${fieldItem}: ${
                pool[fieldItem] ? "✅" : "🚫"
              }\n`;
          }
        } else {
          textOutput += `${fieldItem} : <b>Not Set</b>\n`;
        }
      }
    }
    return textOutput;
  } catch (err) {
    console.log("review & launch", err);
  }
  return "";
}

async function replyReviewMessage(ctx, session, category) {
  try {
    const fields = Object.keys(session);
    let textOutput = "";
    session.isExpectingAnswer = "";
    for (const fieldItem of fields) {
      if (
        fieldItem === "chain" ||
        fieldItem === "token_address" ||
        fieldItem === "token_name" ||
        fieldItem === "symbol" ||
        (session[fieldItem].hasOwnProperty("validation") &&
          fieldItem !== "importedWallet" &&
          (category === undefined || session[fieldItem].category === category))
      ) {
        if (
          session[fieldItem].value !== undefined &&
          session[fieldItem].value !== ""
        ) {
          if (fieldItem === "startTime" || fieldItem === "endTime") {
            const stringOfDate = formatDate(session[fieldItem].value);
            textOutput += `${fieldItem}: <b>${stringOfDate}</b>\n`;
          } else {
            if (typeof session[fieldItem].value !== "boolean") {
              let showValue = session[fieldItem].value;
              let currencyValue = "";
              if (fieldItem === "sellAmount" || fieldItem === "token_supply") {
                showValue = formatUnits(
                  showValue,
                  parseInt(session.token_decimals.value)
                );
                currencyValue = session.token_symbol.value;
              } else if (
                fieldItem === "softcap" ||
                fieldItem === "minimumBuyAmount" ||
                fieldItem === "maximumBuyAmount"
              ) {
                let decimalValue = 18;
                if (session["accepted_currency"].value === "BlazeX")
                  decimalValue = 9;
                else if (session["accepted_currency"].value === "USDT")
                  decimalValue = 6;
                showValue = formatUnits(showValue, decimalValue);
                currencyValue = session.accepted_currency.value;
              }
              textOutput += `${fieldItem}: <b>${showValue} ${currencyValue}</b>\n`;
            } else
              textOutput += `${fieldItem}: ${
                session[fieldItem].value ? "✅" : "🚫"
              }\n`;
          }
        } else {
          textOutput += `${fieldItem} : <b>Not Set</b>\n`;
        }
      }
    }
    const gwei = await fetchCurrentGwei();
    textOutput += "------------------------------\n";
    textOutput += `GWei: ${gwei.toFixed(2)}\n`;
    textOutput += `Deploy cost: 0.23 ${
      session.chain.value === "Binance" ? "BNB" : "ETH"
    }\n`;
    textOutput += `Total: 0.23 ${
      session.chain.value === "Binance" ? "BNB" : "ETH"
    }\n`;
    return textOutput;
  } catch (err) {
    console.log("review & launch", err);
  }
  return "";
}

async function replyReviewLaunch(
  ctx,
  session,
  launchInlineKeyboard,
  isLaunch,
  category
) {
  try {
    const fields = Object.keys(session);
    let textOutput = "";
    session.isExpectingAnswer = "";
    for (const fieldItem of fields) {
      if (
        fieldItem === "chain" ||
        fieldItem === "token_address" ||
        fieldItem === "token_name" ||
        fieldItem === "symbol" ||
        (session[fieldItem].hasOwnProperty("validation") &&
          fieldItem !== "importedWallet" &&
          (category === undefined ||
            session[fieldItem].category === category)) ||
        session[fieldItem].hasOwnProperty("notRequired")
      ) {
        if (
          session[fieldItem].value !== undefined &&
          session[fieldItem].value !== ""
        ) {
          if (fieldItem === "startTime" || fieldItem === "endTime") {
            const stringOfDate = formatDate(session[fieldItem].value);
            textOutput += `${fieldItem}: <b>${stringOfDate}</b>\n`;
          } else {
            if (typeof session[fieldItem].value !== "boolean") {
              let currencyValue = "";
              if (fieldItem === "sellAmount") {
                currencyValue =
                  session.token_symbol.value + " (with 18 decimals)";
              } else if (
                fieldItem === "softcap" ||
                fieldItem === "minimumBuyAmount" ||
                fieldItem === "maximumBuyAmount"
              ) {
                currencyValue = session.accepted_currency.value;
              }
              textOutput += `${fieldItem}: <b>${session[fieldItem].value} ${currencyValue}</b>\n`;
            } else
              textOutput += `${fieldItem}: ${
                session[fieldItem].value ? "✅" : "🚫"
              }\n`;
          }
        } else {
          textOutput += `${fieldItem} : <b>Not Set</b>\n`;
        }
      }
    }
    const gwei = await fetchCurrentGwei();
    textOutput += "------------------------------\n";
    textOutput += `GWei: ${gwei.toFixed(2)}\n`;
    textOutput += `Deploy cost: 0.23 ${
      session.chain.value === "Binance" ? "BNB" : "ETH"
    }\n`;
    textOutput += `Total: 0.23 ${
      session.chain.value === "Binance" ? "BNB" : "ETH"
    }\n`;
    const sentMessageId = await ctx.reply(textOutput, {
      parse_mode: "HTML",
      reply_markup: launchInlineKeyboard,
    });
    return sentMessageId;
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
    const presaleContract = new web3.eth.Contract(
      fairlaunchAbi,
      presale_address
    );
    const tokenAddress = await presaleContract.methods
      .tokenAddress()
      .call({ from: sender });

    const tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);
    const symbol = await tokenContract.methods.symbol().call({ from: sender });
    const name = await tokenContract.methods.symbol().call({ from: sender });
    const supply = await tokenContract.methods
      .totalSupply()
      .call({ from: sender });
    const decimals = await tokenContract.methods
      .decimals()
      .call({ from: sender });

    const sellAmount = await presaleContract.methods
      .sellAmount()
      .call({ from: sender });
    console.log("sellAmount", sellAmount);
    const softCap = await presaleContract.methods
      .softcap()
      .call({ from: sender });
    console.log("softCap", softCap);
    const totalRaises = await presaleContract.methods
      .totalDepositAmount()
      .call({ from: sender });
    console.log("totalRaises", totalRaises);
    const totalContributors = await presaleContract.methods
      .totalContributor()
      .call({ from: sender });
    console.log("totalContributors", totalContributors);
    const liquidityRatio = await presaleContract.methods
      .liquidityPercentage()
      .call({ from: sender });
    console.log("liquidityRatio", liquidityRatio);
    const lockupDays = await presaleContract.methods
      .lockupDates()
      .call({ from: sender });
    console.log("lockup days", lockupDays);
    const marketCap = await presaleContract.methods
      .calcInitialMarketCapInToken("1")
      .call({ from: sender });
    console.log("marketCap", marketCap);
    const userRes = await presaleContract.methods
      .users(sender)
      .call({ from: sender });
    console.log("userRes", userRes);
    const minimumBuyAmount = await presaleContract.methods
      .minimumBuyAmount()
      .call({ from: sender });
    console.log("minimumBuyAmount", minimumBuyAmount);
    const maximumBuyAmount = await presaleContract.methods
      .maximumBuyAmount()
      .call({ from: sender });
    console.log("maximumBuyAmount", maximumBuyAmount);
    const startTime = await presaleContract.methods
      .startTime()
      .call({ from: sender });
    console.log("startTime", startTime);
    const endTime = await presaleContract.methods
      .endTime()
      .call({ from: sender });
    console.log("endTime", endTime);
    const maxContributionAmount = await presaleContract.methods
      .maxContributionAmount()
      .call({ from: sender });
    console.log("maxContributionAmount", maxContributionAmount);
    const isFinalized = await presaleContract.methods
      .isFinalized()
      .call({ from: sender });
    console.log("isFinalized", isFinalized);
    return {
      tokenAddress,
      name,
      symbol,
      decimals,
      supply,
      sellAmount,
      softCap,
      minimumBuyAmount,
      maximumBuyAmount,
      startTime,
      lockupDays,
      endTime,
      maxContributionAmount,
      totalRaises,
      totalContributors,
      liquidityRatio,
      marketCap,
      isFinalized,
      contributionAmount: userRes._amount,
    };
  } catch (err) {
    console.log(err);
  }
}

async function showInformationAboutProjectOwner(
  poolData,
  ctx,
  tokenInfomationResult,
  session,
  replyInlineKeyboard
) {
  const outPutText = `Token Details Menu:\n🔸 🌐 Project Name: <b>${
    tokenInfomationResult.name
  }</b>\n\n🔹 🔖 Token Information\n🆔Symbol: <b>${
    tokenInfomationResult.symbol
  }</b>\n📊 Decimals:<b>${tokenInfomationResult.decimals}</b>\n📝 Description:${
    poolData.description
  }\n<b>💰 Accepted Currency</b> : ${
    poolData.accepted_currency
  }\n\n🔹 💰 Financial Details\n💸 Raised: <b>${parseSoftCap(
    tokenInfomationResult.totalRaises,
    poolData.accepted_currency
  )}${poolData.accepted_currency}</b>\n🏦 Soft Cap: <b>${parseSoftCap(
    tokenInfomationResult.softCap,
    poolData.accepted_currency
  )} ${poolData.accepted_currency}</b>\n🪙 Tokens for Presale: <b>${formatUnits(
    tokenInfomationResult.sellAmount,
    Number(tokenInfomationResult.decimals)
  )}</b>\n🌊 Liquidity %:<b>${
    tokenInfomationResult.liquidityRatio
  }</b>\n🔒 Liquidity Lock Time: <b>${
    tokenInfomationResult.lockupDays
  } days</b>\n🛒 Listing Platform: <b>${
    poolData.router
  }</b>\n💲 Minimum buy amount: <b>${
    parseSoftCap(poolData.minimumBuyAmount, poolData.accepted_currency)
  } ${poolData.accepted_currency}</b>\n💵 Maximum buy amount: <b>${
    parseSoftCap(poolData.maximumBuyAmount, poolData.accepted_currency)
  } ${poolData.accepted_currency}</b>\n\n🔹 🛍 Sale & Contribution Details\n⏰ Presale Start Time: <b>${formatDate(
    tokenInfomationResult.startTime
  )}</b>\n⏳ Presale End Time: <b>${formatDate(
    tokenInfomationResult.endTime
  )}</b>\n🚫 Max Contribution: <b>${parseSoftCap(
    tokenInfomationResult.maxContributionAmount,
    poolData.accepted_currency
  )} ${poolData.accepted_currency}</b>\n👥 Total Contributors: <b>${
    tokenInfomationResult.totalContributors
  }</b>\n🎟 Your Purchase: <b>${
    parseSoftCap(tokenInfomationResult.contributionAmount, poolData.accepted_currency)
  } ${poolData.accepted_currency}</b>\n\n🔹 🌐 Web & Social Links\n🌍 Official Website: ${
    poolData.websiteURL
      ? "  ----website: <b>" + poolData.websiteURL + "</b>\n"
      : ""
  }🐦 Twitter: ${
    poolData.twitterURL
      ? "  ----twitter: <b>" + poolData.twitterURL + "</b>\n"
      : ""
  }📡 Telegram: ${
    poolData.telegramURL
      ? "  ----telegram: <b>" + poolData.telegramURL + "</b>\n"
      : ""
  }📘 Facebook: ${
    poolData.facebookURL
      ? "  ----facebook: <b>" + poolData.facebookURL + "</b>\n"
      : ""
  }🎮 Discord: ${
    poolData.discordURL
      ? "  ----discord: <b>" + poolData.discordURL + "</b>\n"
      : ""
  }`;
  const sentMessageId = await ctx.reply(outPutText, {
    parse_mode: "HTML",
    reply_markup: replyInlineKeyboard,
  });
  session.today_messages.push(sentMessageId.message_id);
}

module.exports = {
  replyReviewLaunch,
  replyCertainCategoryMessage,
  getPresaleInformation,
  replyReviewMessage,
  showInformationAboutProjectOwner,
};
