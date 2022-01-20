import { Community, User, UserOperationHistory, Pool } from '../generated/schema'
import {
    AdminSetFeeRatio,
    PoolUpdated,
    AdminClosePool,
    WithdrawRewards,
    AdminSetPoolRatio,
    OwnershipTransferred,
    DevChanged,
    RevenueWithdrawn
} from '../generated/templates/CommunityTemplate/Community'
import { ethereum, BigInt, log, Bytes, ByteArray } from "@graphprotocol/graph-ts";
import { SPStakingFactory, ERC20StakingFactory } from "./contracts"

export function handleAdminSetFeeRatio(event: AdminSetFeeRatio): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    // event: ethereum.Event, type: string, community: Community, poolFactory: Bytes, pool: Pool, user: Bytes, chainId: u32, asset: Bytes, amount: BigInt
    createUserOp(event, "ADMINSETFEE", community, null, null, 0, null, BigInt.fromU32(event.params.ratio));
    log.info('[Community]: Admin set fee ratio to:{}', [event.params.ratio.toString()]);

    community.feeRatio = event.params.ratio;
    community.save();
}

export function handleAdminSetPoolRatio(event: AdminSetPoolRatio): void {
    let pools = event.params.pools;
    let ratios = event.params.ratios;
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    community.activedPoolCount = event.params.pools.length;
    for (let i = 0; i < pools.length; i++) {
        let pool = Pool.load(pools[i].toHex());
        if (!pool) {
            continue;
        }
        pool.poolIndex = i;
        pool.ratio = ratios[i];
        pool.save();
    }
    createUserOp(event, "ADMINSETRATIO", community, null, null, 0, null, null);
}

export function handleDevChanged(event: DevChanged): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    createUserOp(event, "ADMINSETDAOFUND", community, null, null, 0, event.params.newDev, null);
    community.daoFund = event.params.newDev;
}

export function handleRevenueWithdrawn(event: RevenueWithdrawn): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    createUserOp(event, "ADMINWITHDRAWNREVENUE", community, null, null, 0, event.params.devFund, event.params.amount);
    community.retainedRevenue = community.retainedRevenue.minus(event.params.amount);
}

export function handlePoolUpdated(event: PoolUpdated): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    community.revenue = community.revenue.plus(event.params.amount);
    community.retainedRevenue = community.retainedRevenue.plus(event.params.amount);
    community.save();
}

export function handleAdminClosePool(event: AdminClosePool): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    let pool = Pool.load(event.params.pool.toHex());
    pool!.status = 'CLOSED';
    pool!.save();

    createUserOp(event, "ADMINCLOSEPOOL", community, null, pool, 0, null, null);
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
    let stakingHistory = new UserOperationHistory(stakingId);
    stakingHistory.community = event.address.toHex();
    if (event.params.pool.length === 1) {
        stakingHistory.pool = event.params.pool[0].toHex();
        stakingHistory.type = 'HARVEST';
        let pool = Pool.load(event.params.pool[0].toHex());
        if (pool) {
            stakingHistory.poolFactory = pool.poolFactory;
            if (pool.poolFactory == SPStakingFactory) {
                stakingHistory.chainId == pool.chainId;
            } else if (pool.poolFactory == ERC20StakingFactory) {

            }
        }
    } else {
        stakingHistory.type = "HARVESTALL";
    }
    stakingHistory.user = event.params.who;
    stakingHistory.chainId = 0;
    stakingHistory.asset = community.cToken;
    stakingHistory.amount = event.params.amount;
    stakingHistory.tx = event.transaction.hash;
    stakingHistory.timestamp = event.block.timestamp;
    // add to user history
    let historys = user.operationHistory;
    historys.push(stakingId);
    user.operationHistory = historys;
    user.operationCount++;

    // add to community history
    historys = community.operationHistory;
    historys.push(stakingId);
    community.operationHistory = historys;
    community.operationCount++;
    community.distributedCToken = community.distributedCToken.plus(event.params.amount);
    stakingHistory.save();
    user.save();
    community.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
    const community = getCommunity(event);
    if (!community) return;
    community.owner = event.params.newOwner.toHex();
    community.save();
}

function getCommunity(event: ethereum.Event): Community | null {
    let communityId = event.address.toHex();
    let community = Community.load(communityId);
    return community;
}

function createUserOp(event: ethereum.Event, type: string, community: Community, poolFactory: Bytes | null, pool: Pool | null, chainId: u32, asset: Bytes | null, amount: BigInt | null): void {
    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let op = new UserOperationHistory(opId);
    op.type = type;
    op.community = community.id;
    op.poolFactory = poolFactory;
    op.pool = pool ? pool.id : null;
    op.user = Bytes.fromByteArray(ByteArray.fromHexString(community.owner));
    op.chainId = chainId;
    op.asset = asset;
    op.amount = amount;
    op.timestamp = event.block.timestamp;
    op.tx = event.transaction.hash;
    op.save();

    let user = User.load(community.owner);
    if (!user) {
        return;
    }
    let userOps = user.operationHistory;
    userOps.push(opId);
    user.operationHistory = userOps;
    user.operationCount++;
    user.save();

    let historys = community.operationHistory;
    historys.push(opId);
    community.operationHistory = historys;
    community.operationCount++;
    community.save();
}