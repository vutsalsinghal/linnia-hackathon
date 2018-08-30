import web3 from './web3';
import secretEventOrg from './build/SecretEventOrg.json';

const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0x1b858925423b967f6e5b2631ab2f5f186867854f");
export default SecretEventOrg;
