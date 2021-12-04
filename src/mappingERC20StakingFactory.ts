import { Pool, Community, CommunityManageHistory } from '../generated/schema'
import { ERC20StakingCreated } from '../generated/ERC20StakingFactory/ERC20StakingFactory'
import { ERC20StakingTemplate } from '../generated/templates'
import { getWalnut } from './mappingCommittee';
import { contracts } from "./contracts"
import { BigInt, ByteArray } from '@graphprotocol/graph-ts';

// event ERC20StakingCreated(
//     address indexed pool,
//     address indexed community,
//     string name,
//     address erc20Token
// );
export function handleERC20StakingCreated(event: ERC20StakingCreated): void {
    let walnut = getWalnut();
    ERC20StakingTemplate.create(event.params.pool);
    let poolId = event.params.pool.toHex();
    let pool = new Pool(poolId);
    let community = Community.load(event.params.community.toHex());
    if (!community){
        return;
    }
    // add pool to community
    pool.createdAt = event.block.timestamp;
    pool.status = 'OPENED';
    pool.name = event.params.name;
    pool.poolFactory = ByteArray.fromUTF8(contracts.ERC20StakingFactory);
    pool.community = event.params.community.toHex();
    pool.asset = event.params.erc20Token;
    pool.tvl = BigInt.zero();
    pool.save();
    let pools = community.pools;
    pools.push(pool.id);
    community.pools = pools;

    // add community add pool operator history
    let historyId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
    let communityHistory = new CommunityManageHistory(historyId);
    communityHistory.type = "ADDPOOL";
    communityHistory.pool = pool.id;
    communityHistory.tx = event.transaction.hash;
    communityHistory.timestamp = event.block.timestamp;
    
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