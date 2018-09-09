import React, { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import web3 from '../ethereum/web3';

export default class AttendEvent extends Component{
  state = {
    errorMessage: '',
    loading: false,
    msg: '',
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ errorMessage: '', loading: true });
    
    try {
      const memberAddress = await web3.eth.getAccounts();
      let isMember = await SecretEventOrg.methods.checkIfMember(memberAddress[0]).call();
      if (isMember){
        await SecretEventOrg.methods.attendEvent(this.props.eventHash).send({from: memberAddress[0], value:this.props.minDeposit});

        this.setState({ msg: <Message positive header="Success!" content={"Your attendance has been noted!"} /> })
      }else{
        this.setState({ msg: <Message negative header="Oops!" content={"You're not a member yet!"} /> })
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
        <Message header="Minimum Deposit (in ETH)" content={web3.utils.fromWei(this.props.minDeposit, "ether")} />
        <Message error header="Oops!" content={this.state.errorMessage} />
        <Button basic color='green' width={4} type='submit' loading={this.state.loading} disabled={this.state.loading}>Attend Event</Button>
        {this.state.msg}
      </Form>
    );
  }
}
