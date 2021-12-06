import { Pool, Community, CommunityManageHistory } from '../generated/schema'
import { ERC20StakingCreated } from '../generated/ERC20StakingFactory/ERC20StakingFactory'
import { ERC20StakingTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { ERC20StakingFactory } from "./contracts"
import { BigInt, log } from '@graphprotocol/graph-ts';

// event ERC20StakingCreated(
//     address indexed pool,
//     address indexed community,
//     string name,
//     address erc20Token
// );
export function handleERC20StakingCreated(event: ERC20StakingCreated): void {
    let walnut = getWalnut();
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // create new pool contract
    log.info('[ERC20StakingFactory]: Create new pool:{} community:{} name:{} token:{} ', [
        event.params.pool.toHex(),
        event.params.community.toHex(),
        event.params.name.toString(),
        event.params.erc20Token.toHex()
    ])
    ERC20StakingTemplate.create(event.params.pool);
    let poolId = event.params.pool.toHex();
    let pool = Pool.load(poolId);
    if (!pool) {
        pool = new Pool(poolId);
    }
    pool.createdAt = event.block.timestamp;
    pool.status = 'OPENED';
    pool.name = event.params.name;
    pool.poolFactory = ERC20StakingFactory;
    pool.community = event.params.community.toHex();
    pool.asset = event.params.erc20Token;
    pool.tvl = BigInt.zero();
    pool.save();
    
    // add pool to community
    let pools = community.pools;
    pools.push(pool.id);
    community.pools = pools;

    // add community and pool operator history
    let historyId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
    let communityHistory = new CommunityManageHistory(historyId);
    communityHistory.type = "ADDPOOL";
    communityHistory.pool = pool.id;
    communityHistory.tx = event.transaction.hash;
    communityHistory.timestamp = event.block.timestamp;
    communityHistory.save();
    
    let historys = community.manageHistory;
    historys.push(historyId);
    community.manageHistory = historys;
    community.save();

    // add new stake asset
    let allAssets = walnut.stakeAssets;
    if (!allAssets.includes(pool.asset)){
        allAssets.push(pool.asset);
        walnut.stakeAssets = allAssets;
    }
    walnut.totalPools += 1;
    walnut.save();
}