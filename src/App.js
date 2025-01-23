import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import './App.css';
import backimg from './images/backimg.png';
import slogo from './images/slogo.webp';
import slogox from './images/slogox.webp';
import heroback from './images/herobackx.webp';
import samhero2 from './images/samhero2.webp';
import image1 from './images/image1.webp';
import image2 from './images/image2.webp';



const App = () => {
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [rate, setRate] = useState(0);
  const [availableTokens, setAvailableTokens] = useState(0);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [timeLeft, setTimeLeft] = useState({});
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [message, setMessage] = useState("");
  

  
  const presaleStartDate = new Date('2025-01-26T00:00:00'); // Adjust to your presale start time

  

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = presaleStartDate - now;
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        setPresaleStarted(true);
        return {};
      }
    };
  
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
  
    return () => clearInterval(timer);
  }, [presaleStartDate]);
 

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    } else {
      alert('Please install MetaMask to use this dApp.');
    }
    
  }, []);

  const addedTokens = new Set(); // Keeps track of added tokens
  
  const addTokenToWallet = async () => {
    const tokenAddress = "0x9968eF966eb7D6Af43c9cF566012CA7a3233aFDc";
  
    // Validate the token address
    if (!tokenAddress) {
      alert("Invalid token address.");
      return;
    }
  
    // Check if the token is already added
    if (addedTokens.has(tokenAddress.toLowerCase())) {
      alert("Token is already added to your wallet!");
      return;
    }
  
    // Ensure Ethereum wallet is available
    if (!window.ethereum) {
      alert("MetaMask or another Ethereum wallet is not installed.");
      return;
    }
  
    try {
      const tokenDetails = {
        type: "BEP20", // Token standard for Binance Smart Chain
        options: {
          address: tokenAddress, // Token contract address
          symbol: "RPY", // Token symbol
          decimals: 18, // Token decimals
        },
      };
  
      // Request the user to add the token
      const success = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: tokenDetails,
      });
  
      if (success) {
        alert("Token added successfully!");
        addedTokens.add(tokenAddress.toLowerCase()); // Record the token as added
      } else {
        alert("User rejected the token addition.");
      }
    } catch (error) {
      
    }
  };
  



  

  const connectWallet = async () => {
    if (!web3) return alert('Web3 is not initialized.');

    if (loadingAccount) return; // Prevent multiple calls

    setLoadingAccount(true);
    try {
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoadingAccount(false);
    }
  };

  
  const verifyPaymentOnServer = async (paymentId) => {
    try {
      const response = await axios.post("http://localhost:5000/verify-payment", {
        paymentId,
      });
      return response.data.success; // Assuming the server returns a `success` field
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    }
  };
  
  const addNetwork = async () => {
    if (window.ethereum) {
      const bscNetwork = {
        chainId: "0x38", // 56 in decimal
        chainName: "Binance Smart Chain",
        nativeCurrency: {
          name: "Binance Coin",
          symbol: "BNB",
          decimals: 18,
        },
        rpcUrls: ["https://bsc-dataseed.binance.org/"],
        blockExplorerUrls: ["https://bscscan.com"],
      };
  
      try {
        // Attempt to switch to the BSC network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: bscNetwork.chainId }],
        });
        alert("Switched to Binance Smart Chain network successfully!");
      } catch (error) {
        if (error.code === 4902) {
          // If the network is not added, add it
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [bscNetwork],
            });
            alert("Binance Smart Chain network added successfully!");
          } catch (addError) {
            console.error("Failed to add the network:", addError);
            alert("Failed to add the Binance Smart Chain network. Please try again.");
          }
        } else {
          console.error("Failed to switch to the network:", error);
          alert("Failed to switch to the Binance Smart Chain network. Please try again.");
        }
      }
    } else {
      alert("MetaMask or another Ethereum wallet is not installed.");
    }
  };
  


  const sendtokens = async () => {

    try {
      setMessage("Processing...");
      const response = await axios.post("http://localhost:3000/api/sendTokens", {
        account,
        buyAmount,
      });

      if (response.data.success) {
        setMessage(`Tokens sent successfully! Transaction Hash: ${response.data.txHash}`);
      } else {
        setMessage(`Error: ${response.data.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

  }

  
  const handlePayment = async () => {
   
    if (!buyAmount) {
      alert("Please enter a valid amount.");
      return;
    }
    if (buyAmount <= 1) {
      alert('Minimum buy amount is 200');
      return;
    }
    if (isNaN(buyAmount)) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!web3 || !account) {
      alert("Please connect your wallet first.");
      
      return;
    }
   
    try {
      // Start both operations concurrently
      await Promise.all([
        addNetwork(),
        addTokenToWallet()
      ]);
  
      alert("Network added and token added to wallet successfully!");
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred while performing the operations.");
    }

    const options = {
      key: "rzp_live_CUPDP0bFzjbvdn", // Replace with your Razorpay live key
      amount: buyAmount * 100, // Convert amount to paise
      currency: "INR",
      name: "Rupaiya Token",
      description: "Token Purchase",
      handler: async function (response) {
        console.log("Razorpay Payment ID:", response.razorpay_payment_id);
  
        // Optionally send response.razorpay_payment_id to the backend for server-side validation
        const isVerified = await verifyPaymentOnServer(response.razorpay_payment_id);
        if (isVerified) {

          sendtokens();
        } else {
          alert("Payment verification failed. Please try again.");
        }
      },
      prefill: {
        name: "Your Name",
        email: "your-email@example.com",
        contact: "9876543210",
      },
      notes: {
        address: "Rupaiya Token Office",
      },
      theme: {
        color: "#3399cc",
      },
    };
  
    const rzp = new window.Razorpay(options);
    rzp.open();
    
    
  };
  

  return (

   
    <div className="body">
   
   <div class="tiranga-bar">
        <div class="saffron"></div>
        <div class="white"></div>
        <div class="green"></div>
    </div>

  
    <header class="header">
        <div class="site-info">
            <img src={slogo} alt="Site Icon" className="imglogo"/>
            <h1>Reserve Your Rupaiya – Presale Starts 26 January!</h1>
        </div>
        <button onClick={connectWallet} disabled={loadingAccount || account}>
  {loadingAccount ? 'Connecting...' : account ? 'Connected' : 'Connect Wallet'}
</button>

    </header>

    {!presaleStarted && (
        <div className="countdown-timer">
          <h2>Presale will starts in</h2>
          <p>
            {timeLeft.days || 0} Days, {timeLeft.hours || 0} Hours, {timeLeft.minutes || 0} Minutes,{' '}
            {timeLeft.seconds || 0} Seconds
          </p>
        </div>
      )}

        <div className="backimg">
        <img src={backimg} alt="Girl in a jacket" width="100%" height="100%"/>
        </div>


        <div className="sam">
          <div className="side-imagex" >
  <img src={slogox} alt="sideby" className="side-image" />
  </div>
  <header className="App-header">
    <h1>Rupaiya Token Presale</h1>
    <p>Current Account: {account}</p>
    <div className="presale-info">
      <p>Token Rate: 10 RPY per 1 INR</p>
   
    </div>
    {presaleStarted ? (
            <div className="purchase-section">
              <input
                type="text"
                placeholder="Enter INR amount"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
              />
              <button onClick={handlePayment}>Buy Tokens</button>
              {message && <p>{message}</p>}
             
            </div>
          ) : (
            <p>Presale is not open yet. Please wait for 26th January.</p>
          )}
        </header>
      </div>
<hr/>

      <div class="container">
      <img src={heroback} alt="Girl in a jacket" className="heroback" width="100%" height="100%"/>
        <div class="text-below">
          <p>The Rupaiya Token embodies the spirit of India, celebrating its rich heritage, modern advancements, and unwavering strength. As a tribute to the pillars of our nation—farmers, business leaders, and soldiers—our presale campaign showcases the unity that drives progress.</p>
          <p>Rupaiya Token is not just a cryptocurrency; it’s a movement to bring India’s communities together, leveraging the power of blockchain to create a brighter, more connected future. By investing in Rupaiya Token, you’re contributing to a vision of financial empowerment, innovation, and national pride.</p>
          <p>Be part of this journey on 26th January. Let’s build a future where tradition meets technology and unity drives prosperity.</p>
        </div>
      </div>
<hr/>
      
      <div className="sam1">
          
  <header className="App-header1">
    <h2>Introducing Rupaiya: Revolutionizing the Indian Crypto Market</h2>
    <p>Rupaiya is set to change the way Indians interact with digital finance. Launching on 26th January 2025, Rupaiya aims to become a trusted, secure, and accessible cryptocurrency for the masses, backed by innovative technology and a deep understanding of the Indian market's unique needs.</p>
   <p>Whether you’re new to cryptocurrency or an experienced investor, Rupaiya is designed to offer everyone a chance to be a part of this digital revolution.</p>
   <p>Rupaiya is more than just a cryptocurrency; it’s a vision for a more inclusive, secure, and efficient financial system in India. Get ready to experience the future of money with Rupaiya.</p>
   <p>We are excited to have you on this journey with us as we take a significant step towards reshaping India’s financial landscape.</p>
  </header>
  <div className="side-imagex1" >
  <img src={slogo} alt="sideby" className="side-image1" />
  </div>
</div>
<hr/>
<div className="sam2">
          <div className="side-imagex2" >
  <img src={image1} alt="sideby" className="side-image2" />
  </div>
  <header className="App-header2">
  <h2>Why Rupaiya?</h2>
  <h3>1. Focused on the Indian Market:</h3>
    <p>Rupaiya is tailor-made for the Indian ecosystem, addressing the specific needs of Indian investors and businesses.</p>
   <p>Our vision is to empower people to make secure, fast, and cost-efficient transactions with cryptocurrency, all while staying true to India's values and traditions.</p>
  <h3>2. Affordable and Accessible:</h3>
  <p>We want cryptocurrency to be accessible to everyone.</p>
  <p>Rupaiya’s affordable pricing and intuitive platform allow even first-time users to get started with ease, regardless of their financial background.</p>
  <h3>3. Empowering Financial Inclusion:</h3>
  <p>With India’s vast unbanked population, Rupaiya seeks to bridge the gap by providing access to decentralized financial systems.</p>
  <p> This can help drive growth in sectors like remittances, microtransactions, and digital savings.</p>
   
  </header>
</div>
<hr/>
<div className="sam3">
         
  <header className="App-header3">
  <h2>Key Features of Rupaiya</h2>
    <h3>1. Fast Transactions:</h3>
    <p>Say goodbye to long processing times. Rupaiya transactions are fast, with payments being processed almost instantly, whether for remittances, payments, or digital goods.</p>
  <h3>2. Low Transaction Fees:</h3>
  <p>Rupaiya ensures that transaction fees are kept low, allowing you to save money with every transfer or purchase. This makes it ideal for everyday use, from paying for services to buying goods online.</p>
  <h3>3. Strong Security:</h3>
  <p>Your security is our top priority. Rupaiya uses state-of-the-art blockchain technology, ensuring all transactions are encrypted and tamper-proof. We also provide multi-layered security protocols to keep your assets safe.</p>
  <h3>4. Scalability & Efficiency:</h3>
  <p>Rupaiya’s network is designed to handle high transaction volumes, ensuring the system remains efficient even as adoption grows.</p>
  
  </header>
  <div className="side-imagex3" >
  <img src={image2} alt="sideby" className="side-image3" />
  </div>
</div>
      
      
      <footer>
 
  <div class="contact-section">
    <div>
      <p><strong>Rupaiya Token HQ</strong>22, Bannerghatta Rd, Sarakki Industrial Layout, 3rd Phase, J. P. Nagar, Bengaluru, Karnataka 560076</p>
      <p>Email: <a href="mailto:support@rupaiyatoken.in">support@rupaiyatoken.in</a></p>
      <p>Phone: +91 98765 43210</p>
    </div>
  </div>


  <div class="bottom-section">
    <p>&copy; 2025 Rupaiya Token. All Rights Reserved.</p>
  </div>
</footer>


      
     
    </div>
  );
};

export default App;
