import apiService, { msgToContentScript } from 'services/APIService';
import * as storage from 'controllers/StorageController';
import * as lock from 'shared/lock';
import {
  APP_CONNECT,
  FORGET_IDENTITY_REQUEST,
  GET_ACCOUNT_CONNECT,
  GET_ACCOUNT_REJECT_RESPONSE,
  GET_ACCOUNT_REQUEST,
  GET_ACCOUNT_SUCCESS_RESPONSE,
  GET_TAB_ID_INNER_EVENT_REQUEST,
  GET_WALLET_SERVICE_STATE,
  MESSAGE_SIGN_CONNECT,
  MESSAGE_SIGN_REJECT_RESPONSE,
  MESSAGE_SIGN_REQUEST,
  MESSAGE_SIGN_SUCCESS_RESPONSE,
  POPUP_CLOSED,
  REQUEST_TYPE,
  RESPONSE_TYPE,
  SIGN_PSBT_CONNECT,
  SIGN_REJECT_RESPONSE,
  SIGN_REQUEST,
  SIGN_SUCCESS_RESPONSE,
  BROADCAST_REQUEST,
  GET_BALANCE_REQUEST,
  GET_INSCRIPTIONS_REQUEST,
  GET_UTXOS_REQUEST,
  BROADCAST_SUCCESS_RESPONSE,
  BROADCAST_REJECT_RESPONSE,
  GET_BALANCE_SUCCESS_RESPONSE,
  GET_BALANCE_REJECT_RESPONSE,
  GET_INSCRIPTIONS_SUCCESS_RESPONSE,
  GET_INSCRIPTIONS_REJECT_RESPONSE,
  GET_UTXOS_SUCCESS_RESPONSE,
  GET_UTXOS_REJECT_RESPONSE,
} from '~/types';
import { openTab } from '../../shared/helpers';
import {
  INSCRIBE_REJECT_RESPONSE,
  INSCRIBE_REQUEST,
  INSCRIBE_SUCCESS_RESPONSE,
} from '../../types';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    openTab('init/new-wallet');
  }
});

function externalMessageListener(message, sender, sendResponse) {
  const { messageSource, payload } = message;

  if (!messageSource || !payload || messageSource !== REQUEST_TYPE) {
    return false;
  }

  if (lock.isLocked(sender)) {
    sendResponse({ isLocked: true });
    console.log('Wallet is currently locked by other tab');
    return;
  }
  lock.lock(sender);
  const { type } = payload;
  switch (type) {
    case SIGN_REQUEST:
      apiService.signPsbt(sender, payload.payload);
      break;
    case GET_ACCOUNT_REQUEST:
      apiService.getAccount(sender);
      break;
    case INSCRIBE_REQUEST:
      apiService.inscribe(sender, payload.payload);
      break;
    case MESSAGE_SIGN_REQUEST:
      apiService.signMessage(sender, payload.payload);
      break;
    case FORGET_IDENTITY_REQUEST:
      apiService.forgetIdentity(sender);
      break;
    case BROADCAST_REQUEST:
      apiService.broadcast(sender, payload.payload);
      break;
    case GET_BALANCE_REQUEST:
      apiService.getBalance(sender);
      break;
    case GET_INSCRIPTIONS_REQUEST:
      apiService.getInscriptions(sender);
      break;
    case GET_UTXOS_REQUEST:
      apiService.getUtxos(sender, payload.payload);
      break;
    default:
      console.warn('Unknown message from content script - ', message);
  }
  sendResponse();
  return true;
}

// listen from popup
function internalMessageListener(message, sender, sendResponse) {
  const { messageSource, action, payload } = message;
  if (messageSource && messageSource !== RESPONSE_TYPE) {
    return false;
  }
  switch (action) {
    case GET_WALLET_SERVICE_STATE: {
      const state = apiService.getState();
      sendResponse({ state });
      break;
    }
    case SIGN_SUCCESS_RESPONSE:
      apiService.onSignPsbtSuccess(payload);
      break;
    case SIGN_REJECT_RESPONSE:
      apiService.onSignPsbtReject(payload);
      break;
    case INSCRIBE_SUCCESS_RESPONSE:
      apiService.onInscribeSuccess(payload);
      break;
    case INSCRIBE_REJECT_RESPONSE:
      apiService.onInscribeReject(payload);
      break;
    case MESSAGE_SIGN_SUCCESS_RESPONSE:
      apiService.onSignMessageSuccess(payload);
      break;
    case MESSAGE_SIGN_REJECT_RESPONSE:
      apiService.onSignMessageReject(payload);
      break;
    case GET_ACCOUNT_SUCCESS_RESPONSE:
      apiService.onGetAccountSuccess(payload);
      break;
    case GET_ACCOUNT_REJECT_RESPONSE:
      apiService.onGetAccountReject(payload);
      break;
    case BROADCAST_SUCCESS_RESPONSE:
      apiService.onBroadcastSuccess(payload);
      break;
    case BROADCAST_REJECT_RESPONSE:
      apiService.onBroadcastReject(payload);
      break;
    case GET_BALANCE_SUCCESS_RESPONSE:
      apiService.onGetBalanceSuccess(payload);
      break;
    case GET_BALANCE_REJECT_RESPONSE:
      apiService.onGetBalanceReject(payload);
      break;
    case GET_INSCRIPTIONS_SUCCESS_RESPONSE:
      apiService.onGetInscriptionsSuccess(payload);
      break;
    case GET_INSCRIPTIONS_REJECT_RESPONSE:
      apiService.onGetInscriptionsReject(payload);
      break;
    case GET_UTXOS_SUCCESS_RESPONSE:
      apiService.onGetUtxosSuccess(payload);
      break;
    case GET_UTXOS_REJECT_RESPONSE:
      apiService.onGetUtxosReject(payload);
      break;
    default:
      console.log('Unknown internal action received - ', action);
  }
  sendResponse();
  return true;
}

//disconnect listener
function onConnectListener(externalPort) {
  const name = externalPort.name;
  externalPort.onDisconnect.addListener(async function () {
    if (name !== APP_CONNECT) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          setTimeout(() => {
            switch (name) {
              case SIGN_PSBT_CONNECT:
              case MESSAGE_SIGN_CONNECT:
              case GET_ACCOUNT_CONNECT: {
                chrome.tabs.sendMessage(
                  tab.id,
                  msgToContentScript(POPUP_CLOSED, {
                    rejected: true,
                    sender: tab.id,
                  })
                );
                lock.unlock();
                break;
              }
              default:
                break;
            }
          }, 200);
        });
      });
    } else {
      /* const { AppState } = await storage.getValue('AppState');
      storage.saveValue({
        AppState: { ...AppState, lastClosed: Date.now() },
      }); */
    }
  });
}

export function getTabId({ action }, sender, sendResponse) {
  if (action !== GET_TAB_ID_INNER_EVENT_REQUEST) {
    return false;
  }

  sendResponse(sender.tab.id);
  return true;
}

chrome.runtime.onMessage.addListener(getTabId);
chrome.runtime.onMessage.addListener(externalMessageListener);
chrome.runtime.onMessage.addListener(internalMessageListener);
chrome.runtime.onConnect.addListener(onConnectListener);
