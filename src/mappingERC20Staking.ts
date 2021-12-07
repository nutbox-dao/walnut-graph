import { Pool, Community, User, UserOperationHistory } from '../generated/schema'
import { Deposited, Withdrawn } from '../generated/templates/ERC20StakingTemplate/ERC20Staking'
import { getWalnut } from './mappingCommittee'

export function handleDeposited(event: Deposited): void {
    let communityId = event.params.community.toHex();
    let poolId = event.address.toHex();
    let userId = event.params.who.toHex();
    let amount = event.params.amount;
    let community = Community.load(communityId);
    let pool = Pool.load(poolId);
    if (!community){
        return;
    }
    if(!pool) {
        return;
    }
    let user = User.load(userId);
    if(!user){
        let walnut = getWalnut()
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.who;
        walnut.totalUsers += 1;
        walnut.save();
        let comUsers = community.users;
        comUsers.push(userId);
        community.usersCount += 1;
        community.users = comUsers;

        let poolUsers = pool.stakers;
        poolUsers.push(userId);
        pool.stakers = poolUsers;
        pool.stakersCount += 1;
        pool.save();
    }
    if (!user.inPools.includes(poolId)){
        let userPools = user.inPools;
        userPools.push(userId);
        user.inPools = userPools;
    }
    if (!user.inCommunities.includes(communityId)) {
        let userCommunity = user.inCommunities;
        userCommunity.push(communityId);
        user.inCommunities = userCommunity;
    }
    
    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let stakingHistory = new UserOperationHistory(opId);
    stakingHistory.community = communityId;
    stakingHistory.user =  event.params.who;
    stakingHistory.type = 'DEPOSIT'
    stakingHistory.pool = event.address.toHex();
    stakingHistory.poolFactory = pool.poolFactory;
    stakingHistory.asset = pool.asset;
    stakingHistory.amount = amount;
    stakingHistory.timestamp = event.block.timestamp;
    stakingHistory.tx = event.transaction.hash;
    let historys = user.stakingHistory;
    historys.push(opId);
    user.stakingHistory = historys;
    community.operateCount++;
    community.save();
    user.save();
    stakingHistory.save();
}

export function handleWithdrawn(event: Withdrawn): void {
    let communityId = event.params.community.toHex();
    let poolId = event.address.toHex();
    let userId = event.params.who.toHex();
    let amount = event.params.amount;
    let community = Community.load(communityId);
    let pool = Pool.load(poolId);
    let user = User.load(userId);
    if (!community){
        return;
    }
    if(!pool) {
        return;
    }
    if(!user){
        return;
    }
    
    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let stakingHistory = new UserOperationHistory(opId);
    stakingHistory.community = communityId;
    stakingHistory.user =  event.params.who;
    stakingHistory.type = 'WITHDRAW'
    stakingHistory.pool = event.address.toHex();
    stakingHistory.poolFactory = pool.poolFactory;
    stakingHistory.asset = pool.asset;
    stakingHistory.amount = amount;
    stakingHistory.timestamp = event.block.timestamp;
    stakingHistory.tx = event.transaction.hash;

    let historys = user.stakingHistory;
    historys.push(opId);
    user.stakingHistory = historys;
    community.operateCount++;
    community.save();

    user.save();
    stakingHistory.save();
}