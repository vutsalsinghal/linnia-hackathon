import React, { Component } from 'react';
import Linnia from '@linniaprotocol/linnia-js';
import IPFS from 'ipfs-mini';
import web3 from '../ethereum/web3';
import config from '../config';
import SecretEventOrg from '../ethereum/SecretEventOrg';
import { decrypt, encrypt } from './crypto-utils';

const hubAddress = config.LINNIA_HUB_ADDRESS;
const protocol = config.LINNIA_IPFS_PROTOCOL;
const port = config.LINNIA_IPFS_PORT;
const host = config.LINNIA_IPFS_HOST;

const ipfs = new IPFS({ host: host, port: port, protocol: protocol });
const linnia = new Linnia(web3, ipfs, { hubAddress });

const gasPrice = 20000000000;
const gas = 500000;

function utilsIpfsDownloadAndDecrypt_callback(ipfsDataUri, privkey, cb) {
  ipfs.cat(ipfsDataUri, async (err, ipfsRes) => {
    if(err){
      cb(err, null, ipfsRes)
    }else{
      console.log('utilsIpfsDownloadAndDecrypt_callback.decrypt(privkey,ipfsRes)=', {privkey, ipfsRes})
      decrypt(privkey, ipfsRes)
      .then(result => { cb(null, result, ipfsRes) })
      .catch(e => { cb(err, null, ipfsRes) })
    }
  });
}

function hashCode(s) {
  var h = 0, l = s.length, i = 0;
  if ( l > 0 )
    while (i < l)
      h = (h << 5) - h + s.charCodeAt(i++) | 0;
  return h;
};

class LinniaJsGetPermission extends Component {
  state = {
    dataHash: '',
    viewer: ''
  }

  handleChangeDataHash = async (event) => {
    this.setState({ dataHash: event.target.value });
    await this.lookupLinniaJsPermission(this, event.target.value, this.state.viewer)
  }

  handleChangeViewer = async (event) => {
    this.setState({ viewer: event.target.value })
    await this.lookupLinniaJsPermission(this, this.state.dataHash, event.target.value)
  }

  lookupLinniaJsPermission = async (that, dataHash, viewerAddress) => {
    if(dataHash && viewerAddress){
      const permission = await linnia.getPermission(dataHash, viewerAddress);
      that.setState({ result: JSON.stringify({ permission }) })
    }
  }

  render() {
    return (<div>
      <h3>linnia-js getPermission(dataHash, viewer) util</h3>
      <p>Data hash <textarea rows="4" cols="50" value={this.state.dataHash} onChange={this.handleChangeDataHash} /></p>
      <p>ETH @ <textarea rows="4" cols="50" value={this.state.viewer} onChange={this.handleChangeViewer} /></p>
      <p>Result <textarea rows="4" cols="50" value={this.state.result} /></p>
    </div>)
  }
}

class LinniaJsGetRecord extends Component {
  state = {
    dataHash: '',
  }

  handleChangeDataHash = async (event) => {
    this.setState({ dataHash: event.target.value });
    const record = await linnia.getRecord(event.target.value)
    if(record){
      try{
        const result = JSON.stringify({owner: record.owner, metadataHash: record.metadataHash, dataUri: record.dataUri, timestamp: record.timestamp})
        this.setState({result})
      } catch(e) {
        this.setState({result: e})
      }
    }
  };

  render() {
    return (<div>
      <h3>linnia-js getRecord(dataHash) util</h3>
      <p>Data hash <textarea rows="4" cols="50" value={this.state.dataHash} onChange={this.handleChangeDataHash} /></p>
      <p>Result <textarea rows="4" cols="50" value={this.state.result} /></p>
    </div>)
  }
}

class LinniaPermission extends Component {
  state = {
    status: [],
    ipfsDataUri: '',
    ipfsDownloadDecryptPrivKey: '',
    ipfsData: '',
  };

  componentDidMount() {
    const that = this;
    web3.eth.getAccounts().then(accounts => {
      const userAddress = accounts[0]

      linnia.getPermission(this.props.eventHash, userAddress)
      .then(linniaPermission => {
        if(linniaPermission && linniaPermission.canAccess && linniaPermission.dataUri){
          that.setState({dataUri: linniaPermission.dataUri, canAccess: linniaPermission.canAccess, userAddress})
        } else {
          that.setState({userAddress})
        }
      })
    })
  }

