import { Community, CommunityManageHistory, Walnut } from '../generated/schema'
import { AdminSetFeeRatio, PoolUpdated, AdminAddPool, AdminClosePool, WithdrawRewards } from '../generated/Community/Community'
import { getWalnut } from './mappingCommittee'

import { ethereum, BigInt } from "@graphprotocol/graph-ts";

export function handleAdminSetFeeRatio(event: AdminSetFeeRatio): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }

    let communityManageHistory = createAdminOp(event, "SETFEE", BigInt.zero());

    community.feeRatio = event.params.ratio;
    if (!community.manageHistory) {
        community.manageHistory = new Array<string>();
    }
    community.manageHistory.push(communityManageHistory.id);

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

export function handleAdminAddPool(event: AdminAddPool): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
    let walnut = getWalnut();
    let poolId:string = event.address.toHex();

    let communityManageHistory = createAdminOp(event, "ADDPOOL", BigInt.zero());

    walnut.totalPools += 1;
    if (!community.pools) {
        community.pools = new Array<string>();
    }
    if (!community.manageHistory) {
        community.manageHistory = new Array<string>();
    }
    community.pools.push(poolId);
    community.manageHistory.push(communityManageHistory.id);

    walnut.save();
    community.save();
}

export function handleAdminClosePool(event: AdminClosePool): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }

    let communityManageHistory = createAdminOp(event, "CLOSEPOOL", BigInt.zero());
    if (!community.manageHistory) {
        community.manageHistory = new Array<string>();
    }
    community.manageHistory.push(communityManageHistory.id);
    

}

export function handleWithdrawRewards(event: WithdrawRewards): void {
    let community = getCommunity(event);
    if (!community) {
        return;
    }
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
    history.pool = event.address;
    history.amount = amount;
    history.save();
    return history;
}