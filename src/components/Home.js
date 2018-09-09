import React, { Component } from 'react';
import { Grid, Card, Icon, Modal, Button, Loader, Dimmer } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import FullDetail from './FullDetail';
import AttendEvent from './AttendEvent';
import PendingPermission from './PendingPermission';
import AcceptDeclineContainer from './AcceptDeclineContainer';
import { checkIfMember, checkIfOwner, checkIfReferred } from '../actions/ReferralAction';

class Home extends Component {
  state = {
    eventHash:'',
    eventName: '',
    describe: '',
    capacity: 0,
    deposit: 0,
    start_time: 0,
    duration: 0,
    totalAttending:0,
    isOwner: false,
    isMember: false,
    isReferral: false,
    loadingData:false,
  }

  async componentDidMount() {
    this.setState({loadingData:true});

    document.title = "Inner Circle";

    var eventHash = await SecretEventOrg.methods.currentEventHash().call();
    let { eventName, describe, capacity, deposit, start_time, duration, totalAttending } = await SecretEventOrg.methods.getEventInfo(eventHash).call();
    const isOwner = await checkIfOwner();
    const isMember = await checkIfMember();
    const isReferral = await checkIfReferred();
    this.setState({ eventHash, eventName, describe, capacity, deposit, start_time, duration, totalAttending, isOwner, isMember, isReferral });

    this.setState({loadingData:false});
  }

  renderEvent() {
    let cardBody;

    if (this.state.eventName !== ''){
      cardBody = (
        <div>
        <Card.Header>Name: {this.state.eventName}</Card.Header>
        <Card.Meta>Capacity: {this.state.capacity}</Card.Meta>
        <Card.Meta>Total Attending: {this.state.totalAttending}</Card.Meta>
        <Card.Meta>Min Deposit: {web3.utils.fromWei(this.state.deposit.toString(), 'ether')} ether</Card.Meta>
        <Card.Description>Description: {this.state.describe}</Card.Description>
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
    if(this.state.loadingData){
      return (
          <Dimmer active inverted>
            <Loader size='massive'>Loading...</Loader>
          </Dimmer>
      );
    }
        
    return (
      <div>
        <h1></h1>
        <Grid stackable reversed="mobile">
          <Grid.Column width={12}>
            {this.renderEvent()}
          </Grid.Column>
          <Grid.Column width={4}>
            <Button.Group basic vertical>
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
              <div>
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
                <Grid.Row>
                  <Modal size='small'
                    trigger={
                      <Button icon labelPosition='left' className="primary" floated="right">
                        <Icon name='calendar check outline' />
                        Attend Event
                     </Button>
                    }>
                    <Modal.Header>Let The Organiser Know If You're Attending</Modal.Header>
                    <Modal.Content>
                      <AttendEvent minDeposit={this.state.deposit} eventHash={this.state.eventHash} />
                    </Modal.Content>
                  </Modal>
                </Grid.Row>
              </div>
            }

            {this.state.isOwner &&
              <Grid.Row>
                <Modal size='small'
                  trigger={
                    <Button icon labelPosition='left' className="primary" floated="right">
                      <Icon name='calendar plus outline' />
                      Pending Permissions
                   </Button>
                  }>
                  <Modal.Header>Pending Permission Request List</Modal.Header>
                  <Modal.Content>
                    <PendingPermission />
                  </Modal.Content>
                </Modal>
              </Grid.Row>
            }
            </Button.Group>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default Home;