  render() {
    return (<div>
      <p>linniaPermission dataUri={this.state.dataUri} canAccess={this.state.canAccess} userAddress={this.state.userAddress}</p>
    </div>)
  }

}

class Separator extends Component {
  render() {
    return ( <hr/> )
  }
}

class IpfsUpload extends Component {

  handleOnClick = (event) => {
    const data = this.props.data
    console.log('IpfsUpload', {data})
    this.upload(data)
    .then(this.props.then)
    .catch(this.props.catch)
  }

  upload = (data) => {
    console.log('IpfsUpload.upload', {data})
    return new Promise((resolve, reject) => {
      ipfs.add(data, (err, ipfsRed) => {
        err ? reject(err) : resolve(ipfsRed);
      })
    })
  }

  render() {
    return (<p><button onClick={this.handleOnClick}>upload encrypted text to ipfs</button></p>)
  }
}

class IpfsDownloadAndDecrypt extends Component {
  state = {
    dataUri: '',
    privKey: '',
    ipfsData: '',
    addStatus: this.props.addStatus
  };

  handleChangeDataUri = event => {
    this.setState({ dataUri: event.target.value });
  };

  handleChangePrivKey = event => {
    this.setState({ privKey: event.target.value });
  };

  handleOnIpfsClick = event => {
    this.ipfsDataDownload(this.state.dataUri, this.state.privKey)
  }

  ipfsDataDownload = (dataUri, privkey) => {
    console.log('loading event ipfs {dataUri, privkey}=', {dataUri, privkey})

    // Use ipfs library to pull the encrypted data down from IPFS
    utilsIpfsDownloadAndDecrypt_callback(dataUri, privkey, (err, clear, data) => {
      if(err){
        console.log('ipfs download+decrypt.failed. reason='+err.message)
        this.setState({ ipfsData: err, ipfsDataDecrypted: '' })
      }else{
        if(clear){
          console.log('ipfs download+decrypt.ok1')
          this.setState({ ipfsData: data, ipfsDataDecrypted: clear })
        } else {
          console.log('ipfs download+decrypt.ok2')
          this.setState({ ipfsData: data, ipfsDataDecrypted: '' })
        }
      }
    })
  }

  render() {
    return (
      <div>
        <h3>IPFS Download & Decrypt util</h3>
        <p>ipfs uri <textarea rows="4" cols="50" value={this.state.dataUri} onChange={this.handleChangeDataUri} /></p>
        <p>private key <textarea rows="4" cols="50" value={this.state.privKey} onChange={this.handleChangePrivKey} /></p>
        <p><button onClick={this.handleOnIpfsClick}>get ipfs data</button></p>
        <p>Ipfs data <textarea rows="4" cols="50" value={this.state.ipfsData} /></p>
        <p>Ipfs data decrypted <textarea rows="4" cols="50" value={this.state.ipfsDataDecrypted} /></p>
      </div>
    )
  }
}

class Decryptor extends Component {
  state = { decryptMe: '', privKey: '', result: '' };

  handleChange_decryptMe = event => {
    this.setState({ decryptMe: event.target.value });
    this.myDecrypt(event.target.value, this.state.privKey)
  };

  handleChange_privateKey = event => {
    this.setState({ privKey: event.target.value });
    this.myDecrypt(this.state.decryptMe, event.target.value)
  };

  myDecrypt = async (decryptMe, privateKey) => {
    if(decryptMe && privateKey){
      try {
        const result = await decrypt(privateKey, decryptMe);
        this.setState({ result });
      } catch (e) {
        this.setState({ result: e });
      }
    }
  };

  render() {
    return (<div>
      <h3>Decrypt util</h3>
      <ul>
        <li>decrypt this text <textarea rows="4" cols="50" value={this.state.decryptMe} onChange={this.handleChange_decryptMe} /> </li>
        <li>private key <textarea rows="4" cols="50" value={this.state.privKey} onChange={this.handleChange_privateKey} /> </li>
        <li>decrypted as <textarea rows="4" cols="50" value={this.state.result}/></li>
      </ul>
    </div>)
  }
 }

