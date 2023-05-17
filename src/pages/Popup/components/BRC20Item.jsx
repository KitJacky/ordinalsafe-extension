import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BRC20Item = ({ item: { name, balance } }) => {
  const [icon, setIcon] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const fetchLogo = async () => {
      const logo = await fetch(
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${name}/logo.png`
      );
      if (logo.status === 200) {
        setIcon(logo.url);
      }
    };
    fetchLogo();
  }, [name]);

  return (
    <div
      className="flex flex-row h-card shrink-0 bg-lightblue rounded-xl my-1 justify-stretch items-center p-2 cursor-pointer"
      onClick={() => navigate('/brc20', { state: { name, balance, icon } })}
    >
      {icon ? (
        <img
          className="w-8 h-8 rounded-full mr-2"
          src={icon}
          alt="BRC20 Icon"
        />
      ) : (
        <div className="w-8 h-8 rounded-full mr-2 bg-secondary flex flex-col justify-center align-center">
          <p className="text-white text-xl font-semibold text-center my-auto mx-auto my-0 py-0">
            {name[0]}
          </p>
        </div>
      )}
      <div className="flex flex-row grow justify-between">
        <p className="text-white text-md font-semibold text-left">{name}</p>
        <p className="text-white text-md font-semibold text-left">{balance}</p>
      </div>
    </div>
  );
};

export default BRC20Item;
