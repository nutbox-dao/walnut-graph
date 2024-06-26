import { Pool, Community, UserOperationHistory, User } from '../generated/schema';
import { CosmosStakingCreated } from '../generated/CosmosStakingFactory/CosmosStakingFactory'
import { CosmosStakingTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { CosmosStakingFactory } from "./contracts"
import { BigInt, log, ByteArray, Bytes } from '@graphprotocol/graph-ts';
import { getOpCount } from './utils'


let Zero = new BigInt(0);
// event CosmosStakingCreated(
//     address indexed pool,
//     address indexed community,
//     string name,
//     uint8 chainId,
//     address delegatee
// );
export function handleCosmosStakingCreated(event: CosmosStakingCreated): void {
    let walnut = getWalnut();
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // create new pool contract
    log.info('[CosmosStakingFactory]: Create new pool:{} community:{} name:{} chainId:{} delegatee:{}', [
        event.params.pool.toHex(),
        event.params.community.toHex(),
        event.params.name.toString(),
        event.params.chainId.toString(),
        event.params.delegatee.toHex()
    ])
    CosmosStakingTemplate.create(event.params.pool);
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
    pool.poolFactory = CosmosStakingFactory;
    pool.community = event.params.community.toHex();
    pool.asset = event.params.delegatee;
    pool.chainId = event.params.chainId;
    pool.tvl = BigInt.zero();
    pool.save();
    // add pool to community
    let pools = community.pools;
    community.poolsCount++;
    pools.push(pool.id);
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
    if(!user) {
        return;
    }
    historys = user.operationHistory;
    historys.push(historyId);
    user.operationHistory = historys;
    user.operationCount++;
    user.save();

    walnut.totalPools += 1;
    walnut.save();
}