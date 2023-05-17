/* eslint-disable no-restricted-globals */
import * as lock from 'shared/lock';
import {
  CLOSE_WINDOW,
  FORGET_IDENTITY_REQUEST_RESPONSE,
  FROM_BACK_TO_POPUP,
  GET_ACCOUNT_REQUEST_RESPONSE,
  RESPONSE_TYPE,
  SIGN_REQUEST_RESPONSE,
} from '~/types';
import * as storage from 'controllers/StorageController';
import {
  BROADCAST_REQUEST_RESPONSE,
  GET_BALANCE_REQUEST_RESPONSE,
  GET_INSCRIPTIONS_REQUEST_RESPONSE,
  GET_UTXOS_REQUEST_RESPONSE,
  INSCRIBE_REQUEST_RESPONSE,
  MESSAGE_SIGN_REQUEST_RESPONSE,
} from '../types';
import getStoredState from 'redux-persist/es/getStoredState';
import { persistConfig } from '../pages/Popup/store';

export const getFaviconFromUrl = (u) => {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u);
  url.searchParams.set('size', '32');
  return url.toString();
};

export const getHostNameFromTab = (tab) => {
  const url = new URL(tab.url);
  const hostname = url.hostname;

  // fail rather than return an empty response
  if (!hostname) {
    throw new Error('cannot get hostname from tab ' + JSON.stringify(tab));
  }

  return hostname;
};

export const msgToContentScript = (type, payload) => ({
  type: RESPONSE_TYPE,
  message: {
    type,
    payload,
  },
});

class APIService {
  psbt;
  tx;
  message;
  content;
  utxoType;
  type;
  sender;
  host;
  favicon;
  activeSession;

  constructor() {
    this.psbt = null;
    this.tx = null;
    this.message = null;
    this.content = null;
    this.utxoType = null;
    this.type = null;
    this.sender = null;
    this.host = '';
    this.favicon = '';
    this.activeSession = null;
  }

  getState = () => {
    return {
      psbt: this.psbt,
      tx: this.tx,
      message: this.message,
      content: this.content,
      utxoType: this.utxoType,
      type: this.type,
      sender: this.sender,
      host: this.host,
      favicon: this.favicon,
      activeSession: this.activeSession,
    };
  };

  sendMessageToInject = (type, payload) => {
    if (!payload) payload = {};

    payload.sender = this.sender;

    chrome.tabs.sendMessage(this.sender, msgToContentScript(type, payload));
    lock.unlock();
  };

  openPopup = async (route = '') => {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    let top = 0;
    let left = 0;
    if (tab) {
      top = tab.height - 690;
      left = tab.width - 400;
    }
    chrome.windows.create({
      url: chrome.runtime.getURL(`popup.html#/${route}`),
      type: 'popup',
      left: left,
      top: top,
      width: 360,
      height: 630,
    });
  };

  closeWindow = () => {
    lock.unlock();
    chrome.runtime.sendMessage({
      type: FROM_BACK_TO_POPUP,
      action: CLOSE_WINDOW,
    });
  };

  forgetIdentity = async (sender) => {
    this.sender = sender.tab.id;
    this.host = getHostNameFromTab(sender.tab);
    await this.removeSession(this.host);
    this.sendMessageToInject(FORGET_IDENTITY_REQUEST_RESPONSE);
  };

  removeSession = async (host) => {
    const sessions = await this.getSessions();
    const index = sessions.findIndex((session) => session.host === host);
    if (index !== -1) {
      sessions.splice(index, 1);
      await this.setSessions(sessions);
    }
  };

  getSessions = async () => {
    const current = await storage.getValue('session');
    return current || [];
  };

  getSession = async (host) => {
    const sessions = await this.getSessions();
    const session = sessions.find((session) => session.host === host);
    if (session) {
      return session;
    } else {
      return null;
    }
  };

  setSessions = async (sessions) => {
    await storage.saveValue('session', sessions);
  };

  getStore = async () => {
    let store = await getStoredState(persistConfig);
    if (!store || !store.wallet.wallets.length)
      throw new Error('Store not found');
    return store;
  };

  // Third party endpoints
  getAccount = async (sender) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;

      this.type = 'auth';

      this.host = getHostNameFromTab(sender.tab);
      this.favicon = getFaviconFromUrl(sender.tab.url);

