import React from 'react';
import { useSelector } from 'react-redux';
import InscriptionItem from './InscriptionItem';
import InscriptionsLogo from '../assets/icons/empty_inscriptions.svg';

const InscriptionList = () => {
  const inscriptions = useSelector((state) => state.account.inscriptionIds);

  return (
    <>
      {inscriptions && inscriptions.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-screen">
          <img
            className="w-24 text-gray-500"
            src={InscriptionsLogo}
            alt="Inscriptions Icon"
          />
          <p className="text-gray-600 text-md mt-6">
            Your Inscriptions will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-full max-h-inscriptions overflow-y-scroll overflow-x-hidden py-2">
          {inscriptions.map((id) => {
            return <InscriptionItem inscriptionId={id} key={id} />;
          })}
        </div>
      )}
    </>
  );
};

export default InscriptionList;
