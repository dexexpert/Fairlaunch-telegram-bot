const fetch = require('node-fetch');
const ETHERSCAN_API_KEY = 'E29Y4T9JQV3JDH75CCTKRJ7GJKV1CI5QJE'; 
const GAS_PRICE_API_URL = `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${ETHERSCAN_API_KEY}`;

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

async function replyReviewLaunch(ctx, session, launchInlineKeyboard) {
  try {
    const fields = Object.keys(session);
    let textOutput = "";
    session.isExpectingAnswer = "";
    for (const fieldItem of fields) {
      if (
        session[fieldItem].hasOwnProperty("validation") &&
        fieldItem !== "importedWallet"
      ) {
        if (session[fieldItem].value !== undefined) {
          if (fieldItem === "startTime" || fieldItem === "endTime") {
            const date = new Date(session[fieldItem].value * 1000);
            const stringOfDate = formatDate(date);
            textOutput += `${fieldItem}: <b>${stringOfDate}</b>\n`;
          } else {
            if (typeof session[fieldItem].value !== "boolean")
              textOutput += `${fieldItem}: <b>${session[fieldItem].value}</b>\n`;
            else
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
    textOutput += `Deploy cost: 0.23 ${session.chain === "Binance" ? "BNB" : "ETH"}\n`;
    textOutput += `Service Fee: 0.01 ${session.chain === "Binance" ? "BNB" : "ETH"}\n`;
    textOutput += `Total: 0.24 ${session.chain === "Binance" ? "BNB" : "ETH"}\n`;
    ctx.reply(textOutput, {
      parse_mode: "HTML",
      reply_markup: launchInlineKeyboard,
    });
  } catch (err) {
    console.log("review & launch", err);
  }
}

async function getPresaleInformation(poolAddress, session) {
  
}

module.exports = replyReviewLaunch;
