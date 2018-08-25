import config from '../config';
import Web3 from 'web3';
import IPFS from 'ipfs-mini';
import { encrypt } from './crypto-utils';
import Linnia from '@linniaprotocol/linnia-js';
import React, { Component } from 'react';


const hubAddress = config.LINNIA_HUB_ADDRESS;
const protocol = config.LINNIA_IPFS_PROTOCOL;
const port = config.LINNIA_IPFS_PORT;
const host = config.LINNIA_IPFS_HOST;
const gasPrice = 20
const gas = 500000


const web3 = new Web3(window.web3.currentProvider)

const ipfs = new IPFS({ host: host, port: port, protocol: protocol })

const linnia = new Linnia(web3, ipfs, { hubAddress })


async function createRecord(metadata, data, ownerPublicKey) {
  let encrypted, ipfsRecord;
  try {
    encrypted = await encrypt(new Buffer(ownerPublicKey, 'hex'), data)
  } catch (e) {
    console.error(e)
    return
  }

  try {
    ipfsRecord = await new Promise((resolve, reject) => {
      ipfs.add(encrypted, (err, ipfsRed) => {
        err ? reject(err) : resolve(ipfsRed)
      })
    })
  } catch (e) {
    console.error(e)
    return
  }

  const dataUri = ipfsRecord[0].hash
  const [owner] = await web3.eth.getAccounts()
  const dataHash = await web3.util.soliditySha3(metadata, dataUri)

  try {
    const { records } = await linnia.getContractInstances()
    await records.addRecord(dataHash, metadata, dataUri, {
      from: owner,
      gasPrice,
      gas,
    })
  } catch (e) {
    console.error(e)
    return
  }
}


export class AddRecord extends Component {

  constructor(props) {
    super(props)
    this.state = {
      event: '',
      description: '',
      owner_pk: '',
      propety: '',

    }
  }

  handleSubmit = (event) => {
    event.preventDefault()
    const metadata = event.target.elements.event.value
    const data = event.target.elements.description.value
    const pk = event.target.elements.owner_pk.value
    createRecord(metadata, data, pk)
  }

  onInputChange = (property) => (event) => {
    const value = event.target.value;
    this.setState({ [property]: value });
  }

  render() {
    return (
      <form className='pure-form pure-form-stacked' onSubmit={this.handleSubmit}>
        <fieldset>
          <label htmlFor='event'>{"Event Name"}</label>
          <input
            id='event'
            type='text'
            onChange={this.onInputChange('event')}
            value={this.state.event}
            placeholder='Event Name'
          />

          <br />

          <label htmlFor='description'>Event Description</label>
          <input id='description' type='text' value={this.state.description} onChange={this.onInputChange('description')} placeholder='Event Details' />



          <br />
          <label htmlFor='public_key'>Your Public Key</label>
          <input id='public_key' type='text' value={this.state.owner_pk} onChange={this.onInputChange('owner_pk')} placeholder='Public Key' />



          <br />

          <button type='submit' className='pure-button pure-button-primary'>Create Event</button>
        </fieldset>
      </form>
    );
  }
}