class Encryptor extends Component {
  constructor(props) {
    super(props);

    let pubkey;
    if (props.pubkey === undefined){
      pubkey = props.pubkey;
    } else {
      pubkey = '';
    }

    let result;
    if (props.result === undefined){
      result = props.result;
    } else {
      result = '';
    }

    let plaintext;
    if (props.plaintext === undefined){
      plaintext = props.plaintext;
    } else {
      plaintext = '';
    }

    this.state = { plaintext, result, pubkey };
    //this.handleChange_plaintext = this.handleChange_plaintext.bind(this)
    //this.handleChange_pubkey = this.handleChange_pubkey.bind(this)
  }

  handleChange_plaintext = event => {
    this.setState({ plaintext: event.target.value });
    this.myEncrypt(event.target.value, this.state.pubkey)
  };

  handleChange_pubkey = event => {
    this.setState({ pubkey: event.target.value })
    //this.setState({ pubkey: event.target.value });
    this.myEncrypt(this.state.plaintext, event.target.value)
  };

  myEncrypt = async (input, pubkey) => {
    if(input && pubkey){
      try {
        const result = await encrypt(pubkey, input);
        this.setState({ result });
        if(this.props.onChangeResult){
          this.props.onChangeResult(result)
        }
      } catch (e) {
        this.setState({ result: e });
        if(this.props.onChangeResult){
          this.props.onChangeResult(e)
        }
      }
    }
  };

  render() {
    return (<div>
      <h3>Encrypt util</h3>
      <ul>
        <li>encrypt this text <textarea rows="4" cols="50" value={this.state.plaintext} onChange={this.handleChange_plaintext} /> </li>
        <li>public key <textarea rows="4" cols="50" value={this.state.pubkey} onChange={this.handleChange_pubkey} /> </li>
        <li>encrypted as <textarea rows="4" cols="50" value={this.state.result} /></li>
      </ul>
    </div>)
  }
}

export default class Debugging extends Component {

  constructor(props) {
      super(props);

      this.state = {
        status:[],
        eventHash:'',

        organizer: '',

        ipfsUploadInput:'',
        ipfsUploadUri:'',
        linniaRecordDataHash: '',
        linniaRecordPermission: '',
        linniaRecordPermissionDetails: '',
        linniaRecordPermissionToEthAddress: '',
        linniaRecordPermissionPubKey: '',
        linniaRecordPermissionMyPrivateKey: '',
        linniaRecordPermissionDataReEncrypted: '',

        makerPubKey: '',
      }

      this.handleOnCleanStatusClick = this.handleOnCleanStatusClick.bind(this)
      this.handleOnIpfsUploadClick = this.handleOnIpfsUploadClick.bind(this)
      this.handleOnLinniaCreateRecordClick = this.handleOnLinniaCreateRecordClick.bind(this)
      this.handleOnLinniaCreateRecordPermissionClick = this.handleOnLinniaCreateRecordPermissionClick.bind(this)
      this.handleChangeLinniaRecordPermissionToEthAddress = this.handleChangeLinniaRecordPermissionToEthAddress.bind(this)
      this.handleChangeLinniaRecordPermissionPublicKey = this.handleChangeLinniaRecordPermissionPublicKey.bind(this)
      this.handleChangeLinniaRecordPermissionMyPrivateKey = this.handleChangeLinniaRecordPermissionMyPrivateKey.bind(this)
      this.addStatus = this.addStatus.bind(this)
      this.handleEncryptorResultIpfsUpload = this.handleEncryptorResultIpfsUpload.bind(this)
    }

    addStatus(msg) {
      this.setState({ status: [msg, ...this.state.status] })
    }

    handleOnCleanStatusClick(){
      this.setState({status: []})
    }

    async componentDidMount(){
        var organizer = await SecretEventOrg.methods.organizer().call()
        var eventHash = await SecretEventOrg.methods.currentEventHash().call()
        this.setState({eventHash, organizer})
    }

    /*handleChangeIpfsUploadInput(event) {
      const input = event.target.value
      this.setState({ipfsUploadInput: input})
    }*/

    handleOnIpfsUploadClick(event) {
      console.log('handleOnIpfsUploadClick',this.state.ipfsUploadInput)
      this.ipfsDataUploadPromise(this.state.ipfsUploadInput)
      .then(uri => {
        this.setState({status: ['ipfs upload success. uri='+uri, ...this.state.status], ipfsUploadResult: 'OK', ipfsUploadUri:uri })
      })
      .catch(e => {
        this.setState({status: ['ipfs upload failed'+e.message, ...this.state.status], ipfsUploadResult: 'FAILURE', ipfsUploadUri:''})
      })
    }

