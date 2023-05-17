import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GET_WALLET_SERVICE_STATE } from '~/types';
import CardScreenWrapper from '../components/Wrappers/CardScreenWrapper';
import ActionButtons from '../components/ActionButtons';
import RejectButton from '../components/Buttons/RejectButton';
import GenericButton from '../components/Buttons/GenericButton';
import { SIGN_SUCCESS_RESPONSE } from '../../../types';
import SendSummaryCard from '../components/SendSummaryCard';
import { satoshisToBTC, truncateAddress } from '../utils';
import GasModal from './Sign/GasModal';
import {
  getInscribeTxsInfo,
  getInscribeCommitTx,
  getInscribeRevealTx,
} from '../../../controllers/TransactionController';
import {
  fetchBitcoinPrice,
  fetchInscribeFees,
  postMultipleTransactions,
} from '../../../controllers/AccountController';
import {
  decryptAddress,
  generateTaprootSigner,
  signPSBTFromWallet,
  generateRevealAddress,
} from '../../../controllers/WalletController';
import {
  addSpentCardinalUTXO,
  addUncofirmedCardinalUTXO,
} from 'store/features/account';

const Inscribe = () => {
  const dispatch = useDispatch();

  const cardinalUTXOs = useSelector((state) => state.account.cardinalUTXOs);
  const unconfirmedCardinalUTXOs = useSelector(
    (state) => state.account.unconfirmedCardinalUTXOs
  );
  const address = useSelector((state) => state.wallet.activeWallet.address);
  const encryptedPrivKey = useSelector(
    (state) => state.wallet.activeWallet.encryptedPrivKey
  );
  const encryptedChainCode = useSelector(
    (state) => state.wallet.activeWallet.encryptedChainCode
  );
  const pincode = useSelector((state) => state.auth.pincode);
  const xOnlyPubKey = useSelector(
    (state) => state.wallet.activeWallet.xOnlyPubKey
  );
  const network = useSelector((state) => state.settings.network);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [feeRate, setFeeRate] = useState(1);
  const [feeRates, setFeeRates] = useState([]);
  const [serviceFee, setServiceFee] = useState(null);
  const [btcPrice, setBTCPrice] = useState(0);
  const [chosenUTXOs, setChosenUTXOs] = useState([]);
  const [change, setChange] = useState(0);
  const [revealCost, setRevealCost] = useState(0);
  const [commitCost, setCommitCost] = useState(0);
  const [postageSize, setPostageSize] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openFeeModal = () => {
    setIsModalOpen(true);
  };

  const handleInscribe = async () => {
    setLoading(true);

    // TODO: inscribe sign and send
    try {
      // TODO: figure out why BUffer.from is needed
      const { p2tr: revealAddress, tapLeafScript } = generateRevealAddress(
        Buffer.from(xOnlyPubKey),
        content.mimeType,
        content.hexData,
        network
      );

      const walletNode = decryptAddress(
        encryptedPrivKey,
        encryptedChainCode,
        pincode,
        network
      );
      const signer = generateTaprootSigner(walletNode);

      const commitPSBT = getInscribeCommitTx(
        chosenUTXOs,
        address,
        revealAddress.address,
        revealCost,
        change,
        Buffer.from(xOnlyPubKey),
        serviceFee.feeAmount,
        serviceFee.feeReceiver,
        network
      );
      const commitTx = signPSBTFromWallet(signer, commitPSBT);

      const revealPSBT = getInscribeRevealTx(
        commitTx.getHash(),
        0,
        revealCost,
        postageSize,
        content.inscriptionReceiver || address,
        revealAddress.output,
        revealAddress.internalPubkey,
        tapLeafScript,
        content.websiteFeeReceiver,
        content.websiteFeeInSats,
        network
      );

      const revealTx = signPSBTFromWallet(walletNode, revealPSBT);

      const transactions = [commitTx.toHex(), revealTx.toHex()];
      const { txHashes } = await postMultipleTransactions(transactions);
      console.log('send btc hash', txHashes);

      // TODO: hold memmpool dependencies system
      chosenUTXOs.forEach((utxo) => {
        dispatch(
          addSpentCardinalUTXO({
            txId: utxo.txId,
            index: utxo.index,
            value: utxo.value,
          })
        );
      });

      if (change > 0) {
        dispatch(
          addUncofirmedCardinalUTXO({
            txId: commitTx.getId(),
            index: 1,
            value: change,
          })
        );
      }

      // send response
      await chrome.runtime.sendMessage({
        action: SIGN_SUCCESS_RESPONSE,
        payload: {
          commit: commitTx.getId(),
          reveal: revealTx.getId(),
        },
      });
    } catch (err) {
      // TODO: handle error
      console.log(err);
    }
  };

  useEffect(() => {
    const getState = async () => {
      const { state } = await chrome.runtime.sendMessage({
        action: GET_WALLET_SERVICE_STATE,
      });
      if (state && state.type === 'inscribe' && state.content) {
        setContent(state.content);
        setLoading(false);
        console.log(state.content);
      } else {
        window.close();
      }
    };

    getState();
  }, []);

  useEffect(() => {
    const fetchFeeRates = async () => {
      // TODO: fetch fee rates
      setFeeRates([1, 2, 3, 4, 5]);
    };
    fetchFeeRates();
  }, []);

  useEffect(() => {
    const fetchServiceFees = async () => {
      const serviceFee = await fetchInscribeFees();

      setServiceFee(serviceFee);
    };
    fetchServiceFees().catch((err) => {
      // if errors out set default fee
      // for now we are responding from API with 0 fees
      setServiceFee({
        feeAmount: 0.5, // USD
        feeReceiver:
          'bc1p9sde7glyucw43szdgg3fd0fucupdh2s8gf4r4hyyayxfp8jxyl3qc3k46a',
      });
    });
  }, []);

  useEffect(() => {
    const fetcBTCPrice = async () => {
      const price = await fetchBitcoinPrice();
      console.log('bitcoin price:', price);
      setBTCPrice(price);
    };
    fetcBTCPrice().catch((err) => {
      console.log('Error fetching btc price: ', err);
      setBTCPrice(27000);
    });
  }, []);

  useEffect(() => {
    const calculateSize = async (cardinalUTXOsToUse) => {
      const { chosenUTXOs, change, commitCost, revealCost, postageSize } =
        getInscribeTxsInfo(
          cardinalUTXOsToUse,
          content.hexData,
          address,
          feeRate,
          serviceFee.feeAmount,
          serviceFee.feeReceiver,
          btcPrice,
          content.websiteFeeInSats,
          network
        );

      setChosenUTXOs(chosenUTXOs);
      setChange(change);
      setCommitCost(commitCost);
      setRevealCost(revealCost);
      setPostageSize(postageSize);
      setLoading(false);
    };
    if (
      cardinalUTXOs &&
      unconfirmedCardinalUTXOs &&
      content &&
      feeRate &&
      address &&
      serviceFee &&
      btcPrice &&
      network
    ) {
      calculateSize(cardinalUTXOs).catch((err) => {
        console.log('Only confirmed utxos: ', err);
        calculateSize(cardinalUTXOs.concat(unconfirmedCardinalUTXOs)).catch(
          (err) => {
            console.log('Confirmed + unconfirmed utxos: ', err);
            // TODO: handle error
          }
        );
      });
    }
  }, [
    cardinalUTXOs,
    unconfirmedCardinalUTXOs,
    feeRate,
    address,
    network,
    content,
    serviceFee,
    btcPrice,
  ]);

  return (
    <>
      <GasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feeRates={feeRates}
        setFeeRate={setFeeRate}
        feeRate={feeRate}
      />
      <CardScreenWrapper>
        {content && (
          <div className="flex flex-col justify-center items-center">
            <p className="text-white text-lg font-500 my-1">
              You are inscribing
            </p>
            <img
              src="https://picsum.photos/200/300"
              alt="content"
              className="w-20 h-20 rounded-xl mt-2 mb-1"
            />
            <p className="text-xs text-gray-500 font-500 my-1">
              Type: {content.mimeType}
            </p>
            <SendSummaryCard>
              <div className="flex flex-row justify-between items-start border-b border-borderColor">
                <p className="text-sm text-white font-500 my-4">To</p>
                <p className="text-sm text-gray-400 font-500 my-4">
                  {content.inscriptionReceiver
                    ? truncateAddress(content.inscriptionReceiver)
                    : 'Your wallet'}
                </p>
              </div>
              {content.websiteFeeInSats && content.websiteFeeReceiver ? (
                <>
                  <div className="flex flex-row justify-between items-start border-b border-borderColor">
                    <p className="text-sm text-white font-500 my-4">
                      Website Fee
                    </p>
                    <p className="text-sm text-gray-400 font-500 my-4">
                      {content.websiteFeeInSats / 100000000} BTC
                    </p>
                  </div>
                  <div className="flex flex-row justify-between items-start border-b border-borderColor">
                    <p className="text-sm text-white font-500 my-4">
                      Fee Receiver
                    </p>
                    <p className="text-sm text-gray-400 font-500 my-4">
                      {truncateAddress(content.websiteFeeReceiver)}
                    </p>
                  </div>
                </>
              ) : (
                <></>
              )}
              <div className="flex flex-col justify-between items-between py-2">
                <div className="flex flex-row justify-between items-center">
                  <p className="text-white text-sm font-500 ">Total Cost</p>
                  <div className="flex flex-col justify-start items-end">
                    <p className="text-gray-400 text-sm font-500">
                      {satoshisToBTC(commitCost)} BTC{' '}
                    </p>
                    <p className="text-gray-500 font-500">$0.5 </p>
                  </div>
                </div>
                <div className="flex flex-row justify-between items-center pt-4">
                  <p className="text-white font-500 text-xs">Medium ~2min</p>
                  <p
                    className="text-primary font-500 text-xs cursor-pointer"
                    onClick={openFeeModal}
                  >
                    Edit
                  </p>
                </div>
              </div>
            </SendSummaryCard>
          </div>
        )}
      </CardScreenWrapper>
      <ActionButtons className="absolute bottom-10 left-0 right-0">
        <RejectButton w={36} onClick={() => window.close()} />
        <GenericButton
          text="Inscribe"
          w={36}
          onClick={handleInscribe}
          loading={loading}
        />
      </ActionButtons>
    </>
  );
};

export default Inscribe;
