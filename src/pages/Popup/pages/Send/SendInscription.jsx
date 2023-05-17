import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import { GoBackChevron } from '../../components/GoBackChevron';
import ActionButtons from '../../components/ActionButtons';
import { truncateAddress } from '../../utils';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import AddressSelector from '../../components/AddressSelector';
import SendButton from '../../components/Buttons/SendButton';
import InscriptionContent from '../../components/InscriptionContent';

const SendInscription = () => {
  const { state } = useLocation();
  const { inscriptionDetails } = state;

  const navigate = useNavigate();

  const [address, setAddress] = useState('');

  // TODO: add contacts component. It fetchs contacts from the state and allows to select one. or input address manually. return address to this components

  const getAddressToSend = (address) => {
    setAddress(address);
  };

  const handleSend = () => {
    navigate('/sign/inscription', { state: { inscriptionDetails, address } });
  };

  return (
    <>
      <Header />
      <CardScreenWrapper>
        <GoBackChevron
          route="/inscription"
          state={{ inscriptionId: inscriptionDetails.id }}
        />
        <p className="text-white my-2">Send Inscription</p>
        <InscriptionContent
          inscription={inscriptionDetails}
          className="w-60 h-32 rounded-lg my-2"
        />
        <p className="text-white my-2">
          ID ({truncateAddress(inscriptionDetails.id)}){' '}
          <ClipboardDocumentIcon className="w-4 inline-block" />
        </p>
        <AddressSelector address={address} setAddress={setAddress} />
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

export default SendInscription;
