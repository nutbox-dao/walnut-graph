import { Community, User, UserOperationHistory } from '../generated/schema'
import { NewTreasuryCreated } from '../generated/TreasuryFactory/TreasuryFactory'
import { TreasuryTemplate } from '../generated/templates'
import { BigInt, log, ByteArray, Bytes } from '@graphprotocol/graph-ts';


export function handleNewTreasury(event: NewTreasuryCreated): void {
    let communityId:string = event.params.community.toHexString();
    let community = Community.load(communityId);
    if (!community) {
        // do nothing if community not exist
        return;
    }
    let treasuryId:string = event.params.treasury.toHexString();
    TreasuryTemplate.create(event.params.treasury);
    log.info(`[Treasury Factory] Create new treasury of community community:{} treasury:{}`, [
        event.params.community.toHex(),
        treasuryId
    ]);
    community.treasury = event.params.treasury;
    let userId = community.owner;
    let user = User.load(userId);
    if (!user) {
        return;
    }

    // add community create op to community
    let opId = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toHexString();
    let communityop = new UserOperationHistory(opId);
    communityop.type = "ADMINCREATETREASURY";
    communityop.tx = event.transaction.hash;
    communityop.timestamp = event.block.timestamp;
    communityop.community = event.params.community.toHex();
    communityop.user = Bytes.fromByteArray(ByteArray.fromHexString(userId));
    communityop.asset = event.params.treasury;

    let ops = community.operationHistory;
    ops.push(opId);
    community.operationHistory = ops;
    community.operationCount++;

    ops = user.operationHistory;
    ops.push(opId);
    user.operationHistory = ops;
    user.operationCount++;

    communityop.save();
    user.save();
    community.save();
}