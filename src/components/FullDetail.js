import React, { Component } from 'react';
import { Form, Button, Message, Card } from 'semantic-ui-react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
import moment  from 'moment';
import web3 from '../ethereum/web3';
import config from '../config';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import { decrypt } from './crypto-utils';

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
        console.log(p);
        
        this.setState({errorMessage:'', decrypted:''});

        if(p && p.canAccess){
            const privateKey = this.state.linnia_pk;
            const ipfsLink = p.dataUri;

            // Use ipfs library to pull the encrypted data down from IPFS
            ipfs.cat(ipfsLink, async (err, ipfsRes) => {
                if(err){
                    this.setState({errorMessage: err.message});
                }else{
                    const encrypted = ipfsRes;
                    try {
                        const decrypted = await decrypt(privateKey, encrypted);
                        console.log(decrypted);
                        this.setState({decrypted});
                    } catch (e) {
                        this.setState({errorMessage: "Error Decrypting Data. Probably Wrong Private Key!"});
                    }
                }
            })
        }else{
        	this.setState({errorMessage: "Permission to decrypt has not been to assigned to you yet!"});
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
                            <input type='password' onChange={event => this.setState({ linnia_pk: event.target.value })} value={this.state.linnia_pk} />
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
