import React from 'react';

const FinishFlow = () => {
  return (
    <div className="flex flex-col h-screen justify-start items-center py-8 px-4">
      <p className="text-2xl font-500 text-white mb-4">Wallet Created</p>
      <p className="text-sm font-500 text-gray-500 mb-4">
        You can now use your wallet in the extension!
      </p>
    </div>
  );
};

export default FinishFlow;
