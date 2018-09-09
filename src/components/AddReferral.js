import React, { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import web3 from '../ethereum/web3';

export class AddReferral extends Component {
  state = {
    eth_address: '',
    errorMessage: '',
    loading: false,
    msg: '',
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ errorMessage: '', loading: true });

    try {
      const memberAddress = await web3.eth.getAccounts();
      let isReferred = await SecretEventOrg.methods.checkIfReferred(this.state.eth_address).call();
      let isMember = await SecretEventOrg.methods.checkIfMember(this.state.eth_address).call();
      if (isReferred || isMember){
        this.setState({ msg: <Message positive header="Is Referred/Member!" content={"Friend is already referred/member!"} /> });    
      }else{
        await SecretEventOrg.methods.referFriend(this.state.eth_address).send({ from: memberAddress[0] });
        this.setState({ msg: <Message positive header="Success!" content={"Friend referred successfully!"} /> });
      }
      
    } catch (err) {
      this.setState({ errorMessage: err.message, loading: false });
      return;
    }

    this.setState({ loading: false });
  }

  render() {
    return (
      <Form onSubmit={this.handleSubmit} error={!!this.state.errorMessage}>
        <Form.Field>
          <label htmlFor='eth_address'>Ethereum Public Address</label>
          <input id='eth_address' type='text' value={this.state.eth_address} onChange={event => this.setState({ eth_address: event.target.value })} />
        </Form.Field>

        <Message error header="Oops!" content={this.state.errorMessage} />
        <Button basic primary type='submit' loading={this.state.loading} disabled={this.state.loading}>Refer friend</Button>
        {this.state.msg}
      </Form>
    );
  }
}
