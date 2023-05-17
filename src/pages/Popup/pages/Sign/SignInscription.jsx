import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  getSendInscriptionTxInfo,
  getSendInscriptionTx,
} from '../../../../controllers/TransactionController';
import {
  decryptAddress,
  generateTaprootSigner,
  signPSBTFromWallet,
} from '../../../../controllers/WalletController';
import { postTransaction } from '../../../../controllers/AccountController';
import ActionButtons from '../../components/ActionButtons';
import SendButton from '../../components/Buttons/SendButton';
import Header from '../../components/Header';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import { GoBackChevron } from '../../components/GoBackChevron';
import SendSummaryCard from '../../components/SendSummaryCard';
import { satoshisToBTC, truncateAddress } from '../../utils';
import GasModal from './GasModal';
import {
  addSpentInscriptionId,
  addSpentCardinalUTXO,
  addUncofirmedCardinalUTXO,
} from 'store/features/account';
import InscriptionContent from '../../components/InscriptionContent';

const SignInscription = () => {
  const dispatch = useDispatch();

  const { state } = useLocation();
  const { inscriptionDetails, address: addressToSend } = state;

  const cardinalUTXOs = useSelector((state) => state.account.cardinalUTXOs);
  const ordinalUTXOs = useSelector((state) => state.account.ordinalUTXOs);
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
  const xOnlyPubkey = useSelector(
    (state) => state.wallet.activeWallet.xOnlyPubKey
  );
  const network = useSelector((state) => state.settings.network);

  const [size, setSize] = useState(0);
  const [fee, setFee] = useState(0);
  const [feeRate, setFeeRate] = useState(0);
  const [feeRates, setFeeRates] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [change, setChange] = useState(0);
  const [chosenUTXOs, setChosenUTXOs] = useState([]);
  // TODO: use feePaidFromInscription to show the user
  // it's free to send when inscription postage is big enough
  const [feePaidFromInscription, setFeePaidFromInscription] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const sendInscriptionPSBT = getSendInscriptionTx(
        address,
        addressToSend,
        chosenUTXOs,
        change,
        xOnlyPubkey,
        network
      );
      const walletNode = decryptAddress(
        encryptedPrivKey,
        encryptedChainCode,
        pincode,
        network
      );
      const signer = generateTaprootSigner(walletNode);
      const transaction = signPSBTFromWallet(signer, sendInscriptionPSBT);
      const txHex = transaction.toHex();
      const { txHash } = await postTransaction(txHex);
      console.log('send inscription tx hash: ', txHash);
      // TODO: get unconfirmed UTXOS

      if (chosenUTXOs.length > 1) {
        chosenUTXOs.forEach((utxo) => {
          dispatch(
            addSpentCardinalUTXO({
              txId: utxo.txId,
              index: utxo.index,
              value: utxo.value,
            })
          );
        });
      }

      dispatch(addSpentInscriptionId(inscriptionDetails.id));

      // here we start from 1 bc the first output is the inscription
      // we don't want to do anything with it, dangerous
      for (let i = 1; i < sendInscriptionPSBT.txOutputs.length; i++) {
        const output = sendInscriptionPSBT.txOutputs[i];
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
      // update storage accordingly
      // then update transactions
    } catch (err) {
      // TODO: handle error
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
    const calculateSize = async (usableCardinlUTXOs) => {
      const {
        chosenUTXOs,
        change,
        size,
        feeToPay,
        totalCost,
        feePaidFromInscription,
      } = getSendInscriptionTxInfo(
        address,
        addressToSend,
        usableCardinlUTXOs,
        ordinalUTXOs,
        inscriptionDetails.id,
        feeRate,
        network
      );
      setChosenUTXOs(chosenUTXOs);
      setChange(change);
      setSize(size);
      setFee(feeToPay);
      setTotalCost(totalCost);
      setFeePaidFromInscription(feePaidFromInscription);
      setLoading(false);
    };
    if (
      cardinalUTXOs &&
      unconfirmedCardinalUTXOs &&
      ordinalUTXOs &&
      inscriptionDetails.id &&
      feeRate &&
      address &&
      addressToSend &&
      network
    ) {
      calculateSize(cardinalUTXOs).catch((err) => {
        console.log('Only confirmed utxos:', err);
        calculateSize(cardinalUTXOs.concat(unconfirmedCardinalUTXOs)).catch(
          (err) => {
            // TODO: handle error
            console.log('Confirmed and unconfirmed utxos:', err);
            setLoading(false);
          }
        );
      });
    }
  }, [
    cardinalUTXOs,
    unconfirmedCardinalUTXOs,
    ordinalUTXOs,
    inscriptionDetails.id,
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
          route="/send/inscription"
          state={{ inscriptionDetails, address: addressToSend }}
        />
        <InscriptionContent
          inscription={inscriptionDetails}
          className="w-40 h-28 rounded-lg my-2"
          size="sm"
        />
        <p className="text-white text-sm font-semibold mb-2">
          ID ({truncateAddress(inscriptionDetails.id)})
        </p>
        <SendSummaryCard>
          <div className="flex flex-row justify-between items-center py-2 border-b border-borderColor">
            <p className="text-white font-500 ">To</p>
            <p className="text-gray-400 font-500 ">
              {truncateAddress(addressToSend)}
            </p>
          </div>
          <div className="flex flex-col justify-between items-between py-2">
            <div className="flex flex-row justify-between items-center">
              {/* TODO: if fee paid from inscription show fee as 0 */}
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
          {/* TODO: if fee not paid from inscription show total cost */}
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

export default SignInscription;
