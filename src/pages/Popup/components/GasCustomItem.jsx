import { ChevronRightIcon } from '@heroicons/react/20/solid';
import React, { useState } from 'react';

export const GasCustomItem = ({ set }) => {
  const [sat, setSat] = useState();

  const handleChange = (e) => {
    if (isNaN(e.target.value)) return;
    setSat(e.target.value);
    set(e.target.value);
  };

  return (
    <div className="flex flex-row h-16 w-72 shrink-0 bg-lightblue rounded-xl my-2 justify-between items-center py-2 px-4 cursor-pointer">
      <p className="text-white text-md font-semibold text-left">Custom</p>
      <input
        autoComplete="off"
        className="text-white w-20 text-right h-10 ml-1 rounded-2xl bg-lightblue px-3 py-2 text-xs placeholder-white hover:bg-lightblue focus:bg-lightblue focus:outline-0"
        type="text"
        value={sat}
        onChange={handleChange}
      />
    </div>
  );
};
