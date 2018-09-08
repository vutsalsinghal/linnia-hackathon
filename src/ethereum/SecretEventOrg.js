import web3 from './web3';
import secretEventOrg from './build/SecretEventOrg.json';

//const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0x1b858925423b967f6e5b2631ab2f5f186867854f");  // Amit
const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0x06af8345c1266ee172ee66a31e2be65bf9aa7b46"); // Vutsal
export default SecretEventOrg;
