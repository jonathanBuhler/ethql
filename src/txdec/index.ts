import Erc20Token from './decoders/Erc20Token';
import ERC721Token from './decoders/erc721Token'
import { SimpleTxDecodingEngine } from './engines/SimpleTxDecodingEngine';
import { TxDecodingEngine } from './types';

// Create the engine.
const engine = new SimpleTxDecodingEngine();

// Register all decoders.
engine.register(new Erc20Token());
engine.register(new ERC721Token());

// Export the engine, making only the decodeTransaction method visible.
export default engine as Pick<TxDecodingEngine, 'decodeTransaction'>;