      const session = await this.getSession(this.host);
      if (session) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          await this.removeSession(this.host);
        } else {
          this.sendMessageToInject(
            GET_ACCOUNT_REQUEST_RESPONSE,
            session.account
          );
          return;
        }
      }
      await this.openPopup('auth');
    } catch (error) {
      this.sendMessageToInject(GET_ACCOUNT_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(error),
      });
    }
  };
  onGetAccountSuccess = async (payload) => {
    let sessions = (await this.getSessions()) || [];
    const newSession = {
      host: this.host,
      account: payload,
    };
    sessions.push(newSession);
    await this.setSessions(sessions);
    this.sendMessageToInject(GET_ACCOUNT_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onGetAccountReject = async ({ message }) => {
    this.sendMessageToInject(GET_ACCOUNT_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  inscribe = async (sender, payload) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'inscribe'; // support btc and ordinal in the future
      this.content = payload;

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(SIGN_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }

        this.activeSession = session;
        await this.openPopup('inscribe');
      } else {
        this.sendMessageToInject(INSCRIBE_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(INSCRIBE_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onInscribeSuccess = async (payload) => {
    this.sendMessageToInject(INSCRIBE_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onInscribeReject = async ({ message }) => {
    this.sendMessageToInject(INSCRIBE_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  signPsbt = async (sender, payload) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'psbt'; // support btc and ordinal in the future
      this.psbt = payload.psbt;

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(SIGN_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }

        this.activeSession = session;
        await this.openPopup('sign/psbt');
      } else {
        this.sendMessageToInject(SIGN_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(SIGN_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onSignPsbtSuccess = async (payload) => {
    this.sendMessageToInject(SIGN_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onSignPsbtReject = async ({ message }) => {
    this.sendMessageToInject(SIGN_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  signMessage = async (sender, payload) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'message';
      this.message = payload.message;

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(MESSAGE_SIGN_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }
        this.activeSession = session;
        await this.openPopup('sign/message');
      } else {
        this.sendMessageToInject(MESSAGE_SIGN_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(MESSAGE_SIGN_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onSignMessageSuccess = async (payload) => {
    this.sendMessageToInject(MESSAGE_SIGN_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onSignMessageReject = async ({ message }) => {
    this.sendMessageToInject(MESSAGE_SIGN_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  broadcast = async (sender, payload) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'broadcast';
      this.tx = payload.tx;

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(BROADCAST_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }
        this.activeSession = session;
        await this.openPopup('broadcast'); // TODO: add this page
      } else {
        this.sendMessageToInject(BROADCAST_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(BROADCAST_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onBroadcastSuccess = async (payload) => {
    this.sendMessageToInject(BROADCAST_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onBroadcastReject = async ({ message }) => {
    this.sendMessageToInject(BROADCAST_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  getBalance = async (sender) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'getBalance';

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(GET_BALANCE_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }
        this.activeSession = session;
        await this.openPopup('get'); // TODO: add this page
        // It should response with balance immediately.
      } else {
        this.sendMessageToInject(GET_BALANCE_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(GET_BALANCE_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onGetBalanceSuccesss = async (payload) => {
    this.sendMessageToInject(GET_BALANCE_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onGetBalancereject = async ({ message }) => {
    this.sendMessageToInject(GET_BALANCE_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  getInscriptions = async (sender) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'getInscriptions';

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(GET_INSCRIPTIONS_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }
        this.activeSession = session;
        await this.openPopup('get'); // TODO: add this page
        // It should response with balance immediately.
      } else {
        this.sendMessageToInject(GET_INSCRIPTIONS_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(GET_INSCRIPTIONS_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onGetInscriptionsSuccesss = async (payload) => {
    this.sendMessageToInject(GET_INSCRIPTIONS_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onGetInscriptionsreject = async ({ message }) => {
    this.sendMessageToInject(GET_INSCRIPTIONS_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };

  getUtxos = async (sender, payload) => {
    try {
      const store = await this.getStore();
      this.sender = sender.tab.id;
      this.host = getHostNameFromTab(sender.tab);

      this.type = 'getUtxos';
      this.utxoType = payload.type;

      const session = await this.getSession(this.host);
      if (session.account.accounts.length > 0) {
        const isAnyMatches = session.account.accounts.some((acc) =>
          store.wallet.wallets.some((wallet) => wallet.address === acc)
        );
        if (!isAnyMatches) {
          this.sendMessageToInject(GET_UTXOS_REQUEST_RESPONSE, {
            rejected: true,
            message:
              'The account is found in the session but not in the extension. Please use forgetIdentity first to sign out',
          });

          return;
        }
        this.activeSession = session;
        await this.openPopup(`get`); // TODO: add this page
        // It should response with balance immediately.
      } else {
        this.sendMessageToInject(GET_UTXOS_REQUEST_RESPONSE, {
          rejected: true,
          message: 'requestAccount first',
        });
      }
    } catch (err) {
      this.sendMessageToInject(GET_UTXOS_REQUEST_RESPONSE, {
        rejected: true,
        message: JSON.stringify(err),
      });
    }
  };
  onGetUtxosSuccesss = async (payload) => {
    this.sendMessageToInject(GET_UTXOS_REQUEST_RESPONSE, payload);
    this.closeWindow();
  };
  onGetUtxosreject = async ({ message }) => {
    this.sendMessageToInject(GET_UTXOS_REQUEST_RESPONSE, {
      rejected: true,
      message,
    });
    this.closeWindow();
  };
}

const apiService = new APIService();

export default apiService;
