import React, { Component } from 'react';
import { Form, Button, Message, Dimmer, Loader } from 'semantic-ui-react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
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
    linnia_privateKey:'',
    msg: '',
    eventDetails:'',
    owner:'',
    loadingData:false,
  }

  async componentDidMount(){
    this.setState({loadingData:true});

    // Check for pending invites;
    let pending_invites = [];
    let i = 0;
    let memberAddress, memberInfo;
    
    const [userAddr] = await web3.eth.getAccounts();
    let eventHash = await SecretEventOrg.methods.currentEventHash().call();
    this.setState({eventHash: eventHash, owner:userAddr});

    
    try{
      while(memberAddress !== "0x0"){
        memberAddress = await SecretEventOrg.methods.innerCircle(i).call();
        memberInfo = await SecretEventOrg.methods.getMemberInfo(memberAddress).call();

        // Get member permissions
        let p = await linnia.getPermission(eventHash,memberAddress);

        if(p && !p.canAccess) {
          console.log(memberAddress);
          pending_invites.push({'Address': memberAddress, 'publicKey': memberInfo.public_key});  
        }
        
        i++;
      }
    }catch(err){
      console.log(err.message);
    }

    //console.log("pending invites: ",pending_invites);
    this.setState({pending_member_invites: pending_invites, loadingData:false});
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    this.setState({loading:true, errorMessage:''});

    let event_details = await linnia.getRecord(this.state.eventHash);
    const ipfsLink = event_details.dataUri;
    
    // Use ipfs library to pull the encrypted data down from IPFS
    ipfs.cat(ipfsLink, async (err, encrypted) => {
      if(err){
        this.setState({errorMessage: err.message});
      }else{
        try {
          const eventDetails = await decrypt(this.state.linnia_privateKey, encrypted);
          this.setState({eventDetails});
        } catch(e){
          this.setState({errorMessage: "Error Decrypting Data. Probably Wrong Private Key!"});
          console.log("Error while decrypting: ",e.mesaage);
        }
      }
    });

    setInterval(() => {
      if (this.state.eventDetails === '') {
        console.log('Still null...');
      }else{
        this.setPermission();     
      }
    }, 1000);
  }

  setPermission = async () => {
    let dataUri, encrypted;

    this.state.pending_member_invites.map(async (invite) => {
      try{
        encrypted = await encrypt(invite.publicKey, this.state.eventDetails);
      }catch(err){
        this.setState({ errorMessage: err.message });
        return;
      }
      
      try{
        dataUri = await new Promise((resolve, reject) => {
          ipfs.add(encrypted, (err, ipfsRed) => {
            err ? reject(err) : resolve(ipfsRed)
          })
        })
      }catch(err){
        this.setState({ errorMessage: err.message });
        return;
      }

      try {
        const { permissions } = await linnia.getContractInstances();
        await permissions.grantAccess(this.state.eventHash, invite.Address, dataUri, { from: this.state.owner });

        this.setState({ msg: <Message positive header="Success!" content={invite.Address + " Invited Successfully!"} /> });
      }catch(err){
        this.setState({ errorMessage: err.message });
        return;
      }
    });

    this.setState({loading:false});
  }

  render() {
    if(this.state.loadingData){
      return (
          <Dimmer active inverted>
            <Loader size='medium'>Loading...</Loader>
          </Dimmer>
      );
    }

    if(this.state.pending_member_invites.length > 0) {
    return (
      <div>
        <p>{this.state.pending_member_invites.length} pending permission requests!</p>
        <Form onSubmit={this.handleSubmit} error={!!this.state.errorMessage}>
          <Form.Group>
            <Form.Field width={12}>
              <label htmlFor='linnia_privateKey'>Linnia Private Key</label>
              <input type='password' onChange={event => this.setState({ linnia_privateKey: event.target.value })} value={this.state.linnia_privateKey} />
            </Form.Field>
            <Button basic primary type='submit' loading={this.state.loading} disabled={this.state.loading}>Send Invites</Button>
          </Form.Group>
          <Message error header="Oops!" content={this.state.errorMessage} />
          {this.state.msg}
        </Form>
      </div>
    );
  } else return (<div> You dont have any pending invites</div>)
  }
}
