const ethUtil = require("ethereumjs-util");
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
function isNumber(val) {
  return /^\d+(\.\d+)?$/.test(val);
}
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
function isValidPrivateKey(privateKeyHex) {
  // Check if it's a valid length and is a Buffer
  if (privateKeyHex.length !== 66 || !privateKeyHex.startsWith("0x")) {
    return false;
  }

  const privateKeyBuffer = Buffer.from(privateKeyHex.substring(2), "hex");

  // Check if private key is valid
  return ethUtil.isValidPrivate(privateKeyBuffer);
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date.toString() !== "Invalid Date";
}

module.exports = {
  isValidEthereumAddress,
  isValidDate,
  isValidPrivateKey,
  isValidURL,
  isNumber,
};
