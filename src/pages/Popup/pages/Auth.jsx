import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { GET_WALLET_SERVICE_STATE } from '~/types';
import CardScreenWrapper from '../components/Wrappers/CardScreenWrapper';
import { AuthAccountItem } from '../components/AuthAccountItem';
import ActionButtons from '../components/ActionButtons';
import RejectButton from '../components/Buttons/RejectButton';
import GenericButton from '../components/Buttons/GenericButton';
import {
  GET_ACCOUNT_CONNECT,
  GET_ACCOUNT_SUCCESS_RESPONSE,
} from '../../../types';

const Auth = () => {
  const [host, setHost] = useState('');
  const [favicon, setFavicon] = useState('');

  const [loading, setLoading] = useState(true);

  const [selectedWallets, setSelectedWallets] = useState([]);

  const wallets = useSelector((state) => state.wallet.wallets).map((wallet) => {
    return {
      address: wallet.address,
      name: wallet.name,
    };
  });

  useEffect(() => {
    const getState = async () => {
      const { state } = await chrome.runtime.sendMessage({
        action: GET_WALLET_SERVICE_STATE,
      });
      if (state && state.type === 'auth' && state.host) {
        setHost(state.host);
        setFavicon(state.favicon);
        setLoading(false);
      } else {
        window.close();
      }
    };

    getState();
    chrome.runtime.connect({ name: GET_ACCOUNT_CONNECT });
  }, []);

  const handleSelectWallet = (address) => {
    if (selectedWallets.includes(address)) {
      setSelectedWallets(
        selectedWallets.filter((wallet) => wallet !== address)
      );
    } else {
      setSelectedWallets([...selectedWallets, address]);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    await chrome.runtime.sendMessage({
      action: GET_ACCOUNT_SUCCESS_RESPONSE,
      payload: {
        accounts: selectedWallets,
      },
    });
  };

  return (
    <>
      <CardScreenWrapper>
        <div className="flex flex-col justify-center items-center">
          <img src={favicon} alt="favicon" className="w-8 h-8 mt-8" />
          <p className="text-gray-600 mt-2">{host}</p>
          <p className="text-white text-2xl font-500 mt-4">
            Connect with OrdinalSafe
          </p>
          <p className="text-gray-500 font-500 text-sm mt-2 mr-auto">
            Select account
          </p>
          <div className="flex flex-col justify-center items-center pt-8 overflow-y-auto max-h-64">
            {wallets.map((wallet) => (
              <AuthAccountItem
                key={wallet.address}
                address={wallet.address}
                name={wallet.name}
                selectedAddress={selectedWallets.includes(wallet.address)}
                setSelectedAddress={handleSelectWallet}
              />
            ))}
          </div>
        </div>
      </CardScreenWrapper>
      <ActionButtons className="absolute bottom-10 left-0 right-0">
        <RejectButton w={36} onClick={() => window.close()} />
        <GenericButton
          text="Connect"
          w={36}
          onClick={handleConnect}
          loading={loading}
        />
      </ActionButtons>
    </>
  );
};

export default Auth;
