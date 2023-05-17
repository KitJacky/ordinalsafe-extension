import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetSettings } from '../../store/features/settings';
import { resetAccount } from '../../store/features/account';
import { resetWallet } from '../../store/features/wallet';
import { GoBackChevron } from '../../components/GoBackChevron';
import GenericButton from '../../components/Buttons/GenericButton';
import { resetAuth } from '../../store/features/auth';
import { setLock } from '../../store/features/auth';
import { useNavigate } from 'react-router-dom';

const RemoveWallet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');

  const passwordFromState = useSelector((state) => state.auth.pincode);

  const handleRemoveWallet = () => {
    if (!password) return;
    if (password !== passwordFromState) return;

    dispatch({ type: 'REMOVE_WALLET' });

    window.close();
  };

  return (
    <div className="h-full pt-4 flex flex-col justify-start items-start relative">
      <GoBackChevron route="/settings/wallet" />
      <p className="text-white text-lg font-semibold mb-4 mx-auto">
        Remove Wallet
      </p>

      <p className="text-gray-400 text-xs font-500 mt-4 mb-2 mx-auto">
        Enter your password to remove your wallet from the extension. This
        action cannot be undone. If you want to use this wallet again, you will
        need to import it using your seed phrase.
      </p>
      <input
        type="password"
        placeholder="Enter Password"
        className="text-white w-72 mx-auto h-10 rounded-2xl bg-lightblue px-3 py-2 text-xs placeholder-white hover:bg-lightblue focus:bg-lightblue focus:outline-0"
        onChange={(e) => setPassword(e.target.value)}
      />
      <GenericButton
        text="Remove Wallet"
        className="w-72 font-500 mx-auto my-2 bg-secondary"
        onClick={handleRemoveWallet}
      />
    </div>
  );
};

export default RemoveWallet;
