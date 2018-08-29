import React, { Component } from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import { acceptReferral, checkIfReferred } from '../actions/ReferralAction';
import { getDefaultEthereumAccount } from '../actions/EthereumAccountAction';

export class AcceptReferral extends Component {
	state = {
		linnia_publicKey: '',
		errorMessage: '',
		loading: false,
		msg: '',
	}

	handleSubmit = async (event) => {
		event.preventDefault();
		let currentEthAddress;

		this.setState({ errorMessage: '', loading: true });
		try {
			const result = await checkIfReferred();
			const memberAddress = await acceptReferral(this.state.linnia_publicKey);
			if (memberAddress) {
				this.setState({ msg: <Message positive header="Success!" content={"Referral accepted. '" + memberAddress + "' is now a member!"} /> })
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
