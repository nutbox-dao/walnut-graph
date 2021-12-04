import { CommunityTemplate } from '../generated/templates'
import { Community, User } from '../generated/schema'
import { CommunityCreated } from '../generated/CommunityFactory/CommunityFactory'
import { getWalnut } from './mappingCommittee'

export function handleCommunityCreated(event: CommunityCreated): void {
    let walnut = getWalnut();
    let communityId:string = event.params.community.toHexString();
    CommunityTemplate.create(event.params.community);
    let community = new Community(communityId);
    community.createdAt = event.block.timestamp;
    let userId = event.params.creator.toHex();
    let user = User.load(userId);
    if (!user) {
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.creator;
        user.save();
        walnut.totalUsers += 1;
    }
    community.owner = userId;
    community.cToken = event.params.communityToken;
    let communities = walnut.communities
    communities.push(communityId);
    walnut.communities = communities;
    if (!walnut.cTokens.includes(event.params.communityToken)){
        let ctokens = walnut.cTokens;
        ctokens.push(event.params.communityToken);
        walnut.cTokens = ctokens;
    }
    
    community.save();
    walnut.save();
}