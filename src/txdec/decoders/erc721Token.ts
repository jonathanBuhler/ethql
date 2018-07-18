import Contract from 'web3/eth/contract';
import EthqlAccount from '../../model/core/EthqlAccount';
import EthqlTransaction from '../../model/core/EthqlTransaction';
import { EthqlContext } from '../../model/EthqlContext';
import { TxDecoderDefinition } from '../types';
import { createAbiDecoder, extractParamValue } from '../utils';

class ERC721TokenContract {
  private static ABI = require(__dirname + '../../../abi/erc721.json');
  private contract: Contract;

  constructor(public readonly account: EthqlAccount, readonly context: EthqlContext) {
    this.contract = new context.web3.eth.Contract(ERC721TokenContract.ABI, account.address);
  }

  public async symbol() {
    return this.contract.methods
      .symbol()
      .call()
      .catch(() => undefined);
  }

  public async totalSupply() {
    return this.contract.methods
      .totalSupply()
      .call()
      .catch(() => undefined);
  }

  public async balanceOf({ address }: { address: string }) {
    return this.contract.methods
      .balanceOf(address)
      .call()
      .catch(() => undefined);
  }
}

class ERC721TokenHolder {
  constructor(public readonly account: EthqlAccount, private readonly contract: ERC721TokenContract) {}
}

interface ERC721Transaction {
  tokenContract: ERC721TokenContract
  sender: EthqlAccount
}

interface ERC721Transfer extends ERC721Transaction {
  from: ERC721TokenHolder
  to: ERC721TokenHolder
  tokenID: number
}

interface ERC721Approve extends ERC721Transaction {
  approved: ERC721TokenHolder
  tokenID: number
}

interface ERC721setApprovalForAll extends ERC721Transaction {
  operator: ERC721TokenHolder
  approved: boolean
}

type ERC721Bindings = {
  safeTransferFrom: ERC721Transfer;
  transferFrom: ERC721Transfer;
  approve: ERC721Approve;
  setApprovalForAll: ERC721setApprovalForAll;
}


class ERC721Token implements TxDecoderDefinition<ERC721Bindings> {
  public readonly entity = 'token';
  public readonly standard = 'ERC721';
  public readonly decoder = createAbiDecoder(__dirname + '../../../abi/erc721.json');

  public readonly transformers = {
    safeTransferFrom: (decoded: any, tx: EthqlTransaction, context: EthqlContext) => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const from = new EthqlAccount(extractParamValue(decoded.params, '_from'));
      const to = new EthqlAccount(extractParamValue(decoded.params, '_to'));

      return {
        tokenContract,
        sender: tx.from,
        from: new ERC721TokenHolder(from, tokenContract),
        to: new ERC721TokenHolder(to, tokenContract),
        tokenID: extractParamValue(decoded.params, '_tokenId'),
      };
    },

    transferFrom: (decoded: any, tx: EthqlTransaction, context: EthqlContext) => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const from = new EthqlAccount(extractParamValue(decoded.params, '_from'));
      const to = new EthqlAccount(extractParamValue(decoded.params, '_to'));

      return {
        tokenContract,
        sender: tx.from,
        from: new ERC721TokenHolder(from, tokenContract),
        to: new ERC721TokenHolder(to, tokenContract),
        tokenID: extractParamValue(decoded.params, '_tokenId'),
      };
    },

    approve: (decoded: any, tx: EthqlTransaction, context: EthqlContext) => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const approved = new EthqlAccount(extractParamValue(decoded.params, '_approved'));
      return {
        tokenContract,
        sender: tx.from,
        approved: new ERC721TokenHolder(approved, tokenContract),
        tokenID: extractParamValue(decoded.params, '_tokenId'),
      };
    },

    setApprovalForAll: (decoded: any, tx: EthqlTransaction, context: EthqlContext) => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const operator = extractParamValue(decoded.params, '_operator')
      return {
        tokenContract,
        sender: tx.from,
        operator: new ERC721TokenHolder(operator, tokenContract),
        approved: extractParamValue(decoded.params, '_approved'),
      };
    }
  }
}

export default ERC721Token;
