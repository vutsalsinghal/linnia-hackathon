import web3 from './web3';
import secretEventOrg from './build/SecretEventOrg.json';

//const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0x1b858925423b967f6e5b2631ab2f5f186867854f");  // Amit
const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0xd96f24f401cdd513f0d27e1cc57fefdd2109773e"); // Vutsal
export default SecretEventOrg;
