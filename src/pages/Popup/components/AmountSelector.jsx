import React from 'react';

const AmountSelector = ({ amount, setAmount, name }) => {
  return (
    <div className="flex flex-col justify-stretch items-stretch my-4">
      <div className="flex flex-row justify-between items-center mb-1">
        <label for="amount" className="text-gray-500 font-500">
          Amount
        </label>
        <p className="text-xs text-gray-400">
          Available Balance: 0.0002 {name ? name : 'BTC'}
        </p>
      </div>
      <div className="flex flex-row justify-between items-center ml-1 relative">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="text"
          id="amount"
          autoComplete="off"
          className="text-white w-72 h-10 rounded-2xl bg-lightblue px-3 py-2 text-xs placeholder-white hover:bg-lightblue focus:bg-lightblue focus:outline-0"
          placeholder="Amount"
        />
        <button className="absolute right-2 text-gray-100 bg-gray-600 py-1 px-4 rounded-xl">
          MAX
        </button>
      </div>
      {!name && (
        <p className="my-2 text-left font-500 text-green-400">
          1 BTC ~ $28,100
        </p>
      )}
    </div>
  );
};

export default AmountSelector;
