import React, { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
import  moment  from 'moment';
import web3 from '../ethereum/web3';
import config from '../config';
import { encrypt } from './crypto-utils';
import SecretEventOrg from '../ethereum/SecretEventOrg';

const hubAddress = config.LINNIA_HUB_ADDRESS;
const protocol = config.LINNIA_IPFS_PROTOCOL;
const port = config.LINNIA_IPFS_PORT;
const host = config.LINNIA_IPFS_HOST;

const ipfs = new IPFS({ host: host, port: port, protocol: protocol });
const linnia = new Linnia(web3, ipfs, { hubAddress });

export class AddRecord extends Component {
    state = {
        eventName: '',
        description: '',
        deposit: 0,
        capacity:0, 
        start_time:'',
        duration:0,
        location:'',
        details:'',
        owner_publicKey:'',
        members:[],
        errorMessage: '',
        loading: false,
        msg:'',
    }

    async componentDidMount(){
        let members = [];
        let i = 0;
        let memberAddress = '';
        let memberInfo;

        try{
            while(memberAddress != "0x0"){
                memberAddress = await SecretEventOrg.methods.innerCircle(i).call();
                memberInfo = await SecretEventOrg.methods.getMemberInfo(memberAddress).call();
                members.push({'Address': memberAddress, 'publicKey': memberInfo.public_key});
                i++;
            }
        }catch(err){
            console.log(err.message);
        }

        this.setState({members});
    }

    handleSubmit = async (event) => {
        event.preventDefault();

        const metadata = this.state.eventName;
        const data = {
            'Name': this.state.eventName,
            'Description': this.state.description,
            'Deposit': this.state.deposit,
            'Capacity': this.state.capacity,
            'Duration': this.state.duration,
            'Location': this.state.location,
            'Details': this.state.details,
        };

        let encrypted, ipfsRecord;
        const unix_start_time = moment(this.state.start_time).unix();
        this.setState({ errorMessage: '', msg: '', loading: true });

        try {
            encrypted = await encrypt(this.state.owner_publicKey, JSON.stringify(data));
        } catch (err) {
            this.setState({ errorMessage: err.message });
            return;
        }

        try {
            ipfsRecord = await new Promise((resolve, reject) => {
                ipfs.add(encrypted, (err, ipfsRed) => {
                    err ? reject(err) : resolve(ipfsRed)
                })
            })
        } catch(err){
            this.setState({ errorMessage: err.message });
            return;
        }

        const dataUri = ipfsRecord;
        const accounts = await web3.eth.getAccounts();
        const dataHash = await linnia.web3.utils.sha3(dataUri);

        try {
            const { records } = await linnia.getContractInstances();
            await records.addRecord(dataHash, metadata, dataUri, { from: accounts[0] });
            await SecretEventOrg.methods.addEvent(dataHash, data.Name, data.Description, data.Capacity, data.Deposit, unix_start_time, data.Duration).send({from:accounts[0]});
            this.setState({ msg: <Message positive header="Success!" content={"Event Created Successfully!"} /> });
        } catch (err) {
            this.setState({ errorMessage: err.message });
            return;
        }

        // Add Permissions
        this.state.members.map(async (member) => {
            try{
                encrypted = await encrypt(member.publicKey, JSON.stringify(data));
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
            const accounts = await web3.eth.getAccounts();
            try {
                const { permissions } = await linnia.getContractInstances();
                await permissions.grantAccess(dataHash, member.Address, dataUri, { from: accounts[0] });

                this.setState({ msg: <Message positive header="Success!" content={member.Address + " Invited Successfully!"} /> });
            }catch(err){
                this.setState({ errorMessage: err.message });
                return;
            }
        });

        this.setState({ loading: false });
    }

    render() {
        return (
            <div>
                <h1>Create Event</h1>
                <Form onSubmit={this.handleSubmit} error={!!this.state.errorMessage}>
                    <Form.Field>
                        <label htmlFor='event'>Event Name</label>
                        <input id='eventName' type='text' onChange={event => this.setState({ eventName: event.target.value })} value={this.state.event} />
                    </Form.Field>
                    <Form.TextArea value={this.state.description} label="Brief description" onChange={description => this.setState({ description: description.target.value })} />
                    <Form.Field>
                        <label htmlFor='capacity'>Maximum Capacity</label>
                        <input id='capacity' type='number' onChange={event => this.setState({ capacity: event.target.value })} value={this.state.capacity} />
                    </Form.Field>
                    <Form.Field>
                        <label htmlFor='deposit'>Fee</label>
                        <input id='deposit' type='number' onChange={event => this.setState({ deposit: event.target.value })} value={this.state.deposit} />
                    </Form.Field>
                    <Form.Field>
                        <label htmlFor='starttime'>Event Time</label>
                        <input id='starttime' type='datetime-local' onChange={event => this.setState({ start_time: event.target.value })} value={this.state.start_time} />
                    </Form.Field>
                    <Form.Field>
                        <label htmlFor='event'>Event Duration</label>
                        <input id='duration' type='number' onChange={event => this.setState({ duration: event.target.value })} value={this.state.duration} />
                    </Form.Field>
                    <Form.Field>
                        <label htmlFor='location'>Location</label>
                        <input id='location' type='text' onChange={event => this.setState({ location: event.target.value })} value={this.state.location} />
                    </Form.Field>
                    <Form.TextArea value={this.state.details} label="Event Full Details" onChange={details => this.setState({ details: details.target.value })} />
                    <Form.Field>
                        <label htmlFor='public_key'>Your Public Key</label>
                        <input id='public_key' type='text' value={this.state.owner_publicKey} onChange={event => this.setState({ owner_publicKey: event.target.value })} placeholder='Public Key' />
                    </Form.Field>
                    <Message error header="Oops!" content={this.state.errorMessage} />
                    <Button basic primary type='submit' loading={this.state.loading} disabled={this.state.loading}>Create Event</Button>
                    {this.state.msg}
                </Form>
            </div>
        );
    }
}
