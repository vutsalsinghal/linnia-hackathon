import web3 from '../ethereum/web3';

export async function getDefaultEthereumAccount() {
    const addresses = await web3.eth.getAccounts();
    return addresses[0];
};