import bip38 from 'bip38'; // Passpharase encryption
import * as bip39 from 'bip39'; // Generate randomness
import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory, { BIP32Interface } from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory, { ECPairInterface } from 'ecpair';
import wif from 'wif';
import { getBIP322ToSignTx, getBIP322ToSpendTx } from './TransactionController';
import { splitByNChars } from './helpers/algos';
import { Taptree } from 'bitcoinjs-lib/src/types';
const aes256 = require('aes256');

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export const generateMnemonicAndSeed = (): [string, Buffer] => {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  return [mnemonic, seed];
};

export const generateSeed = (mnemonic: string): Buffer => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  return seed;
};

export const generateMasterNode = (
  seed: Buffer,
  network: bitcoin.Network = bitcoin.networks.bitcoin
): BIP32Interface => {
  const hdMaster = bip32.fromSeed(seed, network);
  return hdMaster;
};

export const generateAddress = (
  masterNode: BIP32Interface,
  path: Number = 0
): BIP32Interface => {
  const derived = masterNode.derivePath(`m/86'/0'/0'/0/${path}`);
  return derived;
};

export const generateTaprootAddress = (
  node: BIP32Interface,
  network: bitcoin.Network = bitcoin.networks.bitcoin
): [bitcoin.payments.Payment, bitcoin.Signer, Buffer] => {
  const xOnlyPubKey = node.publicKey.slice(1, 33);
  const paymentAddress = bitcoin.payments.p2tr({
    internalPubkey: xOnlyPubKey,
    network,
  });
  const signer = node.tweak(bitcoin.crypto.taggedHash('TapTweak', xOnlyPubKey));

  return [paymentAddress, signer, xOnlyPubKey];
};

export const generateTaprootSigner = (node: BIP32Interface): bitcoin.Signer => {
  const xOnlyPubKey = node.publicKey.slice(1, 33);
  const signer = node.tweak(bitcoin.crypto.taggedHash('TapTweak', xOnlyPubKey));

  return signer;
};

export const generateWallet = (
  masterNode: BIP32Interface,
  password: string,
  name: string = '',
  index: number = 0
): any => {
  const address = generateAddress(masterNode, index);
  const [paymentAddress, , xOnlyPubKey] = generateTaprootAddress(address);

  const { encrypted, encryptedChainCode } = encryptAddress(address, password);

  return {
    name: name ? name : `Account ${index + 1}`,
    address: paymentAddress.address,
    xOnlyPubKey,
    encryptedPrivKey: encrypted,
    encryptedChainCode,
    index,
  };
};

export const encryptMasterNode = (
  masterNode: BIP32Interface,
  passphrase: string
): { encrypted: string; encryptedChainCode: string } => {
  const decoded = wif.decode(masterNode.toWIF(), masterNode.network.wif);

  const encrypted = bip38.encrypt(
    decoded.privateKey,
    decoded.compressed,
    passphrase
  );

  const encryptedChainCode = bip38.encrypt(
    masterNode.chainCode,
    false,
    passphrase
  );

  return { encrypted, encryptedChainCode };
};

export const encryptAddress = (
  address: BIP32Interface,
  passphrase: string
): { encrypted: string; encryptedChainCode: string } => {
  const decoded = wif.decode(address.toWIF(), address.network.wif);

  const encrypted = bip38.encrypt(
    decoded.privateKey,
    decoded.compressed,
    passphrase
  );

  const encryptedChainCode = bip38.encrypt(
    address.chainCode,
    false,
    passphrase
  );

  return { encrypted, encryptedChainCode };
};

export const encryptMnemonic = (
  mnemonic: string,
  passphrase: string
): string => {
  const encrypted = aes256.encrypt(passphrase, mnemonic);
  return encrypted;
};

export const canDecrypt = (encrypted: string, passphrase: string): boolean => {
  try {
    bip38.decrypt(encrypted, passphrase);
    return true;
  } catch (e) {
    return false;
  }
};

