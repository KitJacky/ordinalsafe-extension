import React from 'react';
import { useSelector } from 'react-redux';

import BTCIcon from '../assets/icons/btc.svg';
import { satoshisToBTC } from '../utils';

const BitcoinBalance = () => {
  const balance = useSelector((state) => state.account.balance);

  return (
    <div className="flex flex-col justify-center items-center h-100 my-2">
      <img className="w-16 text-white" src={BTCIcon} alt="Bitcoin Icon" />
      <div className="flex flex-col text-center mt-4">
        <p className="text-gray-500 text-xs font-semibold">$29,108</p>
        <p className="text-white text-xl font-bold">
          {satoshisToBTC(balance)} BTC
        </p>
        <p className="text-gray-400 text-sm font-semibold">$809.76</p>
      </div>
    </div>
  );
};

export default BitcoinBalance;
