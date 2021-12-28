import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import myEpicNft from "./utils/MyEpicNFT.json";
// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0xD198A59A4125d409cCc666551a9a36D496a25803";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [count, setCount] = useState(0);
  const [minting, setMinting] = useState(false);
  const [alertHead, setAlertHead] = useState(false);
  const [alertText, setAlertText] = useState("");

  const [opensea, setOpensea] = useState("");
  const [etherscan, setEtherscan] = useState("");
  const [buttonText, setButtonText] = useState("Mint NFT💎");
  const getCount = async () => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const connectedContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicNft.abi,
      signer
    );

    let c = await connectedContract.getCount();
    console.log(c.toString());
    setCount(c.toString());
  };

  const checkNetwork = async () => {
    const { ethereum } = window;

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      setAlertHead(true);
      setAlertText("You are not connected to the Rinkeby Test Network!");
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      setAlertHead(true);
      setAlertText("Get MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    /*
     * Check if we're authorized to access the user's wallet
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    /*
     * User can have multiple authorized accounts, we grab the first one if its there!
     */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      checkNetwork();
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setAlertHead(true);
        setAlertText("Get MetaMask!");
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      checkNetwork();
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } catch (error) {
      console.log(error);
      setAlertText("Unable to connect Wallet");
      setAlertHead(true);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          getCount();
          setOpensea(
            `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });
        getCount();
        console.log("Setup event listener!");
      } else {
        setAlertText("Ethereum object doesn't exist!");
        setAlertHead(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      setEtherscan("");
      setOpensea("");
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");

        setButtonText("Opening Metamask");
        let nftTxn = await connectedContract.makeAnEpicNFT();
        setButtonText("Mint NFT💎");
        setMinting(true);
        console.log("Mining...please wait.");
        setAlertHead(false);

        await nftTxn.wait();
        setEtherscan(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        setMinting(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setMinting(false);
      setAlertText("Try Again Later");
      setAlertHead(true);
    }
  };
  // Render Methods
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setAlertHead(false);
    }, 10000);
  }, [alertHead]);

  return (
    <div className="App">
      <div className="container">
        <div className={`fixed-container ${alertHead ? "add-alert" : ""}`}>
          <p>{alertText}</p>
        </div>
        {/* <button onClick={() => setAlertHead(true)}>alert</button> */}
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          {currentAccount && (
            <div className="acc-details">
              <p className="address">Account:{currentAccount}</p>
              <p className="address">Your NFTs:{count}/50</p>
            </div>
          )}
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button
              onClick={askContractToMintNft}
              className={`cta-button connect-wallet-button ${
                minting ? "minting" : ""
              }`}
            >
              {minting ? `Minting..⛏️` : buttonText}
            </button>
          )}
          {opensea && (
            <div
              className={`mined-details ${etherscan ? "mined-animation" : ""}`}
            >
              {etherscan && (
                <a className="external-links" href={etherscan} target="_blank">
                  Transaction🚀
                </a>
              )}
              <br />
              {opensea && (
                <a className="external-links" href={opensea} target="_blank">
                  Opensea 🌊
                </a>
              )}
            </div>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
