/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/Popup/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E65F3',
        secondary: '#353951',
        dropdown: 'rgba(36, 38, 56, 0.7);',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        lightblue: '#242638',
        customDark: '#161920',
        screen:
          'linear-gradient(180deg, rgba(36, 38, 56, 0) 0%, #242638 143.4%);',
      },
      height: {
        card: '70px',
        screen: '450px',
        cardScreen: '306px',
        activity: '450px',
        window: '600px',
      },
      minHeight: {
        activity: '450px',
      },
      maxHeight: {
        inscriptions: '420px',
        activity: '450px',
      },
      width: {
        button: '40px',
        window: '360px',
      },
      fontWeight: {
        500: 500,
      },
      backgroundImage: {
        screen:
          'linear-gradient(180deg, rgba(36, 38, 56, 0) 0%, #242638 143.4%);',
        center: 'linear-gradient(345.55deg, #161A25 4.75%, #161822 100.57%);',
        mnemonic:
          'linear-gradient(180deg, rgba(36, 38, 56, 0) 0%, #242638 143.4%);',
      },
    },
  },
  plugins: [],
};
