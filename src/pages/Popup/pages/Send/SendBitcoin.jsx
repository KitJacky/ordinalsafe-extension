import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import AddressSelector from '../../components/AddressSelector';
import AmountSelector from '../../components/AmountSelector';
import ActionButtons from '../../components/ActionButtons';
import GoBackButton from '../../components/Buttons/GoBackButton';
import SendButton from '../../components/Buttons/SendButton';
import Navbar from '../../components/Navbar';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import { GoBackChevron } from '../../components/GoBackChevron';
import BTCIcon from '../../assets/icons/btc.svg';

const SendBitcoin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  let amountLocation = null;
  let addressLocation = '';
  if (location.state) {
    const { amount, address } = location.state;
    amountLocation = amount;
    addressLocation = address;
  }

  const [amount, setAmount] = useState(amountLocation);
  const [address, setAddress] = useState(addressLocation);

  const handleSend = () => {
    navigate('/sign/bitcoin', { state: { amount, address } });
  };

  return (
    <>
      <Header />
      <CardScreenWrapper>
        <GoBackChevron route="/" />
        <p className="text-white text-lg mb-4"> Send Bitcoin </p>
        <img className="w-16 text-white" src={BTCIcon} alt="Bitcoin Icon" />
        <AddressSelector address={address} setAddress={setAddress} />
        <AmountSelector amount={amount} setAmount={setAmount} />
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

export default SendBitcoin;
