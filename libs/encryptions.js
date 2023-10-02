const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from([0x98, 0xb2, 0xea, 0xaa, 0x23, 0x7c, 0x7b, 0xd2, 0x7b, 0x4e, 0x42, 0xaf, 0xd6, 0x9c, 0x3c, 0xa7, 0x78, 0xeb, 0xfb, 0x6a, 0xb9, 0xaf, 0x55, 0x9f, 0xe6, 0xb5, 0x54, 0x0f, 0xfa, 0xdd, 0xa9, 0x0b]);

  // 32 bytes for AES-256
const IV = Buffer.from([0xe9, 0x71, 0x42, 0xc4, 0x76, 0x73, 0x04, 0xd6, 0x2e, 0xf9, 0x08, 0xc8, 0x61, 0x08, 0x13, 0xce]);// AES block size


// Encrypt a string
function encrypt(text) {
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return IV.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt a string
function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
}

module.exports = {encrypt, decrypt};