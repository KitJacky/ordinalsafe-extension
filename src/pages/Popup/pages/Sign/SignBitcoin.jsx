import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  getSendBitcoinTx,
  getSendBitcoinTxInfo,
} from '../../../../controllers/TransactionController';
import {
  decryptAddress,
  generateTaprootSigner,
  signPSBTFromWallet,
} from '../../../../controllers/WalletController';
import Header from '../../components/Header';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import { GoBackChevron } from '../../components/GoBackChevron';
import BTCIcon from '../../assets/icons/btc.svg';
import SendSummaryCard from '../../components/SendSummaryCard';
import { btcToSatoshis, satoshisToBTC, truncateAddress } from '../../utils';
import ActionButtons from '../../components/ActionButtons';
import SendButton from '../../components/Buttons/SendButton';
import GasModal from './GasModal';
import { postTransaction } from '../../../../controllers/AccountController';

import {
  addSpentCardinalUTXO,
  addUncofirmedCardinalUTXO,
} from 'store/features/account';

const SignBitcoin = () => {
  const dispatch = useDispatch();

  const location = useLocation();
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

  const [size, setSize] = useState(0);
  const [feeRate, setFeeRate] = useState(1);
  const [fee, setFee] = useState(0.1);
  const [feeRates, setFeeRates] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [change, setChange] = useState(0);
  const [chosenUTXOs, setChosenUTXOs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { amount, address: addressToSend } = location.state;

  const handleSend = async () => {
    setLoading(true);
    try {
      // TODO: figure out why BUffer.from is needed
      const sendBitcoinPSBT = getSendBitcoinTx(
        address,
        addressToSend,
        btcToSatoshis(amount),
        chosenUTXOs,
        change,
        Buffer.from(xOnlyPubKey),
        network
      );
      const walletNode = decryptAddress(
        encryptedPrivKey,
        encryptedChainCode,
        pincode,
        network
      );
      const signer = generateTaprootSigner(walletNode);
      const transaction = signPSBTFromWallet(signer, sendBitcoinPSBT);
      const txHex = transaction.toHex();
      const { txHash } = await postTransaction(txHex);
      console.log('send btc hash', txHash);

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

      for (let i = 0; i < sendBitcoinPSBT.txOutputs.length; i++) {
        const output = sendBitcoinPSBT.txOutputs[i];
        if (output.address === address) {
          dispatch(
            addUncofirmedCardinalUTXO({
              status: 'unconfirmed',
              txId: transaction.getId(),
              index: i,
              value: output.value,
              script: output.script.toString('hex'),
              address: output.address,
              type: 'witness_v1_taproot',
            })
          );
        }
      }
    } catch (err) {
      // TODO: handle error
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    const fetchFeeRates = async () => {
      // TODO: fetch fee rates
      setFeeRates([1, 2, 3, 4, 5]);
    };
    fetchFeeRates();
  }, []);

  useEffect(() => {
    const calculateSize = async (cardinalUTXOsToUse) => {
      const { chosenUTXOs, change, feeToPay, totalCost, size } =
        getSendBitcoinTxInfo(
          address,
          addressToSend,
          cardinalUTXOsToUse,
          btcToSatoshis(amount),
          feeRate,
          network
        );
      setChosenUTXOs(chosenUTXOs);
      setChange(change);
      setSize(size);
      setFee(feeToPay);
      setTotalCost(totalCost);
      setLoading(false);
    };
    if (
      cardinalUTXOs &&
      unconfirmedCardinalUTXOs &&
      amount &&
      feeRate &&
      address &&
      addressToSend &&
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
    amount,
    feeRate,
    address,
    addressToSend,
    network,
  ]);

  const openFeeModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <GasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feeRates={feeRates}
        setFeeRate={setFeeRate}
        feeRate={feeRate}
        size={size}
      />
      <Header />
      <CardScreenWrapper>
        <GoBackChevron
          route="/send/bitcoin"
          state={{ amount, address: addressToSend }}
        />
        <img className="w-16 text-white" src={BTCIcon} alt="Bitcoin Icon" />
        <p className="text-white text-2xl font-semibold mt-4 mb-2">
          {amount} BTC
        </p>
        <p className="text-gray-500 text-xs font-500">$56.98</p>
        <SendSummaryCard>
          <div className="flex flex-row justify-between items-center py-2 border-b border-borderColor">
            <p className="text-white font-500 ">To</p>
            <p className="text-gray-400 font-500 ">
              {truncateAddress(addressToSend)}
            </p>
          </div>
          <div className="flex flex-col justify-between items-between py-2 border-b border-borderColor">
            <div className="flex flex-row justify-between items-center">
              <p className="text-white font-500 ">Network Fee</p>
              <div className="flex flex-col justify-start items-end">
                <p className="text-gray-400 font-500">
                  {' '}
                  {satoshisToBTC(fee)} BTC{' '}
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
          <div className="flex flex-row justify-between items-center py-2">
            <p className="text-white font-500 ">Total Amount</p>
            <div className="flex flex-col justify-start items-end">
              <p className="text-gray-400 font-500 ">
                {' '}
                {satoshisToBTC(totalCost)} BTC
              </p>
              <p className="text-gray-500 font-500">$57.5 </p>
            </div>
          </div>
        </SendSummaryCard>
      </CardScreenWrapper>
      <ActionButtons>
        <SendButton
          w={'72'}
          onClick={handleSend}
          disabled={false}
          className={'absolute bottom-10'}
        />
      </ActionButtons>
    </>
  );
};

export default SignBitcoin;
