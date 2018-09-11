import React, { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import web3 from '../ethereum/web3';

export class AcceptReferral extends Component {
  state = {
    linnia_publicKey: '',
    errorMessage: '',
    loading: false,
    msg: '',
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ errorMessage: '', loading: true });
    
    try {
      const memberAddress = await web3.eth.getAccounts();
      let isReferred = await SecretEventOrg.methods.checkIfReferred(memberAddress[0]).call();
        if (isReferred){
          await SecretEventOrg.methods.applyMembership(this.state.linnia_publicKey).send({from: memberAddress[0]});

        this.setState({ msg: <Message positive header="Success!" content={"Referral accepted. '" + memberAddress + "' is now a member!"} /> })
      }else{
        this.setState({ msg: <Message negative header="Oops!" content={"You have not been referred!"} /> })
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
        <Form.Group>
          <Form.Field width={12}>
            <label htmlFor='linnia_publicKey'>Linnia User Public Key</label>
            <input id='linnia_publicKey' type='text' onChange={event => this.setState({ linnia_publicKey: event.target.value })} value={this.state.linnia_publicKey} />
          </Form.Field>
          <Message error header="Oops!" content={this.state.errorMessage} />      
          <Button basic color='green' width={4} type='submit' loading={this.state.loading} disabled={this.state.loading}>Accept Referral</Button>
        </Form.Group>
        {this.state.msg}
      </Form>
    );
  }
}
