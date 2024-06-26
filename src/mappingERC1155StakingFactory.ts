import { Pool, Community, UserOperationHistory, User } from '../generated/schema';
import { ERC1155StakingCreated } from '../generated/ERC1155StakingFactory/ERC1155StakingFactory'
import { ERC1155StakingTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { ERC1155StakingFactory } from "./contracts"
import { BigInt, log, ByteArray, Bytes } from '@graphprotocol/graph-ts';
import { formatOddString, getOpCount } from './utils'

let Zero = new BigInt(0);
// event ERC1155StakingCreated(
//     address indexed pool,
//     address indexed community,
//     string name,
//     address indexed erc1155Token,
//     uint256 id
// );
export function handleERC1155StakingCreated(event: ERC1155StakingCreated): void {
    let walnut = getWalnut();
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // create new pool contract
    log.info('[ERC1155StakingFactory]: Create new pool:{} community:{} name:{} token:{} id:{}', [
        event.params.pool.toHex(),
        event.params.community.toHex(),
        event.params.name.toString(),
        event.params.erc1155Token.toHex(),
        event.params.id.toString()
    ])
    ERC1155StakingTemplate.create(event.params.pool);
    let poolId = event.params.pool.toHex();
    let pool = Pool.load(poolId);
    if (!pool) {
        pool = new Pool(poolId);
        pool.poolIndex = 0;
        pool.ratio = 0;
        pool.totalAmount = Zero;
        pool.stakers = [];
        pool.stakersCount = 0;
        pool.hasCreateGauge = 0;
        pool.voters = [];
        pool.votersCount = 0;
        pool.votedAmount = Zero;
    }
    pool.createdAt = event.block.timestamp;
    pool.status = 'OPENED';
    pool.name = event.params.name;
    pool.poolFactory = ERC1155StakingFactory;
    pool.community = event.params.community.toHex();
    
    pool.asset = Bytes.fromByteArray(ByteArray.fromHexString(event.params.erc1155Token.toHexString() + formatOddString(event.params.id.toHexString().substring(2))));
    pool.tvl = BigInt.zero();
    pool.save();
    
    // add pool to community
    let pools = community.pools;
    pools.push(pool.id);
    community.poolsCount++;
    community.pools = pools;

    // add community and pool operator history
    let historyId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
    let communityHistory = new UserOperationHistory(historyId);
    let index = getOpCount();
    communityHistory.index = index;
    communityHistory.type = "ADMINADDPOOL";
    communityHistory.community = community.id;
    communityHistory.poolFactory = pool.poolFactory;
    communityHistory.pool = pool.id;
    communityHistory.user = Bytes.fromByteArray(ByteArray.fromHexString(community.owner));

    communityHistory.tx = event.transaction.hash;
    communityHistory.timestamp = event.block.timestamp;

    communityHistory.save();
    
    let historys = community.operationHistory;
    historys.push(historyId);
    community.operationHistory = historys;
    community.operationCount++;
    community.save();

    let user = User.load(community.owner);
    if (!user) {
        return;
    }
    historys = user.operationHistory;
    historys.push(historyId);
    user.operationHistory = historys;
    user.operationCount++;
    user.save();

    // add new stake asset
    let allAssets = walnut.stakeAssets;
    if (!allAssets.includes(pool.asset)){
        allAssets.push(pool.asset);
        walnut.stakeAssets = allAssets;
    }
    walnut.totalPools += 1;
    walnut.save();
}

