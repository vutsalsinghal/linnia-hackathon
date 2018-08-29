import React, { Component } from 'react';
import { Form, Button, Message, Card } from 'semantic-ui-react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
import  moment  from 'moment';
import web3 from '../ethereum/web3';
import config from '../config';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import { decrypt } from './crypto-utils';

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
        msg: '',
    }

    async componentDidMount(){

    }

    handleSubmit = async (event) => {
        
    }

    render() {
        return (
            <div>
                Hi
            </div>
        );
    }
}
