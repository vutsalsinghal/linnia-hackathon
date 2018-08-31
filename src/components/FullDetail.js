import React, { Component } from 'react';
import { Form, Button, Message, Card, Icon } from 'semantic-ui-react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
import  moment  from 'moment';
import web3 from '../ethereum/web3';
import config from '../config';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import { decrypt, encrypt } from './crypto-utils';
import EthCrypto from 'eth-crypto';

const hubAddress = config.LINNIA_HUB_ADDRESS;
const protocol = config.LINNIA_IPFS_PROTOCOL;
const port = config.LINNIA_IPFS_PORT;
const host = config.LINNIA_IPFS_HOST;

const ipfs = new IPFS({ host: host, port: port, protocol: protocol });
const linnia = new Linnia(web3, ipfs, { hubAddress });


export default class FullDeail extends Component {
    state = {
        errorMessage: '',
        loading: false,
        msg: '',
        linnia_pk:'',
        decrypted:'',
        eventHash:'',
    }

    async componentDidMount(){
        var eventHash = await SecretEventOrg.methods.currentEventHash().call();
        this.setState({eventHash});
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        const userAddr = await web3.eth.getAccounts();
        let p = await linnia.getPermission(this.state.eventHash,userAddr[0]);

        this.setState({errorMessage:'', decrypted:''});

        const abcEncrypt = await encrypt("0x1571c896a06b139541d435db8fbe1f643d5e8046de34d28fbc115e4a70ed53a009c71be0038acc8e074746b24fccdccb1e2a394ab7534b45ed06255e4181faf0", "abc");
        const abc = await decrypt("0xa1250e85b12e90d8ea8a780246d72a09a2af520098b5e6879b201aada0e64c94", abcEncrypt);
        console.log("abc == ", abc);

        if(p && p.canAccess){
            const privateKey = this.state.linnia_pk;
            const ipfsLink = p.dataUri;

            console.log("privateKey", privateKey);
            console.log("ipfsLink", ipfsLink);

            this.setState({errorMessage: "loading IPFS data..."});

            // Use ipfs library to pull the encrypted data down from IPFS
            ipfs.cat(ipfsLink, async (err, ipfsRes) => {
                if(err){
                    this.setState({errorMessage: err.message});
                }else{
                    const encrypted = ipfsRes;
                    try {
                        const decrypted = await decrypt(privateKey, encrypted);
                        this.setState({decrypted});
                        this.setState({errorMessage: "done loading the IPFS data =) decrypted="+decrypted+" ipfsRes="+ipfsRes});

                        console.log("ipfsRes encrypted", ipfsRes);
                        console.log("decrypted", decrypted);
                        console.log("encrypted", encrypted);
                        const str = EthCrypto.cipher.parse(encrypted);
                        console.log("EthCrypto.cipher.parse", str);

                        const hexPrivKeyString = privateKey.toString('hex');
                        const hexPrivKey = hexPrivKeyString.substr(0, 2) === '0x' ? hexPrivKeyString : `0x${hexPrivKeyString}`;
                        const message = await EthCrypto.decryptWithPrivateKey(hexPrivKey, str);
                        //this.setState({decrypted2});
                        console.log("decrypted2", message, JSON.parse(message));

                    } catch (e) {
                        this.setState({errorMessage: "Error Decrypting Data. Probably Wrong Private Key!"});
                    }
                }
            })
        }
    }

    renderCard(){
        let jsonObj = JSON.parse(this.state.decrypted);

        return (
            <Card>
                <Card.Content>
                    <Card.Header>Secret Details</Card.Header>
                    <Card.Meta>Location: {jsonObj.Location}</Card.Meta>
                    <Card.Meta>Capacity: {jsonObj.Capacity}</Card.Meta>
                    <Card.Meta>Duration: {moment.utc(jsonObj.Duration*1000).format('HH:mm:ss')} hrs</Card.Meta>
                    <Card.Description>Detail: {jsonObj.Details}</Card.Description>
                </Card.Content>
            </Card>
        );
    }

    render() {
        return (
            <div>
                <Form onSubmit={this.handleSubmit} error={!!this.state.errorMessage}>
                    <Form.Group>
                        <Form.Field width={12}>
                            <label htmlFor='linnia_pk'>Linnia Private Key</label>
                            <input type='text' onChange={event => this.setState({ linnia_pk: event.target.value })} value={this.state.linnia_pk} />
                        </Form.Field>
                        <Button basic primary type='submit' loading={this.state.loading} disabled={this.state.loading}>Decrypt</Button>
                    </Form.Group>
                    <Message error header="Oops!" content={this.state.errorMessage} />
                    {this.state.msg}
                </Form>

                { this.state.decrypted && <div>{this.renderCard()}</div> }
            </div>
        );
    }
}