    ipfsDataUploadPromise(data){
      return new Promise((resolve, reject) => {
        ipfs.add(data, (err, ipfsRed) => {
          err ? reject(err) : resolve(ipfsRed);
        });
      });
    }

    handleOnLinniaCreateRecordClick(event){
      this.linniaCreateRecord(this.state.ipfsUploadUri, 'mickDebug')
    }

    async linniaCreateRecord(dataUri, metadata){
      const accounts = await web3.eth.getAccounts();
      const dataHash = await linnia.web3.utils.sha3(dataUri);

      try {
        const { records } = await linnia.getContractInstances();
        this.setState({linniaRecordDataHash:'processing transaction...'})
        await records.addRecord(dataHash, metadata, dataUri, { from: accounts[0] });
        this.setState({status: ["linnia record created with dataHash="+dataHash, ...this.state.status], linniaRecordDataHash:dataHash})
      } catch (err) {
        this.setState({status: ["linnia record creation failed. reason="+err.message, ...this.state.status], linniaRecordDataHash:err})
      }
    }

    handleChangeLinniaRecordPermissionMyPrivateKey(event) {
      this.setState({linniaRecordPermissionMyPrivateKey: event.target.value})
    }

    async handleOnLinniaCreateRecordPermissionClick(event){
      console.log('handleOnLinniaCreateRecordPermissionClick')

      const linniaJsRecordDataHashResult_obj = await linnia.getRecord(this.state.linniaRecordDataHash)
      // linniaJsRecordDataHashResult_obj.dataUri

      const that = this;

      async function cb(err, result, data) {
        if(err){
          that.setState({status: ['handleOnLinniaCreateRecordPermissionClick. ipfs download+decrypt.failed. reason='+err.message, ...that.state.status]})
          console.log('utilsIpfsDownloadAndDecrypt_callback', err)
          return
        }

        that.setState({status: ['handleOnLinniaCreateRecordPermissionClick. ipfs download+decrypt.ok='+result, ...that.state.status]})

        console.log('handleOnLinniaCreateRecordPermissionClick.cb.decrypteddatafromipfs', result)
        const encryptResult = await encrypt(that.state.linniaRecordPermissionPublicKey, result);
        that.setState({linniaRecordPermissionDataReEncrypted: encryptResult})
        console.log('linniaRecordPermissionDataReEncrypted', encryptResult)

        that.ipfsDataUploadPromise(encryptResult)
        .then(async (uri) => {
          console.log('handleOnLinniaCreateRecordPermissionClick', 'ipfsDataUploadPromise', uri)
          const [owner] = await web3.eth.getAccounts()
          const dataHash = that.state.linniaRecordDataHash
          const viewerEthereumAddress = that.state.linniaRecordPermissionToEthAddress
          await that.linniaCreateRecordPermission(dataHash, viewerEthereumAddress, uri, owner)
        })
        .catch(e => console.log)
      }

      utilsIpfsDownloadAndDecrypt_callback(linniaJsRecordDataHashResult_obj.dataUri, this.state.linniaRecordPermissionMyPrivateKey, cb)
    }

    async linniaCreateRecordPermission(dataHash, viewerEthereumAddress, ipfsDataUri, owner){
      // Create a new permissions record on the blockchain
      try {
        const { permissions } = await linnia.getContractInstances();

        this.setState({linniaRecordPermissionDetails:'dataHash='+dataHash+', viewerEthereumAddress='+viewerEthereumAddress+', ipfsDataUri='+ipfsDataUri+', owner='+owner})
        this.setState({linniaRecordPermission:'processing transaction...'})
        await permissions.grantAccess(dataHash, viewerEthereumAddress, ipfsDataUri, {
          from: owner,
          gasPrice,
          gas,
        });
        this.setState({linniaRecordPermission: "OK"})
      } catch (e) {
        this.setState({linniaRecordPermission: e})
      }
    }

