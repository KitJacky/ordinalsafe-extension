import React from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Dropdown from './Generics/Dropdown';
import Logo from '../assets/icon.png';
import SettingsDropdown from './SettingsDropdown';
import { useSelector } from 'react-redux';
import { copyToClipboard, truncateAddress } from '../utils';
import { ChevronDownIcon, ClipboardIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const address = useSelector((state) => state.wallet.activeWallet.address);
  const accountName = useSelector((state) => state.wallet.activeWallet.name);

  return (
    <div className="flex justify-around items-center">
      <img
        src={Logo}
        alt="OrdinalSafe"
        width="40px"
        className="cursor-pointer"
        onClick={() => navigate('/')}
      />{' '}
      {/* TODO: show connected site when clicked, if exists */}
      <p className="w-60 h-8 flex justify-between rounded-xl bg-dropdown font-semibold text-white text-xs border-borderColor border px-2 py-2 text-sm hover:bg-dropdown focus:bg-dropdown focus:outline-0">
        <div>
          <ClipboardIcon
            className="w-4 h-4 text-white font-bold inline-block mr-1 cursor-pointer"
            onClick={() => copyToClipboard(address)}
          />
          {accountName}
          <span className="text-gray-400 pl-1">
            ({truncateAddress(address)})
          </span>
        </div>
        <ChevronDownIcon
          className="w-4 h-4 text-white font-bold inline-block ml-1 cursor-pointer"
          onClick={() => navigate('/accounts')}
        />
      </p>
      <SettingsDropdown />
    </div>
  );
};

export default Header;
