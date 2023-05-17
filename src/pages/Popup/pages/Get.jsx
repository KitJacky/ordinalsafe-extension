import React, { useEffect, useState } from 'react';
import { GET_WALLET_SERVICE_STATE } from '~/types';

const Get = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getState = async () => {
      const { state } = await chrome.runtime.sendMessage({
        action: GET_WALLET_SERVICE_STATE,
      });
      if (state && state.type === 'get') {
        switch (state.method) {
          case 'getBalance':
            break;
          case 'getInscriptions':
            break;
          case 'getUtxos':
            switch (state.utxoType) {
              case 'ordinals':
                // send utxos with ordinals
                break;
              case 'cardinals':
                // send utxos with cardinals
                break;
              default:
                // send all utxos
                break;
            }
            break;
          default:
            break;
        }
        setLoading(false);
      } else {
        window.close();
      }
    };

    getState();
  }, []);

  return <div>Get</div>;
};

export default Get;
