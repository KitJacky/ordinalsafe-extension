import React, { useState } from 'react';
import {
  canDecrypt,
  decryptMasterNode,
  generateWallet,
} from 'controllers/WalletController';
import { useNavigate } from 'react-router-dom';
import Logo from '../../../assets/icon.png';
import { SettingsItem } from '../../../components/SettingsItem';
import { CloseCross } from '../../../components/CloseCross';
import GenericButton from '../../../components/Buttons/GenericButton';
import AccountNameInput from '../../../components/AccountNameInput';
import AddressInput from '../../../components/AddressInput';
import { useDispatch, useSelector } from 'react-redux';
import { addContact } from 'store/features/settings';

const NewContact = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const createContact = () => {
    const contact = {
      name,
      address,
    };

    dispatch(addContact(contact));

    // TODO: show toast
    navigate('/settings/contacts');
  };

  return (
    <div className="h-window pt-4 flex flex-col justify-start items-center relative">
      <CloseCross />
      <p className="text-white text-lg font-semibold mb-4 mx-auto">
        New Contact
      </p>
      <img
        src={Logo}
        alt="logo"
        className="w-20 h-20 mx-auto mt-28 opacity-40"
      />
      <AccountNameInput name={name} setName={setName} />
      <AddressInput address={address} setAddress={setAddress} />
      <GenericButton
        text="Create Contact"
        className="w-72 font-500 my-2 absolute bottom-10" // TODO: move this to the bottom of the screen
        onClick={createContact}
      />
    </div>
  );
};

export default NewContact;
