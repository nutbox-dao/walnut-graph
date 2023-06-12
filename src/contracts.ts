import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

export const Committee: Bytes            =     Bytes.fromByteArray(ByteArray.fromHexString("0xA643e598364A9dFB3328aD2E70AF6f9E3C477A42"));
export const SPStakingFactory: Bytes     =     Bytes.fromByteArray(ByteArray.fromHexString('0x183434ba0726b244521cB1C46AE5C90538146db8'));
export const ERC20StakingFactory: Bytes  =     Bytes.fromByteArray(ByteArray.fromHexString('0x420E3b63F2587702B0BCdc50aF948cF387515593'));
export const CosmosStakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0xFe992EF5f73Ac289052F1742B918278a62686fD1'));
export const ERC1155StakingFactory: Bytes =     Bytes.fromByteArray(ByteArray.fromHexString('0x20ABc409b7dc7a6DC8cC1309A5A7DBb5B1c0D014'));
