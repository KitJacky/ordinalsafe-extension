import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { GET_WALLET_SERVICE_STATE } from '~/types';
import ActionButtons from '../../components/ActionButtons';
import RejectButton from '../../components/Buttons/RejectButton';
import GenericButton from '../../components/Buttons/GenericButton';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import { MESSAGE_SIGN_SUCCESS_RESPONSE } from '../../../../types';
import {
  signMessage,
  decryptAddress,
  generateTaprootSigner,
} from '../../../../controllers/WalletController';

const SignMessage = () => {
  const address = useSelector((state) => state.wallet.activeWallet.address);
  const encryptedPrivKey = useSelector(
    (state) => state.wallet.activeWallet.encryptedPrivKey
  );
  const encryptedChainCode = useSelector(
    (state) => state.wallet.activeWallet.encryptedChainCode
  );
  const pincode = useSelector((state) => state.auth.pincode);
  const xOnlyPubkey = useSelector(
    (state) => state.wallet.activeWallet.xOnlyPubKey
  );
  const network = useSelector((state) => state.settings.network);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getState = async () => {
      const { state } = await chrome.runtime.sendMessage({
        action: GET_WALLET_SERVICE_STATE,
      });
      if (state && state.type === 'message' && state.message) {
        setMessage(state.message);
        setLoading(false);
      } else {
        window.close();
      }
    };

    getState();
  }, []);

  const handleSign = async () => {
    setLoading(true);
    // TODO: sign message
    const walletNode = decryptAddress(
      encryptedPrivKey,
      encryptedChainCode,
      pincode,
      network
    );
    const signer = generateTaprootSigner(walletNode);
    const signedMessage = signMessage(
      signer,
      address,
      Buffer.from(xOnlyPubkey),
      message,
      network
    );
    // send response
    await chrome.runtime.sendMessage({
      action: MESSAGE_SIGN_SUCCESS_RESPONSE,
      payload: {
        signedMessage,
      },
    });
  };

  return (
    <>
      <CardScreenWrapper>
        <div className="flex flex-col justify-center items-center">
          <div className="text-sm text-gray-500 font-500 text-left mr-auto mb-4">
            Message To Sign
          </div>
          <textarea
            className="w-64 min-h-64 h-64 p-4 outline-none text-white bg-lightblue rounded resize-none"
            value={message}
            readOnly
          />
        </div>
      </CardScreenWrapper>
      <ActionButtons className="absolute bottom-10 left-0 right-0">
        <RejectButton w={36} onClick={() => window.close()} />
        <GenericButton
          text="Sign"
          w={36}
          onClick={handleSign}
          loading={loading}
        />
      </ActionButtons>
    </>
  );
};

export default SignMessage;
