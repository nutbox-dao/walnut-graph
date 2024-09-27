import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

export const Committee: Bytes            =     Bytes.fromByteArray(ByteArray.fromHexString("0xBab99d73D20DE32D0f674dA58390b4C904654C19"));
export const SPStakingFactory: Bytes     =     Bytes.fromByteArray(ByteArray.fromHexString('0xDFEDa0D7bddcFBB7Ba70a463fAa355A9f07c7c10'));
export const ERC20StakingFactory: Bytes  =     Bytes.fromByteArray(ByteArray.fromHexString('0x88505421EAA5A4542154bCcEe935f3E6afFe3BfD'));
export const ERC1155StakingFactory: Bytes =    Bytes.fromByteArray(ByteArray.fromHexString('0xd9Ee5A42C75Cc07f27Df9F4EE12D462715475A4f'));