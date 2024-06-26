import { Pool, Community, User, UserOperationHistory } from '../generated/schema'
import { UpdateStaking } from '../generated/templates/CosmosStakingTemplate/CosmosStaking';
import { getWalnut } from './mappingCommittee'

// event UpdateStaking(
//     address indexed community,
//     address indexed who,
//     uint256 previousAmount,
//     uint256 newAmount
// );
export function handleUpdateStaking(event: UpdateStaking): void {
    let communityId = event.params.community.toHex();
    let poolId = event.address.toHex();
    let userId = event.params.who.toHex();
    let previousAmount = event.params.previousAmount;
    let newAmount = event.params.newAmount;
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
        user.inCommunities = [];
        user.inPools = [];
        user.inGauges = [];
        user.operationHistory = [];
        user.operationCount = 0;
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
    let isDeposit = false;
    // update pool total amount
    if (newAmount > previousAmount) {
        isDeposit = true;
        pool.totalAmount = pool.totalAmount.plus(newAmount.minus(previousAmount));
    } else {
        pool.totalAmount = pool.totalAmount.minus(previousAmount.minus(newAmount));
    }

    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let stakingHistory = new UserOperationHistory(opId);
    stakingHistory.community = communityId;
    stakingHistory.user =  event.params.who;
    stakingHistory.type = isDeposit ? 'DEPOSIT' : "WITHDRAW";
    stakingHistory.pool = event.address.toHex();
    stakingHistory.poolFactory = pool.poolFactory;
    stakingHistory.chainId = pool.chainId;
    stakingHistory.asset = pool.asset;
    stakingHistory.amount = isDeposit ? newAmount.minus(previousAmount) : previousAmount.minus(newAmount);
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