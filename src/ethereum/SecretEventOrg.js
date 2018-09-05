import web3 from './web3';
import secretEventOrg from './build/SecretEventOrg.json';

//const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0x1b858925423b967f6e5b2631ab2f5f186867854f");  // Amit
const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0xc5c72166caa8c518c17a57f0e3a99405ffb607a4"); // Vutsal
export default SecretEventOrg;
