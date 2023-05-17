import React, { useEffect } from 'react';
import { RouterProvider, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import './Popup.css';

import { store } from 'store';
import router from './router';

import { setLock } from 'store/features/settings';
import { fetchAllBalanceInfo } from 'controllers/AccountController';
import {
  setInscriptionIds,
  setCardinalUTXOs,
  setOrdinalUTXOs,
} from 'store/features/account';
import { setBrcBalances } from './store/features/account';
import { fetchBRC20Balances } from '../../controllers/AccountController';
import { networks } from 'bitcoinjs-lib';

const Popup = () => {
  const dispatch = useDispatch();

  const address = useSelector((state) => state.wallet.activeWallet).address;

  const fetchAndSet = async () => {
    const allBalanceInfo = await fetchAllBalanceInfo(address);
    if (allBalanceInfo) {
      const { cardinalUTXOs, ordinalUTXOs, inscriptionIds } = allBalanceInfo;

      dispatch(setCardinalUTXOs(cardinalUTXOs));
      dispatch(setOrdinalUTXOs(ordinalUTXOs));
      dispatch(setInscriptionIds(inscriptionIds));
    }

    const brcBalances = await fetchBRC20Balances(address);
    if (brcBalances) {
      dispatch(setBrcBalances(brcBalances));
    }
  };

  // fetch every x seconds
  useEffect(() => {
    fetchAndSet();
    const interval = setInterval(async () => {
      if (address) {
        await fetchAndSet();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // fetch on active wallet change
  useEffect(() => {
    fetchAndSet();
  }, [address]);

  return (
    <div className="">
      <RouterProvider router={router} />
    </div>
  );
};

export default Popup;
