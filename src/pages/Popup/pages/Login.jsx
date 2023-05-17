import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  canDecrypt,
  decryptMasterNode,
  generateWallet,
} from 'controllers/WalletController';
import { setLock, setPincode } from '../store/features/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { store } from '../store';
import { addWallet, setActiveWallet } from '../store/features/wallet';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import PasswordInput from '../components/PasswordInput';
import LoginButton from '../components/Buttons/LoginButton';
import Logo from '../assets/icon.png';
import InitContainer from '../components/Containers/InitContainer';

const Login = () => {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const encryptedMasterNode = useSelector(
    (state) => state.wallet.encryptedMasterNode
  );

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError('');

    try {
      const canDecryptWallet = canDecrypt(encryptedMasterNode, password);
      if (canDecryptWallet) {
        if (store.getState().wallet.wallets.length === 0) {
          // first time login after migration
          console.log(
            'first time login after migration, setting pincode and wallet'
          );

          const masterNode = decryptMasterNode(
            encryptedMasterNode,
            store.getState().wallet.encryptedChainCodeMasterNode,
            password
          );

          const wallet = generateWallet(masterNode, password);

          dispatch(addWallet(wallet));
        }

        dispatch(setPincode(password));
        dispatch(setLock(false));

        if (state && state.from) {
          const path = state.from;
          if (path) navigate(path);
          else navigate('/');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <InitContainer>
      <img src={Logo} alt="logo" className="w-24 mb-4 opacity-30" />
      <p className="text-white text-xl font-500 mb-8 mt-4">
        Enter your password
      </p>
      <PasswordInput
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
      />
      {/* Fix button to bottom */}
      <LoginButton
        onClick={handleLogin}
        w={72}
        className={'absolute bottom-8'}
      />
    </InitContainer>
  );
};

export default Login;
