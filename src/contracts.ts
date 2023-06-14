import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

export const Committee: Bytes            =     Bytes.fromByteArray(ByteArray.fromHexString("0x4C5e687CE5a365ce7bE9E536cf617D3D08Aadde3"));
export const SPStakingFactory: Bytes     =     Bytes.fromByteArray(ByteArray.fromHexString('0x37921DB31E88e80AC43fD285AE60230065b9E87C'));
export const ERC20StakingFactory: Bytes  =     Bytes.fromByteArray(ByteArray.fromHexString('0x7Be1085298446c041f72db9f50cd3953638B023a'));
export const CosmosStakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0x8Ea8870001216429f72CEA80fEE576dfe883E5bD'));
export const ERC1155StakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0xBab99d73D20DE32D0f674dA58390b4C904654C19'));
