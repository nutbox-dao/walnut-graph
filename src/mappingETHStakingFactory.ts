import { Pool, Community, UserOperationHistory, User } from '../generated/schema';
import { ETHStakingCreated } from '../generated/ETHStakingFactory/ETHStakingFactory';
import { ETHStakingTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { ETHStakingFactory } from "./contracts"
import { BigInt, log, ByteArray, Bytes } from '@graphprotocol/graph-ts';
import { getOpCount } from './utils'

// event ETHStakingCreated(
//     address indexed pool,
//     address indexed community,
//     string name
// );
export function handleETHStakingCreated(event: ETHStakingCreated): void {
    let walnut = getWalnut();
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // create new pool contract
    log.info('[ERC20StakingFactory]: Create new pool:{} community:{} name:{}', [
        event.params.pool.toHex(),
        event.params.community.toHex(),
        event.params.name.toString()
    ])
    ETHStakingTemplate.create(event.params.pool);
    let poolId = event.params.pool.toHex();
    let pool = Pool.load(poolId);
    if (!pool) {
        pool = new Pool(poolId);
    }
    pool.createdAt = event.block.timestamp;
    pool.status = 'OPENED';
    pool.name = event.params.name;
    pool.poolFactory = ETHStakingFactory;
    pool.community = event.params.community.toHex();
    pool.asset = new Bytes(0);
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