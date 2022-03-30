import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

export const Committee: Bytes            =     Bytes.fromByteArray(ByteArray.fromHexString("0x5288DA783695DAb739ab5e1d7BF0d4920667809B"));
export const SPStakingFactory: Bytes     =     Bytes.fromByteArray(ByteArray.fromHexString('0x6383b535e7EC5f24aC1e9cf32fca6cbFa8fD251B'));
export const ERC20StakingFactory: Bytes  =     Bytes.fromByteArray(ByteArray.fromHexString('0x1AC355145e523C1295D5AB8cC6f37087E286B94E'));
export const CosmosStakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0x1E2f12267D587c571ba147193DB94ED64C7e269f'));