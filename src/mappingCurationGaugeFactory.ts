import { Pool, Community, UserOperationHistory, User } from '../generated/schema';
import { CurationGaugeCreated } from '../generated/CurationGaugeFactory/CurationGaugeFactory'
import { CurationGaugeTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { CurationGaugeFactory } from "./contracts"
import { BigInt, log, ByteArray, Bytes, Address } from '@graphprotocol/graph-ts';
import { getOpCount } from './utils'


// event CurationGaugeCreated(
//     address indexed pool,
//     address indexed community,
//     string name,
//     address indexed recipient
// );
export function handleCurationGaugeCreated(event: CurationGaugeCreated): void {
    let walnut = getWalnut();
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // create new pool contract
    log.info('[CurationGaugeFactory]: Create new pool:{} community:{} name:{} recipient:{} ', [
        event.params.pool.toHex(),
        event.params.community.toHex(),
        event.params.name.toString(),
        event.params.recipient.toHex()
    ])
    
    CurationGaugeTemplate.create(event.params.pool);
    let poolId = event.params.pool.toHex();
    let pool = Pool.load(poolId);
    if (!pool) {
        pool = new Pool(poolId);
    }
    pool.createdAt = event.block.timestamp;
    pool.status = 'OPENED';
    pool.name = event.params.name;
    pool.poolFactory = CurationGaugeFactory;
    pool.community = event.params.community.toHex();
    pool.asset = event.params.recipient;
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
    // let allAssets = walnut.stakeAssets;
    // if (!allAssets.includes(pool.asset)){
    //     allAssets.push(pool.asset);
    //     walnut.stakeAssets = allAssets;
    // }

    walnut.totalPools += 1;
    walnut.save();
}
