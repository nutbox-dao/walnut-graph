import { Community } from '../generated/schema'
import { CommunityCreated } from '../generated/CommunityFactory/CommunityFactory'
import { getWalnut } from './mappingCommittee'

export function handleCommunityCreated(event: CommunityCreated): void {
    let walnut = getWalnut();
    let communityId:string = event.params.community.toHexString();
    let community = new Community(communityId);
    community.createdAt = event.block.timestamp;
    community.owner = event.params.creator;
    community.cToken = event.params.communityToken;
    if (!walnut.communities) {
        walnut.communities = new Array<string>();
    }
    walnut.communities.push(communityId);
    community.save();
    walnut.save();
}