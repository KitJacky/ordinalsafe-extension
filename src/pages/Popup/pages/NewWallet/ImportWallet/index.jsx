import React, { useState, useEffect } from 'react';
import {
  generateSeed,
  generateMasterNode,
  generateWallet,
  encryptMnemonic,
  encryptMasterNode,
} from 'controllers/WalletController';
import { useDispatch } from 'react-redux';
import { initWallet } from 'store/features/wallet';
import { setLock, setPincode } from 'store/features/auth';
import CreateWalletContainer from '../../../components/Containers/CreateWalletContainer';
import GenericButton from '../../../components/Buttons/GenericButton';
import ChooseWallet from './ChooseWallet';
import ImportMnemonic from './ImportMnemonic';
import SetPassword from '../CreateWallet/SetPassword';
import FinishFlow from '../CreateWallet/FinishFlow';

const ImportWallet = () => {
  const dispatch = useDispatch();

  const [step, setStep] = useState(0);

  const [walletType, setWalletType] = useState('OrdinalSafe');

  const [mnemonic, setMnemonic] = useState(Array(12).fill(''));
  const [seed, setSeed] = useState('');

  const [emptyWords, setEmptyWords] = useState(['', '', '', '']);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  const nextStep = () => {
    if (step === 2) {
      if (!completeCreateWalletFlow()) return;
    } else if (step === 3) {
      // close tab
      window.close();
    }
    setStep(step + 1);
  };

  const completeCreateWalletFlow = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setLoading(true);
    setError('');
    try {
      const seed = generateSeed(mnemonic.join(' '));

      const masterNode = generateMasterNode(seed);

      const wallet = generateWallet(masterNode, password);

      const encryptedMnemonic = encryptMnemonic(mnemonic.join(' '), password);
      const {
        encrypted: encryptedMasterNode,
        encryptedChainCode: encryptedChainCodeMasterNode,
      } = encryptMasterNode(masterNode, password);

      dispatch(
        initWallet({
          wallet,
          encryptedMnemonic,
          encryptedMasterNode,
          encryptedChainCodeMasterNode,
        })
      );

      dispatch(setLock(false));
      dispatch(setPincode(password));

      setStep(3);
    } catch (e) {
      console.log(e);
      setError('An error occured, please try again');
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  };

  return (
    <CreateWalletContainer>
      <div className="flex flex-row justify-around items-center mt-4">
        {/* circle */}
        {[...Array(step + 1)].map((_, index) => {
          return (
            <div
              key={index}
              className="w-4 h-4 rounded-full bg-primary z-10"
            ></div>
          );
        })}
        {[...Array(3 - step)].map((_, index) => {
          return (
            <div
              key={index}
              className="w-4 h-4 rounded-full bg-gray-800 z-10"
            ></div>
          );
        })}
        {/* line goes through these three */}
        <div className="w-60 h-1 rounded-full bg-gray-800 absolute z-0"></div>
      </div>
      {step === 0 && (
        <ChooseWallet walletType={walletType} setWalletType={setWalletType} />
      )}
      {step === 1 && (
        <ImportMnemonic mnemonic={mnemonic} setMnemonic={setMnemonic} />
      )}
      {step === 2 && (
        <SetPassword
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
        />
      )}
      {step === 3 && <FinishFlow />}
      {error && <div>{error}</div>}
      {loading && <div>Loading...</div>}
      <GenericButton
        text={step === 3 ? 'Finish' : 'Next'}
        onClick={nextStep}
        disabled={loading}
        w={72}
        className="absolute bottom-8 right-8"
      />
    </CreateWalletContainer>
  );
};

export default ImportWallet;
