import { CommunityTemplate } from '../generated/templates'
import { Community, User, UserOperationHistory } from '../generated/schema'
import { CommunityCreated } from '../generated/CommunityFactory/CommunityFactory'
import { getWalnut } from './mappingCommittee'
import { log } from '@graphprotocol/graph-ts'


export function handleCommunityCreated(event: CommunityCreated): void {
    let walnut = getWalnut();
    let communityId:string = event.params.community.toHexString();
    CommunityTemplate.create(event.params.community);
    log.info(`[Community Factory] Create new community creator:{} community:{} c-token:{}`, [
        event.params.creator.toHex(),
        event.params.community.toHex(),
        event.params.communityToken.toHex()
    ]);
    let community = new Community(communityId);
    community.createdAt = event.block.timestamp;
    let userId = event.params.creator.toHex();
    let user = User.load(userId);
    if (!user) {
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.creator;
        walnut.totalUsers += 1;
    }

    // add community to user's community list
    let inCommunities = user.inCommunities;
    inCommunities.push(communityId);
    user.inCommunities = inCommunities;

    // add community create op to community
    let opId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toHexString();
    let communityop = new UserOperationHistory(opId);
    communityop.type = "ADMINCREATE";
    communityop.tx = event.transaction.hash;
    communityop.timestamp = event.block.timestamp;
    communityop.community = event.params.community.toHex();
    communityop.user = event.params.creator;

    let ops = community.operationHistory;
    ops.push(opId);
    community.operationHistory = ops;
    community.operationCount++;

    ops = user.operationHistory;
    ops.push(opId);
    user.operationHistory = ops;
    user.operationCount++;

    community.usersCount = 1;
    let users = community.users;
    users.push(userId);
    community.users = users;

    community.owner = userId;
    community.cToken = event.params.communityToken;
    let communities = walnut.communities
    communities.push(communityId);
    walnut.communities = communities;
    walnut.totalCommunities += 1;
    if (!walnut.cTokens.includes(event.params.communityToken)){
        let ctokens = walnut.cTokens;
        ctokens.push(event.params.communityToken);
        walnut.cTokens = ctokens;
    }
    communityop.save();
    user.save();
    community.save();
    walnut.save();
}