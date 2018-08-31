import React, { Component } from 'react';
import { Grid, Card, Icon, Modal, Button } from 'semantic-ui-react';
import { AcceptDeclineContainer } from './AcceptDeclineContainer';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import web3 from '../ethereum/web3';
import FullDetail from './FullDetail';
import Debugging from './Debugging';
import { checkIfMember, checkIfOwner, checkIfReferred } from '../actions/ReferralAction';

class Home extends Component {
  state = {
    eventName: '',
    describe: '',
    capacity: 0,
    deposit: 0,
    start_time: 0,
    duration: 0,
    isOwner: false,
    isMember: false,
    isReferral: false,
  }

  async componentDidMount() {
    var eventHash = await SecretEventOrg.methods.currentEventHash().call();
    let { eventName, describe, capacity, deposit, start_time, duration } = await SecretEventOrg.methods.getEventInfo(eventHash).call();
    const isOwner = await checkIfOwner();
    const isMember = await checkIfMember();
    const isReferral = await checkIfReferred();
    this.setState({ eventName, describe, capacity, deposit, start_time, duration, isOwner, isMember, isReferral });
  }

  renderEvent() {
    let cardBody;

    if (this.state.eventName !== ''){
      cardBody = (
        <div>
        <Card.Header>Name: {this.state.eventName}</Card.Header>
        <Card.Meta>Capacity: {this.state.capacity}</Card.Meta>
        <Card.Description>Min Deposit: {web3.utils.fromWei(this.state.deposit.toString(), 'ether')} ether</Card.Description>
        </div>
      );
    }else{
      cardBody = (
        <Card.Header>No Upcomming Event!</Card.Header>
      );
    }

    return (
      <Card>
        <Card.Content>
          {cardBody}
        </Card.Content>
      </Card>
    );
  }

  render() {
    return (
      <div>
        <h1></h1>
        <Grid stackable reversed="mobile">
          <Grid.Column width={12}>
            {this.renderEvent()}
          </Grid.Column>
          <Grid.Column width={4}>
            {
              this.state.isReferral &&
              <Grid.Row>
                <Modal size='small'
                  trigger={
                    <Button icon labelPosition='left' className="primary" floated="right">
                      <Icon name='add' />
                      Pending Referral
                    </Button>
                  }>
                  <Modal.Header>Accept/Decline Referral</Modal.Header>
                  <Modal.Content>
                    <AcceptDeclineContainer />
                  </Modal.Content>
                </Modal>
              </Grid.Row>
            }

            {this.state.isMember &&
              <Grid.Row>
                <Modal size='small'
                  trigger={
                    <Button icon labelPosition='left' className="primary" floated="right">
                      <Icon name='unlock' />
                      Full Details
                   </Button>
                  }>
                  <Modal.Header>Full Details of Event</Modal.Header>
                  <Modal.Content>
                    <FullDetail />
                  </Modal.Content>
                </Modal>
              </Grid.Row>
            }
          </Grid.Column>
          <Grid.Column width={12}><Grid.Row>
            <Debugging />
          </Grid.Row></Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default Home;
