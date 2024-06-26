import { Pool, Community, User, UserOperationHistory } from '../generated/schema'
import { Redeem } from '../generated/templates/TreasuryTemplate/Treasury';
import { getWalnut } from './mappingCommittee'

export function handleRedeem(event: Redeem): void {
    let communityId = event.params.community.toHex();
    let treasuryId = event.address;
    let userId = event.params.user.toHex();
    let amount = event.params.amount;
    let community = Community.load(communityId);
    let user = User.load(userId);
    if (!community){
        return;
    }
    if(!user){
        let walnut = getWalnut()
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.user;
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
    }

    let comUsers = community.users;
    if (!comUsers.includes(userId)){
        comUsers.push(userId);
        community.usersCount += 1;
        community.users = comUsers;
    } 
    if (!user.inCommunities.includes(communityId)) {
        let userCommunity = user.inCommunities;
        userCommunity.push(communityId);
        user.inCommunities = userCommunity;
    }

    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let stakingHistory = new UserOperationHistory(opId);
    stakingHistory.community = communityId;
    stakingHistory.user =  event.params.user;
    stakingHistory.asset = treasuryId;
    stakingHistory.type = 'REDEEMFROMTREASURY';
    stakingHistory.amount = amount;
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
    user.save();
    stakingHistory.save();
}