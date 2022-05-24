import { Pool, Community, UserOperationHistory, User } from '../generated/schema';
import { AStarDappStakingCreated } from '../generated/AstarDappStakingFactory/AstarDappStakingFactory'
import { AstarDappStakingTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { AstarDappStakingFactory } from "./contracts"
import { BigInt, log, ByteArray, Bytes } from '@graphprotocol/graph-ts';

// event AStarDappStakingCreated(address indexed pool, address indexed community, string name, address dapp);
export function handleAStarDappStakingCreated(event: AStarDappStakingCreated): void {
    let walnut = getWalnut();
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // create new pool contract
    log.info('[AstarDappStaking]: Create new pool:{} community:{} name:{} dapp:{} ', [
        event.params.pool.toHex(),
        event.params.community.toHex(),
        event.params.name.toString(),
        event.params.dapp.toHex()
    ])
    AstarDappStakingTemplate.create(event.params.pool);
    let poolId = event.params.pool.toHex();
    let pool = Pool.load(poolId);
    if (!pool) {
        pool = new Pool(poolId);
    }
    pool.createdAt = event.block.timestamp;
    pool.status = 'OPENED';
    pool.name = event.params.name;
    pool.poolFactory = AstarDappStakingFactory;
    pool.community = event.params.community.toHex();
    pool.asset = event.params.dapp;
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
    
    walnut.totalPools += 1;
    walnut.save();
}