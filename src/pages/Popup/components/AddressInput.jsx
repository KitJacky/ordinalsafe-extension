import React from 'react';

const AddressInput = ({ address, setAddress }) => {
  return (
    <div className="flex flex-col justify-start items-start mb-8 -mt-4">
      <label for="address" className="mb-1 text-gray-500 font-500">
        Address
      </label>
      <input
        type="text"
        id="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        autoComplete="off"
        className="text-white w-72 h-10 ml-1 rounded-2xl bg-lightblue px-3 py-2 text-xs placeholder-white hover:bg-lightblue focus:bg-lightblue focus:outline-0"
        placeholder=""
      />
    </div>
  );
};

export default AddressInput;
