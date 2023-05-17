import React, { useEffect, useState } from 'react';
import { GET_WALLET_SERVICE_STATE } from '~/types';

const Broadcast = () => {
  const [txHex, setTxHex] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const getState = async () => {
      const { state } = await chrome.runtime.sendMessage({
        action: GET_WALLET_SERVICE_STATE,
      });
      if (state && state.type === 'broadcast' && state.tx) {
        setTxHex(state.tx);
        setLoading(false);
      } else {
        window.close();
      }
    };

    getState();
  }, []);

  // TODO: show txHex and broadcast button
  return <div>Broadcast</div>;
};

export default Broadcast;
