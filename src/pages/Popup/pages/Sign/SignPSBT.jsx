import React, { useEffect, useState } from 'react';
import { GET_WALLET_SERVICE_STATE } from '~/types';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import ActionButtons from '../../components/ActionButtons';
import RejectButton from '../../components/Buttons/RejectButton';
import GenericButton from '../../components/Buttons/GenericButton';
import { SIGN_SUCCESS_RESPONSE } from '../../../../types';
import SendSummaryCard from '../../components/SendSummaryCard';
import { fetchPsbtDetails } from '../../../../controllers/AccountController';
import { psbtHexToBase64, truncateAddress } from '../../utils';
import { Psbt } from 'bitcoinjs-lib';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveWallet } from '../../store/features/wallet';
import Skeleton from 'react-loading-skeleton';

const SignPSBT = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [psbt, setPsbt] = useState('');
  const [details, setDetails] = useState();

  const activeWallet = useSelector(
    (state) => state.wallet.activeWallet.address
  );

  useEffect(() => {
    const getState = async () => {
      console.log('SignPSBT');
      const { state } = await chrome.runtime.sendMessage({
        action: GET_WALLET_SERVICE_STATE,
      });
      if (state && state.type === 'psbt' && state.psbt) {
        const activeAddress = state.activeSession.account.accounts[0];
        dispatch(setActiveWallet(activeAddress));
        setPsbt(state.psbt);

        const details = await fetchPsbtDetails(
          Psbt.fromHex(state.psbt).toBase64()
        );
        console.log(details);

        // balance changes is array of { address, change } change can be positive or negative.
        // if address is our address and change is negative, we are sending
        // if address is our address and change is positive, we are receiving
        // we dont care the other cases
        const balanceChanges = details.balanceChanges;
        const totalSending =
          balanceChanges
            .filter(
              (change) => change.address === activeAddress && change.change < 0
            )
            .reduce((acc, change) => acc + change.change, 0) * -1;
        const totalReceiving = balanceChanges
          .filter(
            (change) => change.address === activeAddress && change.change > 0
          )
          .reduce((acc, change) => acc + change.change, 0);
        console.log(totalSending, totalReceiving);

        // inscriptionChanges is array of { address, change: {ins:[], outs:[]}}
        // if address is our address and change.outs is not empty, we are sending
        // if address is our address and change.ins is not empty, we are receiving
        // we dont care the other cases

        const inscriptionChanges = details.inscriptionChanges;
        const inscriptionsSending = inscriptionChanges
          .filter(
            (change) =>
              change.address === activeAddress && change.change.outs.length > 0
          )
          .map((change) => change.change.outs)
          .flat();
        const inscriptionsReceiving = inscriptionChanges
          .filter(
            (change) =>
              change.address === activeAddress && change.change.ins.length > 0
          )
          .map((change) => change.change.ins)
          .flat();
        console.log(inscriptionsSending, inscriptionsReceiving);

        setDetails({
          fee: details.fee,
          feePayer: details.feePayer,

          totalSending,
          totalReceiving,

          inscriptionsSending,
          inscriptionsReceiving,
        });
        setLoading(false);
      } else {
        window.close();
      }
    };

    getState();
  }, [dispatch]);

  const handleSign = async () => {
    setLoading(true);

    // TODO: sign psbt

    // send response
    await chrome.runtime.sendMessage({
      action: SIGN_SUCCESS_RESPONSE,
      payload: {
        signedPsbt: 'signed psbt',
      },
    });
  };
  return (
    <>
      <CardScreenWrapper>
        <div className="flex flex-col justify-center items-center mt-4">
          <p className="text-xs text-gray-500 font-500 text-left mr-auto my-1">
            You are sending
          </p>
          {/* TODO: make a div that has prev and back button at left and right which allow inner content act like carousel */}
          <div className="bg-lightblue rounded-xl py-1 px-4 w-72 h-16 max-h-16 overflow-y-scroll">
            {!details ? (
              <Skeleton count={2} />
            ) : (
              <>
                {details.totalSending !== 0 && (
                  <p className="text-sm text-white text-left font-500 my-1">
                    - {details.totalSending / 10 ** 9} BTC
                  </p>
                )}
                {details.inscriptionsSending &&
                  details.inscriptionsSending.map((inscription, index) => (
                    <p
                      key={index}
                      className="text-sm text-white text-left font-500 my-1"
                    >
                      - {truncateAddress(inscription)}
                    </p>
                  ))}
                {details.totalSending === 0 &&
                  details.inscriptionsSending.length === 0 && (
                    <p className="text-2xl text-white text-center font-500">
                      -
                    </p>
                  )}
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 font-500 text-left mr-auto my-1 mt-4">
            You are receiving
          </p>
          <div className="bg-lightblue rounded-xl py-1 px-4 w-72 h-16 max-h-16 overflow-y-scroll">
            {!details ? (
              <Skeleton count={2} />
            ) : (
              <>
                {details.totalReceiving !== 0 && (
                  <p className="text-sm text-white text-left font-500 my-1">
                    + {details.totalReceiving / 10 ** 9} BTC
                  </p>
                )}
                {details.inscriptionsReceiving &&
                  details.inscriptionsReceiving.map((inscription, index) => (
                    <p
                      key={index}
                      className="text-sm text-white text-left font-500 my-1"
                    >
                      + {truncateAddress(inscription)}
                    </p>
                  ))}
                {details.totalReceiving === 0 &&
                  details.inscriptionsReceiving.length === 0 && (
                    <p className="text-2xl text-white text-center font-500">
                      -
                    </p>
                  )}
              </>
            )}
          </div>
          <SendSummaryCard>
            <div className="flex flex-row justify-between items-start border-b border-borderColor">
              <p className="text-sm text-white font-500 my-4">Network Fee</p>
              <p className="text-sm text-gray-400 font-500 my-4">
                {!details ? (
                  <Skeleton width={100} />
                ) : (
                  details.fee / 10 ** 9 + ' BTC'
                )}
              </p>
            </div>
            <div className="flex flex-row justify-between items-start">
              <p className="text-sm text-white font-500 my-4">Fee Payer</p>
              <p className="text-sm text-gray-400 font-500 my-4">
                {!details ? (
                  <Skeleton width={100} />
                ) : details.feePayer === activeWallet ? (
                  'You'
                ) : (
                  truncateAddress(details.feePayer)
                )}
              </p>
            </div>
          </SendSummaryCard>
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

export default SignPSBT;
