import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  balance: 0,
  history: [],
  // inscriptionIds only hold unspent inscriptionIds; spent inscriptionIds are removed from this list locally
  inscriptionIds: [],
  // cardinalUTXOs only hold unspent TXOs; spent TXOs are removed from this list locally
  cardinalUTXOs: [],
  ordinalUTXOs: [],
  unconfirmedCardinalUTXOs: [],
  // we might need this in the future
  unconfirmedOrdinalUTXOs: [],
  spentCardinalUTXOs: {},
  spentInscriptionIds: {},

  // brc20
  brcBalances: [],
  brcUTXOs: {},
  spentBrcUTXOs: {},
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    // not sure if we should allow balance reducer usage in the app.
    // just set utxos directly
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    addBalance: (state, action) => {
      state.balance += action.payload;
    },
    subBalance: (state, action) => {
      state.balance -= action.payload;
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    },
    addHistory: (state, action) => {
      state.history.push(action.payload);
    },
    setInscriptionIds: (state, action) => {
      const newInscriptionIds = action.payload;
      const newInscriptionIdsDict = {};

      newInscriptionIds.forEach((id) => {
        newInscriptionIdsDict[id] = true;
      });

      Object.keys(state.spentInscriptionIds)
        .filter((x) => !newInscriptionIdsDict[x])
        .forEach((id) => {
          delete state.spentInscriptionIds[id];
        });

      const inscriptionIdsToSet = [];
      newInscriptionIds.forEach((id) => {
        if (!state.spentInscriptionIds[id]) {
          inscriptionIdsToSet.push(id);
        }
      });

      state.inscriptionIds = inscriptionIdsToSet;
    },
    setCardinalUTXOs: (state, action) => {
      const newCardinalUTXOs = action.payload;
      const newCardinalUTXOsFlat = {};
      const unconfirmedCardinalUTXOsToSet = [];

      newCardinalUTXOs.forEach((utxo) => {
        newCardinalUTXOsFlat[utxo.txId + ':' + utxo.index] = true;
      });

      const unconfirmedCardinalUTXOsFromState = state.unconfirmedCardinalUTXOs;
      unconfirmedCardinalUTXOsFromState.forEach((utxo) => {
        if (!newCardinalUTXOsFlat[utxo.txId + ':' + utxo.index]) {
          unconfirmedCardinalUTXOsToSet.push(utxo);
        }
      });
      state.unconfirmedCardinalUTXOs = unconfirmedCardinalUTXOsToSet;

      Object.keys(state.spentCardinalUTXOs)
        .filter((x) => !newCardinalUTXOsFlat[x])
        .forEach((utxo) => {
          delete state.spentCardinalUTXOs[utxo];
        });

      const cardinalUTXOsToSet = [];
      newCardinalUTXOs.forEach((utxo) => {
        if (!state.spentCardinalUTXOs[utxo.txId + ':' + utxo.index]) {
          cardinalUTXOsToSet.push(utxo);
        }
      });

      state.cardinalUTXOs = cardinalUTXOsToSet;

      let sum = 0;
      state.cardinalUTXOs.forEach((utxo) => {
        sum += utxo.value;
      });
      state.unconfirmedCardinalUTXOs.forEach((utxo) => {
        sum += utxo.value;
      });
      state.balance = sum;
    },
    setOrdinalUTXOs: (state, action) => {
      state.ordinalUTXOs = action.payload;
    },
    addSpentCardinalUTXO: (state, action) => {
      const { txId, index, value } = action.payload;

      state.cardinalUTXOs = state.cardinalUTXOs.filter(
        (x) => x.txId !== txId || x.index !== index
      );
      state.unconfirmedCardinalUTXOs = state.unconfirmedCardinalUTXOs.filter(
        (x) => x.txId !== txId || x.index !== index
      );
      state.spentCardinalUTXOs[txId + ':' + index] = value;
    },
    addSpentInscriptionId: (state, action) => {
      const inscriptionId = action.payload;

      state.inscriptionIds = state.inscriptionIds.filter(
        (x) => x !== inscriptionId
      );
      state.spentInscriptionIds[inscriptionId] = true;
    },
    addUncofirmedCardinalUTXO: (state, action) => {
      const utxo = action.payload;
      state.unconfirmedCardinalUTXOs.push(utxo);
    },
    // brc20s
    setBrcBalances: (state, action) => {
      state.brcBalances = action.payload;
    },
    // TODO: add brc20 utxos
    // Dangerous, only on remove wallet
    reset: (state, action) => {
      state = initialState;
    },
  },
});

export const {
  setBalance,
  addBalance,
  subBalance,
  setHistory,
  addHistory,
  setInscriptionIds,
  setCardinalUTXOs,
  setOrdinalUTXOs,
  addSpentCardinalUTXO,
  addSpentInscriptionId,
  addUncofirmedCardinalUTXO,
  setBrcBalances,
  setBrcBalance,
  reset: resetAccount,
} = accountSlice.actions;

export default accountSlice.reducer;
