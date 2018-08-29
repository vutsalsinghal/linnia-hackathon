import web3 from './web3';
import secretEventOrg from './build/SecretEventOrg.json';

const SecretEventOrg = new web3.eth.Contract(JSON.parse(secretEventOrg.interface), "0xa6dd1b746b37549b7d6645d2e87df6b38f95dd7c");
export default SecretEventOrg;