export const decryptMasterNode = (
  encrypted: string,
  encryptedChainCode: string,
  passphrase: string
): BIP32Interface => {
  const decoded = bip38.decrypt(encrypted, passphrase);
  const chainCodeDecoded = bip38.decrypt(encryptedChainCode, passphrase);

  return bip32.fromPrivateKey(decoded.privateKey, chainCodeDecoded.privateKey);
};

export const decryptAddress = (
  encrypted: string,
  encryptedChainCode: string,
  passphrase: string,
  network: bitcoin.Network
): BIP32Interface => {
  const decoded = bip38.decrypt(encrypted, passphrase);
  const chainCodeDecoded = bip38.decrypt(encryptedChainCode, passphrase);

  return bip32.fromPrivateKey(
    decoded.privateKey,
    chainCodeDecoded.privateKey,
    network
  );
};

export const decryptMnemonic = (
  encrypted: string,
  passphrase: string
): string => {
  const decoded = aes256.decrypt(passphrase, encrypted);
  return decoded.toString();
};

export const signPSBTFromWallet = (
  signer: bitcoin.Signer,
  psbt: bitcoin.Psbt
): bitcoin.Transaction => {
  psbt.signAllInputs(signer);

  psbt.finalizeAllInputs();

  return psbt.extractTransaction();
};

export const signMessage = (
  signer: bitcoin.Signer,
  address: string,
  xOnlyPubKey: Buffer,
  message: string,
  network: bitcoin.Network
): string => {
  const toSpend = getBIP322ToSpendTx(address, message, network);
  const toSign = getBIP322ToSignTx(
    Buffer.from(toSpend.getId(), 'hex').reverse(),
    address,
    xOnlyPubKey,
    network
  );

  toSign.signInput(0, signer, [bitcoin.Transaction.SIGHASH_ALL]);
  toSign.finalizeInput(0);

  return toSign.data.inputs[0].finalScriptWitness?.toString('base64') || '';
};

export const generateAddressFromPubKey = (
  xOnlyPubKey: Buffer,
  network: bitcoin.Network = bitcoin.networks.bitcoin
): string | undefined => {
  const paymentAddress = bitcoin.payments.p2tr({
    internalPubkey: xOnlyPubKey,
    network,
  });

  return paymentAddress.address;
};

export const generateRevealAddress = (
  xOnlyPubKey: Buffer,
  mimeType: string,
  hexData: string,
  network: bitcoin.Network
): {
  p2tr: bitcoin.Payment;
  tapLeafScript: {
    leafVersion: number;
    script: Buffer;
    controlBlock: Buffer;
  };
} => {
  let inscribeLockScript = bitcoin.script.fromASM(
    `${xOnlyPubKey.toString('hex')} OP_CHECKSIG OP_0 OP_IF ${Buffer.from(
      'ord'
    ).toString('hex')} OP_1 ${Buffer.from(mimeType).toString(
      'hex'
    )} OP_0 ${splitByNChars(hexData, 1040).join(' ')} OP_ENDIF`
  );

  inscribeLockScript = Buffer.from(
    inscribeLockScript.toString('hex').replace('6f726451', '6f72640101'),
    'hex'
  );

  const scriptTree: Taptree = {
    output: inscribeLockScript,
  };

  const inscribeLockRedeem = {
    output: inscribeLockScript,
    redeemVersion: 192,
  };
  const inscribeP2tr = bitcoin.payments.p2tr({
    internalPubkey: xOnlyPubKey,
    scriptTree,
    network,
    redeem: inscribeLockRedeem,
  });

  const tapLeafScript = {
    leafVersion: inscribeLockRedeem.redeemVersion!,
    script: inscribeLockRedeem.output || Buffer.from(''),
    controlBlock: inscribeP2tr.witness![inscribeP2tr.witness!.length - 1],
  };

  return {
    p2tr: inscribeP2tr,
    tapLeafScript,
  };
};
