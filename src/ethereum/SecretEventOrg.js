import web3 from './web3';
import secretEventOrg from './build/SecretEventOrg.json';

//const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0x1b858925423b967f6e5b2631ab2f5f186867854f");  // Amit
const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0xb9f56155f3e7e4e6e1e64e29f514b6e5bacf5be3"); // Vutsal
export default SecretEventOrg;
