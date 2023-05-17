import React from 'react';
import { openTab } from 'shared/helpers';
import InitContainer from '../components/Containers/InitContainer';
import Logo from '../assets/icon.png';
import GenericButton from '../components/Buttons/GenericButton';

const NewWalletPopup = () => {
  const initFlow = (tab) => {
    openTab(tab);
    window.close();
  };

  return (
    <InitContainer>
      <img src={Logo} alt="Logo" className="w-32" />
      <h1 className="text-white text-3xl font-bold mt-4">OrdinalSafe</h1>
      <p className="text-gray-500 text-xs mt-4">
        The leading ordinals first Bitcoin extension wallet
      </p>
      <GenericButton
        onClick={() => initFlow('init/new-wallet')}
        text="Get Started!"
        className="absolute bottom-24 font-500"
        w={72}
      />
    </InitContainer>
  );
};

export default NewWalletPopup;
