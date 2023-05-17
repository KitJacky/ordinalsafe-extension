import React from 'react';
import { Link, redirect, useNavigate } from 'react-router-dom';
import InitContainer from '../../components/Containers/InitContainer';
import Logo from '../../assets/icon.png';
import GenericButton from '../../components/Buttons/GenericButton';

const NewWallet = () => {
  const navigate = useNavigate();

  return (
    <InitContainer>
      <img src={Logo} alt="Logo" className="w-32" />
      <h1 className="text-white text-3xl font-bold mt-4">OrdinalSafe</h1>
      <p className="text-gray-500 text-xs mt-4">
        The leading ordinals first Bitcoin extension wallet
      </p>
      <GenericButton
        onClick={() => navigate('/init/create-wallet')}
        text="Generate New Wallet"
        className="absolute bottom-24 font-500"
        w={72}
      />
      <GenericButton
        onClick={() => navigate('/init/import-wallet')}
        text="Import Existing Wallet"
        className="absolute bottom-8 font-500 bg-secondary hover:bg-gray-700"
        w={72}
      />
    </InitContainer>
  );
};

export default NewWallet;
