import { Dialog } from '@headlessui/react';
import React from 'react';
import GenericButton from '../../components/Buttons/GenericButton';
import ActionButtons from '../../components/ActionButtons';
import { XMarkIcon } from '@heroicons/react/24/outline';
import CardScreenWrapper from '../../components/Wrappers/CardScreenWrapper';
import { GasItem } from '../../components/GasItem';
import { GasCustomItem } from '../../components/GasCustomItem';

const GasModal = ({
  isOpen,
  onClose,
  feeRates,
  feeRate,
  setFeeRate,
  size,
  fee,
}) => {
  return (
    <div
      className={`${
        isOpen ? 'fixed' : 'hidden'
      } w-full h-full bg-center absolute top-0 left-0 z-50`}
    >
      <CardScreenWrapper>
        <XMarkIcon
          className="w-6 text-white absolute left-5 top-4 pt-0.5 cursor-pointer"
          onClick={onClose}
        />
        <p className="text-white text-lg mb-4">Edit Network Fee</p>
        <GasItem
          label="Slow ~3min"
          rate={feeRate}
          sat={feeRates.slow}
          btc="0.0001"
          set={setFeeRate}
        />
        <GasItem
          label="Medium ~2min"
          rate={feeRate}
          sat={feeRates.medium}
          btc="0.0005"
          set={setFeeRate}
        />
        <GasItem
          label="Fast ~1min"
          rate={feeRate}
          sat={feeRates.fast}
          btc="0.001"
          set={setFeeRate}
        />
        <GasCustomItem set={setFeeRate} />
      </CardScreenWrapper>
      <ActionButtons>
        <GenericButton
          text="Save"
          w={'72'}
          onClick={onClose}
          disabled={false}
          className={'absolute bottom-10'}
        />
      </ActionButtons>
    </div>
  );
};

export default GasModal;
