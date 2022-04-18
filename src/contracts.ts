import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

export const Committee: Bytes            =     Bytes.fromByteArray(ByteArray.fromHexString("0xd10e4C1e301A13A9B874bd1757c135Eda075769D"));
export const SPStakingFactory: Bytes     =     Bytes.fromByteArray(ByteArray.fromHexString('0xF7Fa41BF814eDC767691DDB1864a334D83f4acf7'));
export const ERC20StakingFactory: Bytes  =     Bytes.fromByteArray(ByteArray.fromHexString('0xf870724476912057C807056b29c1161f5Fe0199a'));
export const CosmosStakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0xAD6a0c0017559d051264e1657d627107d6b12f0d