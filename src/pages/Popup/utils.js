import copy from 'copy-to-clipboard';

export const truncateAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const copyToClipboard = (text, showToast = false) => {
  copy(text);

  if (showToast) {
    // TODO: Show a toast message
  }
};

export const validateAddress = (address, network) => {
  try {
    address.toOutputScript(address, network);
    return true;
  } catch (e) {
    return false;
  }
};

export const getMempoolURL = (network = 'mainnet') => {
  return network === 'mainnet'
    ? 'https://mempool.space'
    : 'https://mempool.space/testnet';
};

export const getOrdinalsURL = (network = 'mainnet') => {
  return network === 'mainnet'
    ? 'https://ordinals.com/inscription'
    : 'https://testnet.ordinals.com/inscription';
};

export const btcToSatoshis = (amount) => {
  return Math.round(amount * 100000000);
};

export const satoshisToBTC = (amount) => {
  return amount / 100000000;
};

// IFRAME UTILS

export const size = (size) => {
  switch (size) {
    case 'xs':
      return [80, 80];
    case 'sm':
      return [100, 100];
    case 'md':
      return [120, 120];
    case 'lg':
      return [160, 160];
    case 'xl':
      return [200, 200];
    default:
      return [120, 120];
  }
};

export const imageInHtml = (imageSrc, s = '') => {
  const [width, height] = size(s);
  return (
    `<html><head><style>body {margin: 0 0;width: ${width}px; height: ${height}px; display: flex; align-items: center; box-sizing: border-box; padding: 8px 0;} img {user-drag: none; -webkit-user-drag: none; user-select: none; -moz-user-select: none;  -webkit-user-select: none;-ms-user-select: none;height: 100%; margin: 0 auto; image-rendering: pixelated; overflow-clip-margin: unset;} html {margin-left: auto; margin-right: auto; width: ${width}px; height: ${height}px; text-align: center;}</style></head><body ><img src="` +
    imageSrc +
    '" /></body></html>'
  );
};

export const hexToImgSource = (mimeType, input) =>
  `data:${mimeType};base64,${Buffer.from(input, 'hex').toString('base64')}`;

export const svgToHTML = (input, s = '') => {
  const [width, height] = size(s);
  return `<html><head><style>body {margin: 0 0;width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; padding: 8px 0;} svg {height: 100%} html {margin-left: auto; margin-right: auto; width: ${width}px; height: ${height}px; text-align: center;}</style></head><body>${input}</body></html>`;
};

export const textToHTML = (input, s = '') => {
  const [width, height] = size(s);
  const p = document.createElement('p');
  p.innerText = input;

  let innerHTML = p.innerHTML;
  innerHTML = innerHTML.replaceAll('  ', '&nbsp; ');
  innerHTML = innerHTML.replaceAll('  ', '&nbsp; ');
  return `<html><head><style>body {margin: 0 0;width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center} p {color: white;  font-family: Arial; margin: 0 0; width: ${width}px; overflow: hidden; word-break: break-all}  html {margin-left: auto; margin-right: auto; width: ${width}px; height: ${height}px; text-align: center;}</style></head><body><p>${innerHTML}</p></body></html>`;
};

export const truncate = (str, n) => {
  return str?.length > n ? str.substr(0, n - 1) + '...' : str;
};

export const hexToTextForNonUnicode = (hex) => {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
};

export const hexToText = (hex) => {
  let str;
  try {
    str = decodeURIComponent(hex.replace(/(..)/g, '%$1'));
  } catch (e) {
    str = hexToTextForNonUnicode(hex);
    console.log('invalid hex input: ' + hex);
  }

  return str;
};
