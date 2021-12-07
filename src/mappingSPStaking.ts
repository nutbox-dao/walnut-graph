import { Pool, Community, User, UserStakingHistory } from '../generated/schema'
import { UpdateStaking } from '../generated/templates/SPStakingTemplate/SPStaking';
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
        walnut.totalUsers += 1;
        walnut.save();
        let comUsers = community.users;
        comUsers.push(userId);
        community.users = comUsers;
        community.usersCount++;
        community.save();

        let poolUsers = pool.stakers;
        poolUsers.push(userId);
        pool.stakers = poolUsers;
        pool.stakersCount++;
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
    let isDeposit = false;
    if (newAmount > previousAmount) {
        isDeposit = true;
    }

    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let stakingHistory = new UserStakingHistory(opId);
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
    let historys = user.stakingHistory;
    historys.push(opId);
    user.stakingHistory = historys;

    user.save();
    stakingHistory.save();
}