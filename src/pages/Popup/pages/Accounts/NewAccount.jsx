import React, { useState } from 'react';
import {
  canDecrypt,
  decryptMasterNode,
  generateWallet,
} from 'controllers/WalletController';
import { useNavigate } from 'react-router-dom';
import { addWallet, setActiveWallet } from 'store/features/wallet';
import Logo from '../../assets/icon.png';
import { SettingsItem } from '../../components/SettingsItem';
import { CloseCross } from '../../components/CloseCross';
import GenericButton from '../../components/Buttons/GenericButton';
import AccountNameInput from '../../components/AccountNameInput';
import { useDispatch, useSelector } from 'react-redux';

const NewAccount = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const encryptedMasterNode = useSelector(
    (state) => state.wallet.encryptedMasterNode
  );
  const encryptedChainCodeMasterNode = useSelector(
    (state) => state.wallet.encryptedChainCodeMasterNode
  );
  const password = useSelector((state) => state.auth.pincode);
  const index = useSelector((state) => state.wallet.wallets.length);

  const createAccount = () => {
    const masterNode = decryptMasterNode(
      encryptedMasterNode,
      encryptedChainCodeMasterNode,
      password
    );

    const wallet = generateWallet(masterNode, password, name, index);

    dispatch(addWallet(wallet));
    dispatch(setActiveWallet(wallet.address));

    // TODO: show toast
    navigate('/');
  };

  return (
    <div className="h-screen pt-4 flex flex-col justify-start items-center relative">
      <CloseCross />
      <p className="text-white text-lg font-semibold mb-4 mx-auto">
        New Account
      </p>
      <img
        src={Logo}
        alt="logo"
        className="w-20 h-20 mx-auto mt-28 opacity-40"
      />
      <AccountNameInput name={name} setName={setName} />
      <GenericButton
        text="Create Account"
        className="w-72 font-500 my-2" // TODO: move this to the bottom of the screen
        onClick={createAccount}
      />
    </div>
  );
};

export default NewAccount;
