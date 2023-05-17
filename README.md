<img src="src/assets/img/icon-128.png" width="64"/>

# OrdinalSafe Extension

:warning: This version (0.1.0.0) of OrdinalSafe is still in development and is not production ready. Release is estimated around early June 2023. Until then, current versions of OrdinalSafe are available on the [Chrome Web Store](https://chrome.google.com/webstore/detail/ordinalsafe/coefgobimbelhfmhkpndlddjhkphgnep). :warning:

You can still use this repository to build your own version of OrdinalSafe but it is not recommended for production / mainnet use. Please wait for the stable version to local builds.

## Procedures for development:

1. Check if your [Node.js](https://nodejs.org/) version is >= **18**.
2. Run `npm install` to install the dependencies.
3. Run `npm start`
4. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.
5. Happy hacking.

## Packing

After the development of your extension run the command

```
$ NODE_ENV=production npm run build
```

## Resources:

- [Webpack documentation](https://webpack.js.org/concepts/)
- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)

## License

See [LICENSE](LICENSE).

---

**[OrdinalSafe](https://ordinalsafe.xyz) is developed by [Chainway](https://chainway.xyz) :heart:**
