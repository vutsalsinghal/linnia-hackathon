import React, { Component } from 'react';
import { Form, Button, Message, Card } from 'semantic-ui-react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
import  moment  from 'moment';
import web3 from '../ethereum/web3';
import config from '../config';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import { encrypt, decrypt } from './crypto-utils';

const hubAddress = config.LINNIA_HUB_ADDRESS;
const protocol = config.LINNIA_IPFS_PROTOCOL;
const port = config.LINNIA_IPFS_PORT;
const host = config.LINNIA_IPFS_HOST;

const ipfs = new IPFS({ host: host, port: port, protocol: protocol });
const linnia = new Linnia(web3, ipfs, { hubAddress });


export default class PendingPermission  extends Component {
    state = {
        errorMessage: '',
        loading: false,
        pending_member_invites:[],
        eventHash:'',
        linnia_pk:'',
        msg: '',
    }

    async componentDidMount(){
        // check for pending invites;
        let pending_invites = [];
        let i = 0;
        let memberAddress, memberInfo;
        let eventHash = await SecretEventOrg.methods.currentEventHash().call();
        console.log(eventHash);
        this.setState({eventHash: eventHash});
        memberAddress = await SecretEventOrg.methods.innerCircle(i).call();
        try{
            console.log(memberAddress);
            while(memberAddress !== "0x0"){
                memberInfo = await SecretEventOrg.methods.getMemberInfo(memberAddress).call();
                console.log(memberInfo);
                console.log(eventHash);
                let p = await linnia.getPermission(eventHash,memberAddress);
                if(p && !p.canAccess) {
                  pending_invites.push({'Address': memberAddress, 'publicKey': memberInfo.public_key});  
                }
                i++;
                memberAddress = await SecretEventOrg.methods.innerCircle(i).call();
            }
        }catch(err){
            console.log(err.message);
        }
        console.log(pending_invites);
        this.setState({pending_member_invites: pending_invites});
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        const [userAddr] = await web3.eth.getAccounts();
        const privateKey = this.state.linnia_pk;
        let event_details = await linnia.getRecord(this.state.eventHash);
        const ipfsLink = event_details.dataUri;
        let eventDetails, encrypted, ipfsRecord;
        // Use ipfs library to pull the encrypted data down from IPFS
        ipfs.cat(ipfsLink, async (err, ipfsRes) => {
                if(err){
                    this.setState({errorMessage: err.message});
                }else{
                    const encrypted = ipfsRes;
                    try {
                        const eventDetails = await decrypt(privateKey, encrypted);
                    } catch (e) {
                        this.setState({errorMessage: "Error Decrypting Data. Probably Wrong Private Key!"});
                    }
                }
            })
        
        this.state.pending_member_invites.map(async (invite) => {
            try{
                encrypted = await encrypt(invite.publicKey, eventDetails);
            }catch(err){
                this.setState({ errorMessage: err.message });
                return;
            }

            try{
                ipfsRecord = await new Promise((resolve, reject) => {
                    ipfs.add(encrypted, (err, ipfsRed) => {
                        err ? reject(err) : resolve(ipfsRed)
                    })
                })
            }catch(err){
                this.setState({ errorMessage: err.message });
                return;
            }

            const dataUri = ipfsRecord;
            try {
                const { permissions } = await linnia.getContractInstances();
                await permissions.grantAccess(this.state.eventHash, invite.Address, dataUri, { from: userAddr });

                this.setState({ msg: <Message positive header="Success!" content={invite.Address + " Invited Successfully!"} /> });
            }catch(err){
                this.setState({ errorMessage: err.message });
                return;
            }
        });
        this.setState({pending_member_invites:[]});
    }

    render() {
        if(this.state.pending_member_invites.length > 0) {
        return (
            <div>
                <Form onSubmit={this.handleSubmit} error={!!this.state.errorMessage}>
                    <Form.Group>
                        <Form.Field width={12}>
                            <label htmlFor='linnia_pk'>Linnia Private Key</label>
                            <input type='password' onChange={event => this.setState({ linnia_pk: event.target.value })} value={this.state.linnia_pk} />
                        </Form.Field>
                        <Button basic primary type='submit' loading={this.state.loading} disabled={this.state.loading}>Send Invites</Button>
                    </Form.Group>
                    <Message error header="Oops!" content={this.state.errorMessage} />
                    {this.state.msg}
                    </Form>
            </div>
        );
    } else return (<div> you dont have any pending invites</div>)
    }
}
