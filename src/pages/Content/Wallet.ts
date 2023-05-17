import { UTXO, IWallet } from './types';

import {
  GET_ACCOUNT_REQUEST,
  SIGN_REQUEST,
  MESSAGE_SIGN_REQUEST,
  FORGET_IDENTITY_REQUEST,
  LOGIN_REJECT,
  SIGN_REJECT,
  MESSAGE_SIGN_REJECT,
  GET_BALANCE_REQUEST,
  BALANCE_REJECT,
  GET_INSCRIPTIONS_REQUEST,
  INSCRIPTIONS_REJECT,
  GET_UTXOS_REQUEST,
  UTXOS_REJECT,
  BROADCAST_REQUEST,
  BROADCAST_REJECT,
  INSCRIBE_REQUEST,
  INSCRIBE_REJECT,
  INVALID_PARAMS,
  INVALID_ADDRESS,
} from '~/types';

import { sendAsyncMessageToContentScript } from './messageHandler';
import * as bitcoin from 'bitcoinjs-lib';
import ecc from '@bitcoinerlab/secp256k1';

const packageJson = require('../../../package.json');

bitcoin.initEccLib(ecc);

class Wallet implements IWallet {
  isOrdinalSafe: boolean;
  version: string;

  constructor() {
    this.isOrdinalSafe = true;
    this.version = packageJson.version;
  }

  /* async forgetIdentity() {
      return new Promise(async (resolve) => {
        await sendAsyncMessageToContentScript({
          type: '3P_FORGET_IDENTITY',
        });
        resolve('SIGNOUT_SUCCESS');
      });
    } */
  requestAccounts(): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: GET_ACCOUNT_REQUEST,
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(LOGIN_REJECT);
        }
        resolve(res.accounts);
      } catch (err) {
        reject(err);
      }
    });
  }
  signPsbt(psbt: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: SIGN_REQUEST,
          payload: {
            psbt,
          },
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(SIGN_REJECT);
        }
        let { signedPsbt } = res;
        resolve(signedPsbt);
      } catch (err) {
        reject(err);
      }
    });
  }
  inscribe(
    mimeType: string,
    hexData: string,
    websiteFeeReceiver: string | null = null,
    websiteFeeInSats: number | null = null,
    inscriptionReceiver: string | null = null,
    isTestnet: boolean = false
  ): Promise<{ commit: string; reveal: string }> {
    return new Promise(async (resolve, reject) => {
      const isMimeTypeInvalid = !mimeType;
      const isHexDataInvalid = !hexData;
      const isFeeDataIncomplete =
        (websiteFeeInSats === null && websiteFeeReceiver !== null) ||
        (websiteFeeReceiver === null && websiteFeeInSats !== null);

      const isFeeDataInvalid =
        (websiteFeeReceiver !== null && websiteFeeInSats === 0) ||
        (websiteFeeReceiver !== null && !Number.isInteger(websiteFeeInSats));

      if (
        isMimeTypeInvalid ||
        isHexDataInvalid ||
        isFeeDataIncomplete ||
        isFeeDataInvalid
      ) {
        return reject(INVALID_PARAMS);
      }

      if (websiteFeeReceiver !== null) {
        try {
          bitcoin.address.toOutputScript(
            websiteFeeReceiver,
            isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
          );
        } catch (err) {
          return reject(INVALID_ADDRESS);
        }
      }

      if (inscriptionReceiver !== null) {
        try {
          bitcoin.address.toOutputScript(
            inscriptionReceiver,
            isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
          );
        } catch (err) {
          return reject(INVALID_ADDRESS);
        }
      }

      try {
        const res = await sendAsyncMessageToContentScript({
          type: INSCRIBE_REQUEST,
          payload: {
            mimeType,
            hexData,
            websiteFeeReceiver,
            websiteFeeInSats,
            inscriptionReceiver,
          },
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(INSCRIBE_REJECT);
        }
        let { txs } = res;
        resolve(txs);
      } catch (err) {
        reject(err);
      }
    });
  }
  broadcastTransaction(txHex: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: BROADCAST_REQUEST,
          payload: {
            txHex,
          },
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(BROADCAST_REJECT);
        }
        let { txid } = res;
        resolve(txid);
      } catch (err) {
        reject(err);
      }
    });
  }
  signMessage(message: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: MESSAGE_SIGN_REQUEST,
          payload: {
            message,
          },
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(MESSAGE_SIGN_REJECT);
        }
        let { signedMessage } = res;
        resolve(signedMessage);
      } catch (err) {
        reject(err);
      }
    });
  }
  // verifyMessage(message: string, signature: string): Promise<boolean> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const res = await sendAsyncMessageToContentScript({
  //         type: '3P_VERIFY_MESSAGE',
  //         payload: {
  //           message,
  //           signature,
  //         },
  //       });
  //       if (res.rejected) {
  //         if (res.message) return reject(res.message);
  //         return reject('SIGN_REJECT');
  //       }
  //       let { verified } = res;
  //       resolve(verified);
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });
  // }
  getBalance(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: GET_BALANCE_REQUEST,
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(BALANCE_REJECT);
        }
        resolve(res.balance);
      } catch (err) {
        reject(err);
      }
    });
  }
  getInscriptions(): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: GET_INSCRIPTIONS_REQUEST,
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(INSCRIPTIONS_REJECT);
        }
        resolve(res.inscriptions);
      } catch (err) {
        reject(err);
      }
    });
  }
  getUTXOs(
    type: string = 'all' // all, cardinals, ordinals
  ): Promise<UTXO[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: GET_UTXOS_REQUEST,
          payload: {
            type,
          },
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(UTXOS_REJECT);
        }
        resolve(res.utxos);
      } catch (err) {
        reject(err);
      }
    });
  }
}

const wallet = new Wallet();

export default wallet;
