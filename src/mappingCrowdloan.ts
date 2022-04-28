import { Pool, Community, User, UserOperationHistory } from '../generated/schema'
import { Contributed } from '../generated/templates/CrowdloanTemplate/Crowdloan';
import { getWalnut } from './mappingCommittee'

// event Contribute(
//     address indexed community,
//     address indexed who,
//     uint256 newAmount,
//     uint256 totalAmount
// );
export function handleContributed(event: Contributed): void {
    let communityId = event.params.community.toHex();
    let poolId = event.address.toHex();
    let userId = event.params.who.toHex();
    let newAmount = event.params.newAmount;
    let totalAmount = event.params.totalAmount;
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
        let walnut = getWalnut()
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.who;
        walnut.totalUsers += 1;
        walnut.save();
        let comUsers = community.users;
        comUsers.push(userId);
        community.users = comUsers;
        community.usersCount++;

        let poolUsers = pool.stakers;
        poolUsers.push(userId);
        pool.stakers = poolUsers;
        pool.stakersCount++;
        pool.save();
    }

    let comUsers = community.users;
    if (!comUsers.includes(userId)){
        comUsers.push(userId);
        community.usersCount += 1;
        community.users = comUsers;
    }

    let poolUsers = pool.stakers;
    if (!poolUsers.includes(userId)){
        poolUsers.push(userId);
        pool.stakers = poolUsers;
        pool.stakersCount += 1;
    }    

    if (!user.inPools.includes(poolId)){
        let userPools = user.inPools;
        userPools.push(poolId);
        user.inPools = userPools;
    }
    if (!user.inCommunities.includes(communityId)) {
        let userCommunity = user.inCommunities;
        userCommunity.push(communityId);
        user.inCommunities = userCommunity;
    }

    pool.totalAmount = pool.totalAmount.plus(totalAmount);

    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let stakingHistory = new UserOperationHistory(opId);
    stakingHistory.community = communityId;
    stakingHistory.user =  event.params.who;
    stakingHistory.type = 'DEPOSIT';
    stakingHistory.pool = event.address.toHex();
    stakingHistory.poolFactory = pool.poolFactory;
    stakingHistory.chainId = pool.chainId;
    stakingHistory.asset = pool.asset;
    stakingHistory.amount = newAmount;
    stakingHistory.timestamp = event.block.timestamp;
    stakingHistory.tx = event.transaction.hash;
    let historys = user.operationHistory;
    historys.push(opId);
    user.operationHistory = historys;
    user.operationCount++;

    historys = community.operationHistory;
    historys.push(opId);
    community.operationHistory = historys;
    community.operationCount++;
 
    community.save();
    pool.save();
    user.save();
    stakingHistory.save();
}