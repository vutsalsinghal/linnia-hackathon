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
    linnia_privateKey:'',
    msg: '',
    eventDetails:'',
    owner:'',
    loadingData:false,
    currentAddress:'',
    currentPubKey:'',
  }

  async componentDidMount(){
    this.setState({loadingData:true});

    // Check for pending invites;
    let pending_invites = [];
    let i = 0;
    let memberAddress, memberInfo;
    
    const [userAddr] = await web3.eth.getAccounts();
    this.setState({owner:userAddr});
    
    try{
      while(memberAddress !== "0x0"){
        memberAddress = await SecretEventOrg.methods.innerCircle(i).call();
        memberInfo = await SecretEventOrg.methods.getMemberInfo(memberAddress).call();

        // Get member permissions
        let p = await linnia.getPermission(this.props.eventHash, memberAddress);

        if(p && !p.canAccess) {
          pending_invites.push({'Address': memberAddress, 'publicKey': memberInfo.public_key});
        }
        
        i++;
      }
    }catch(err){
      console.log(err.message);
    }

    this.setState({pending_member_invites: pending_invites, loadingData:false});
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    this.setState({loading:true, errorMessage:''});

    let fullDetails;
    let event_details = await linnia.getRecord(this.props.eventHash);
    const ipfsLink = event_details.dataUri;
    
    // Use ipfs library to pull the encrypted data down from IPFS
    ipfs.cat(ipfsLink, async (err, encrypted) => {
      if(err){
        this.setState({errorMessage: err.message});
      }else{
        try {
          fullDetails = await decrypt(this.state.linnia_privateKey, encrypted);
          this.setState({eventDetails:fullDetails});
        } catch(e){
          this.setState({errorMessage: "Error Decrypting Data. Probably Wrong Private Key!"});
          console.log("Error while decrypting: ",e.message);
        }
      }
    });

    const tmr = setInterval(() => {
      if (this.state.eventDetails === '') {

      }else{
        clearInterval(tmr);
        this.setPermission();
      }
    }, 1000);
    
  }

  setPermission = async () => {
    let encrypted, dataUri;

    try{
      encrypted = await encrypt(this.state.currentPubKey, this.state.eventDetails);
    }catch(err){
      this.setState({ errorMessage: err.message, loading: false });
      return;
    }
      
    try{
      dataUri = await new Promise((resolve, reject) => {
        ipfs.add(encrypted, (err, ipfsRed) => {
          err ? reject(err) : resolve(ipfsRed)
        })
      })
    }catch(err){
      this.setState({ errorMessage: err.message, loading:false });
      return;
    }

    try {
      const { permissions } = await linnia.getContractInstances();
      await permissions.grantAccess(this.props.eventHash, this.state.currentAddress, dataUri, { from: this.state.owner });

      this.setState({ msg: <Message positive header="Success!" content={this.state.currentAddress + " Invited Successfully!"} /> });
    }catch(err){
      this.setState({ errorMessage: err.message, loading: false });
      return;
    }

    this.setState({loading:false});
  }

  renderPermissions(){
    const items = this.state.pending_member_invites.map((user, id) => {
      return (
        <Message info key={id}>
          <Message.Header key={id}>
            {user.Address}
            <Button key={id} floated="right" basic primary type='submit' onClick={event => this.setState({currentAddress:user.Address, currentPubKey:user.publicKey})} loading={this.state.loading} disabled={this.state.loading}>Allow</Button>
          </Message.Header>
          <br/>
        </Message>
      );
    });

    return (<div>{items}</div>);
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
          <Form.Field>
            <label htmlFor='linnia_privateKey'>Linnia Private Key</label>
            <input type='password' onChange={event => this.setState({ linnia_privateKey: event.target.value })} value={this.state.linnia_privateKey} />
          </Form.Field>
          {this.renderPermissions()}
          <Message error header="Oops!" content={this.state.errorMessage} />
          {this.state.msg}
        </Form>
      </div>
    );
  } else return (<div> You dont have any pending invites</div>)
  }
}