    async handleChangeLinniaRecordPermissionPublicKey(event) {
      const linniaRecordPermissionPublicKey = event.target.value
      console.log('handleChangeLinniaRecordPermissionPublicKey', linniaRecordPermissionPublicKey)
      this.setState({linniaRecordPermissionPublicKey})
    }

    async handleChangeLinniaRecordPermissionToEthAddress(event) {
      const ethAddress = event.target.value
      console.log('handleChangeLinniaRecordPermissionToEthAddress', ethAddress)
      this.setState({linniaRecordPermissionToEthAddress: ethAddress})
    }

    handleEncryptorResultIpfsUpload(result) {
      this.setState({ipfsUploadInput: result})
    }

    render() {
        const status = this.state.status.map(s => {
          return (<li key={hashCode(s)}>{s}</li>)
        })

        const that = this

        console.log('this.state.ipfsUploadInput=', this.state.ipfsUploadInput)
        const ipfsUploadInput = this.state.ipfsUploadInput
        const ipfsUploadThen = (uri) => {
          console.log('ipfs upload success. ', {uri})
          //this.addStatus('ipfs upload success. uri='+uri)
          that.setState({ ipfsUploadResult: 'OK', ipfsUploadUri:uri })
        }
        const ipfsUploadCatch = (e) => {
          //this.addStatus('ipfs upload failed'+e.message)
          console.log('ipfs upload failed', e)
          that.setState({ ipfsUploadResult: 'FAILURE', ipfsUploadUri:'' })
        }

        //<p><button onClick={this.handleOnIpfsUploadClick}>upload encrypted text to ipfs</button></p>

        return (
            <div>

              <Separator />
              <div>
                <ul>
                  {status}
                  <li><button onClick={this.handleOnCleanStatusClick}>clean status</button></li>
                </ul>
              </div>

              <Separator />
              <div>
                <ul>
                  <li>eventHash is {this.state.eventHash}</li>
                  <li>organizer is {this.state.organizer}</li>
                </ul>
              </div>

              <Separator />
              <Encryptor />

              <Separator />
              <Decryptor />

              <Separator />
              <LinniaPermission eventHash={this.state.eventHash} />

              <Separator />
              <IpfsDownloadAndDecrypt />

              <Separator />
              <LinniaJsGetRecord />

              <Separator />
              <LinniaJsGetPermission />

              <Separator />
              <div>
                <h1>Upload... then create linnia record and permission</h1>

                <p>enter your message and public key</p>
                <Encryptor pubkey={this.state.makerPubKey} onChangeResult={this.handleEncryptorResultIpfsUpload} />

                <IpfsUpload data={ipfsUploadInput} then={ipfsUploadThen} catch={ipfsUploadCatch} />

                <p>{this.state.ipfsUploadResult} {this.state.ipfsUploadUri}</p>
                { this.state.ipfsUploadResult && this.state.ipfsUploadResult.startsWith("OK") &&
                  <div>
                    <h1>Upload DONE, now create linnia record... then permission</h1>
                    <p><button onClick={this.handleOnLinniaCreateRecordClick}>create linnia record</button></p>
                    <p>linnia record dataHash {this.state.linniaRecordDataHash}</p>
                  </div>
                }
                { this.state.linniaRecordDataHash &&
                  <div>
                    <h1>Upload and record DONE... now give permission</h1>
                    <p>ETH @ <textarea rows="4" cols="50" value={this.state.linniaRecordPermissionToEthAddress} onChange={this.handleChangeLinniaRecordPermissionToEthAddress} /> </p>
                    <p>Public key <textarea rows="4" cols="50" value={this.state.linniaRecordPermissionPublicKey} onChange={this.handleChangeLinniaRecordPermissionPublicKey} /> </p>
                    <p>Private key to decrypt ipfs data <textarea rows="4" cols="50" value={this.state.linniaRecordPermissionMyPrivateKey} onChange={this.handleChangeLinniaRecordPermissionMyPrivateKey} /> </p>
                    <p>Encrypted data <textarea rows="4" cols="50" value={this.state.linniaRecordPermissionDataReEncrypted} /> </p>
                    <p><button onClick={this.handleOnLinniaCreateRecordPermissionClick}>create linnia record permission</button></p>
                    <p>the linnia record permission {this.state.linniaRecordPermission}</p>
                  </div>
                }
              </div>

            </div>
        );
    }
}
