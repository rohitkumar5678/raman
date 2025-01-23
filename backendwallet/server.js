require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Load environment variables
const privateKey = process.env.PRIVATE_KEY;
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const rpcUrl = process.env.RPC_URL;

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Define ERC20 ABI
const tokenABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_delegate","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_delegate","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_receiver","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];

// Initialize contract instance
const tokenContract = new ethers.Contract(tokenContractAddress, tokenABI, wallet);

// Function to send tokens
const sendTokens = async (to, amountInINR) => {
  try {
    const rate = 10; // 1 INR = 10 Rupaiya tokens
    const decimals = await tokenContract.decimals();
    const tokenAmount = ethers.utils.parseUnits((amountInINR * rate).toString(), decimals);

    console.log(`Sending ${amountInINR} INR worth of tokens (${tokenAmount.toString()} tokens)`);

    const tx = await tokenContract.transfer(to, tokenAmount);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait(); // Wait for the transaction to be mined
    console.log("Transaction confirmed:", receipt.transactionHash);

    return { success: true, txHash: receipt.transactionHash };
  } catch (err) {
    console.error("Error sending tokens:", err);
    return { success: false, error: err.message };
  }
};

// API Endpoint to handle token transfers
app.post("/api/sendTokens", async (req, res) => {
  const { account, buyAmount } = req.body;

  if (!account || !buyAmount) {
    return res.status(400).json({ success: false, error: "Invalid input" });
  }

  try {
    const result = await sendTokens(account, buyAmount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
