import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

export const Committee: Bytes            =     Bytes.fromByteArray(ByteArray.fromHexString("0x524d1C459DE80820D8EeeDdbeB891799c5523C85"));
export const SPStakingFactory: Bytes     =     Bytes.fromByteArray(ByteArray.fromHexString('0x9Df9D7412E4462AA863A35B54142d1D35F07b214'));
export const ERC20StakingFactory: Bytes  =     Bytes.fromByteArray(ByteArray.fromHexString('0xF897E61D2bd4002B5dE45026f6a9F5b4704Cb8Be'));
export const CosmosStakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0xbe1709B3D175aaecA132BEA8630063E99f090D68'));
export const ERC1155StakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0x54301D1dc7751B1824cF3020a3f479112caD738c'));