import { Community, CommunityManageHistory, User, UserStakingHistory, Pool } from '../generated/schema'
import { AdminSetFeeRatio, PoolUpdated, AdminClosePool, WithdrawRewards, AdminSetPoolRatio } from '../generated/templates/CommunityTemplate/Community'
import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { SPStakingFactory, ERC20StakingFactory } from "./contracts"

export function handleAdminSetFeeRatio(event: AdminSetFeeRatio): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }

    let communityManageHistory = createAdminOp(event, "SETFEE", BigInt.zero());
    log.info('[Community]: Admin set fee ratio to:{}', [event.params.ratio.toString()]);

    community.feeRatio = event.params.ratio;
    let historys = community.manageHistory;
    historys.push(communityManageHistory.id);
    community.manageHistory = historys;
    community.operateCount++;

    community.save();
}

export function handleAdminSetPoolRatio(event: AdminSetPoolRatio): void {
    let pools = event.params.pools;
    let ratios = event.params.ratios;
    let community = getCommunity(event);
    if (!community){
        return;
    }
    community.activedPoolCount = event.params.pools.length;
    for (let i = 0; i < pools.length; i++) {
        let pool = Pool.load(pools[i].toHex());
        if (!pool){
            pool = new Pool(pools[i].toHex());
            log.info('[Community] Create new pool:{} ratio:{}', [pools[i].toHex(), ratios[i].toString()]);
        }
        pool.ratio = ratios[i];
        pool.save();
    }
    // add set ratio operate
    let op = createAdminOp(event, "SETRATIO", BigInt.zero());
    let historys = community.manageHistory;
    historys.push(op.id);
    community.manageHistory = historys;
    community.operateCount++;
    community.save();
}

export function handlePoolUpdated(event: PoolUpdated): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    community.revenue = community.revenue.plus(event.params.amount);
    community.save();
}

export function handleAdminClosePool(event: AdminClosePool): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }

    let communityManageHistory = createAdminOp(event, "CLOSEPOOL", BigInt.zero());
    let historys = community.manageHistory;
    historys.push(communityManageHistory.id);
    community.manageHistory = historys;
    community.operateCount++;
    community.save();
}

export function handleWithdrawRewards(event: WithdrawRewards): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    let userId: string = event.params.who.toHex();
    let user = User.load(userId);
    if (!user) {
        // If user did not stake first, do nothing with this event
        return;
    }
    // add operate history
    let stakingId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
    let stakingHistory = new UserStakingHistory(stakingId);
    stakingHistory.community = event.address.toHex();
    if (event.params.pool.length === 1) {
        stakingHistory.pool = event.params.pool[0].toHex();
        stakingHistory.type = 'HARVEST';
        let pool = Pool.load(event.params.pool[0].toHex());
        if (pool){
            stakingHistory.poolFactory = pool.poolFactory;
            if (pool.poolFactory == SPStakingFactory) {
                stakingHistory.chainId == pool.chainId;
            }else if (pool.poolFactory == ERC20StakingFactory) {

            }
        }
    }else{
        stakingHistory.type = "HARVESTALL";
    }
    stakingHistory.user = event.params.who;
    stakingHistory.chainId = 0;
    stakingHistory.asset = community.cToken;
    stakingHistory.amount = event.params.amount;
    stakingHistory.tx = event.transaction.hash;
    stakingHistory.timestamp = event.block.timestamp;
    let historys = user.stakingHistory;
    historys.push(stakingId);
    user.stakingHistory = historys;
    community.operateCount++;
    community.distributedCToken = community.distributedCToken.plus(event.params.amount);
    stakingHistory.save();
    user.save();
    community.save();
}

function getCommunity(event: ethereum.Event): Community | null {
    let communityId = event.address.toHex();
    let community = Community.load(communityId);
    return community;
}

function createAdminOp(event: ethereum.Event, type: string, amount: BigInt): CommunityManageHistory {
    let opId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
    let history = new CommunityManageHistory(opId)
    history.tx = event.transaction.hash;
    history.timestamp = event.block.timestamp;
    history.type = type;
    history.pool = event.address.toHex();
    history.community = event.address;
    history.amount = amount;
    history.save();
    return history;
}