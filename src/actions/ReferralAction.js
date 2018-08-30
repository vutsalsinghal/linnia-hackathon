import SecretEventOrg from '../ethereum/SecretEventOrg';
import { getDefaultEthereumAccount } from '../actions/EthereumAccountAction';
import config from '../config';

export async function checkIfReferred() {
    // Gets the member account.
    const userAddress = await getDefaultEthereumAccount();
    let result = await SecretEventOrg.methods.checkIfReferred(userAddress).call();
    return result;
};

export async function checkIfMember() {
    // Gets the member account.
    const userAddress = await getDefaultEthereumAccount();
    let result = await SecretEventOrg.methods.checkIfMember(userAddress).call();
    return result;
};

export async function checkIfOwner() {
    // Gets the user account.
    //TODO: refactor to use contract's owner from contract (but needs to refactor small contract first).
    const userAddress = await getDefaultEthereumAccount();
    return userAddress.toUpperCase() === config.CONTRACT_OWNER_PK.toUpperCase();
};

export async function referMember(referralAddress) {
    // Gets the user account.
    const memberAccount = await getDefaultEthereumAccount();
    await SecretEventOrg.methods.referFriend(referralAddress).send({ from: memberAccount });
    return true;
};

export async function acceptReferral(linnia_user_pk) {
    const referralAccount = await getDefaultEthereumAccount();
    await SecretEventOrg.methods.applyMembership(linnia_user_pk).send({ from: referralAccount });
    return referralAccount;
};

export async function declineReferral(eth_address) {
    return true;
};