import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLock } from '../store/features/auth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BitcoinBalance from '../components/BitcoinBalance';
import ActionButtons from '../components/ActionButtons';
import ReceiveButton from '../components/Buttons/ReceiveButton';
import SendButton from '../components/Buttons/SendButton';
import BRC20List from '../components/BRC20List';
import Navbar from '../components/Navbar';
import InscriptionList from '../components/InscriptionList';

const Inscriptions = () => {
  return (
    <>
      <Header />
      <h1 className="text-white text-lg font-semibold my-2">Inscriptions</h1>
      <InscriptionList />
      <Navbar />
    </>
  );
};

export default Inscriptions;
