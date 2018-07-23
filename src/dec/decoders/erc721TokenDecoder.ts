import Contract from 'web3/eth/contract';
import EthqlAccount from '../../model/core/EthqlAccount';
import EthqlTransaction from '../../model/core/EthqlTransaction';
import { EthqlContext } from '../../model/EthqlContext';
import { DecoderDefinition } from '../types';
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
  tokenContract: ERC721TokenContract;
  sender: EthqlAccount;
}

interface ERC721Transfer extends ERC721Transaction {
  from: ERC721TokenHolder;
  to: ERC721TokenHolder;
  tokenID: number;
}

interface ERC721Approve extends ERC721Transaction {
  approved: ERC721TokenHolder;
  tokenID: number;
}

interface ERC721setApprovalForAll extends ERC721Transaction {
  operator: ERC721TokenHolder;
  approved: boolean;
}

type ERC721TransferEvent = {
  from: ERC721TokenHolder;
  to: ERC721TokenHolder;
  tokenID: number;
};

type ERC721ApprovalEvent = {
  owner: ERC721TokenHolder;
  approved: ERC721TokenHolder;
  tokenID: number;
};

type ERC721ApprovalForAllEvent = {
  owner: ERC721TokenHolder;
  operator: ERC721TokenHolder;
  approved: boolean;
};

type ERC721TxBindings = {
  safeTransferFrom: ERC721Transfer;
  transferFrom: ERC721Transfer;
  approve: ERC721Approve;
  setApprovalForAll: ERC721setApprovalForAll;
};

type ERC721LogBindings = {
  transfer: ERC721TransferEvent;
  approval: ERC721ApprovalEvent;
  approvalForAll: ERC721ApprovalForAllEvent;
};

class ERC721TokenDecoder implements DecoderDefinition<ERC721TxBindings, ERC721LogBindings> {
  public readonly entity = 'token';
  public readonly standard = 'ERC721';
  public readonly abiDecoder = createAbiDecoder(__dirname + '../../../abi/erc721.json');

  public readonly txTransformers = {
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
      const operator = extractParamValue(decoded.params, '_operator');
      return {
        tokenContract,
        sender: tx.from,
        operator: new ERC721TokenHolder(operator, tokenContract),
        approved: extractParamValue(decoded.params, '_approved'),
      };
    },
  };

  public readonly logTransformers = {
    transfer: (decoded: any, tx: EthqlTransaction, context: EthqlContext): ERC721TransferEvent => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const from = new EthqlAccount(extractParamValue(decoded.events, '_from'));
      const to = new EthqlAccount(extractParamValue(decoded.events, '_to'));

      return {
        from: new ERC721TokenHolder(from, tokenContract),
        to: new ERC721TokenHolder(to, tokenContract),
        tokenID: extractParamValue(decoded.events, '_tokenId'),
      };
    },

    approval: (decoded: any, tx: EthqlTransaction, context: EthqlContext): ERC721ApprovalEvent => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const owner = new EthqlAccount(extractParamValue(decoded.events, '_owner'));
      const approved = new EthqlAccount(extractParamValue(decoded.events, '_approved'));

      return {
        owner: new ERC721TokenHolder(owner, tokenContract),
        approved: new ERC721TokenHolder(approved, tokenContract),
        tokenID: extractParamValue(decoded.events, '_tokenId'),
      };
    },

    approvalForAll: (decoded: any, tx: EthqlTransaction, context: EthqlContext): ERC721ApprovalForAllEvent => {
      const tokenContract = new ERC721TokenContract(tx.to, context);
      const owner = new EthqlAccount(extractParamValue(decoded.events, '_owner'));
      const operator = new EthqlAccount(extractParamValue(decoded.events, '_operator'));

      return {
        owner: new ERC721TokenHolder(owner, tokenContract),
        operator: new ERC721TokenHolder(operator, tokenContract),
        approved: extractParamValue(decoded.events, '_tokenId'),
      };
    },
  };
}

export default ERC721TokenDecoder;
