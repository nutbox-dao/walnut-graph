import { Pool, Community, User, UserOperationHistory } from '../generated/schema'
import { PoolStarted, ChangeRecipient, WithdrawRewardsToRecipient } from '../generated/templates/CurationGaugeTemplate/CurationGauge'
import { getWalnut } from './mappingCommittee'
import { Bytes, ethereum, BigInt, log, ByteArray } from '@graphprotocol/graph-ts';
import { getOpCount } from './utils'


export function handlePoolStarted(event: PoolStarted): void {
    let poolId = event.address.toHex();
    let pool = Pool.load(poolId);
    if(!pool) {
        return;
    }
    let community = Community.load(pool.community);
    if (!community){
        return;
    }
    let user = User.load(community.owner);
    if(!user){
        return;
    }

    let poolUsers = pool.stakers;
    if (!poolUsers.includes(poolId)){
        poolUsers.push(poolId);
        pool.stakers = poolUsers;
        pool.stakersCount += 1;
    }
    // update total amount 
    pool.totalAmount = BigInt.fromI32(1);
    pool.save();

    user.save();

    // set pool addres as a user, no need to config user operation and community info and pool info to this pool user
    let poolAsUser = new User(poolId);
    poolAsUser.createdAt = event.block.timestamp;
    poolAsUser.address = event.address;
    poolAsUser.save();
    
    createUserOp(event, 'STARTCURATIONGAUGE', community, pool.poolFactory, pool, event.address, 0, pool.asset, new BigInt(1));
}

export function handleChangeRecipient(event: ChangeRecipient): void {
    const newRecipient = event.params.newRecipient;
    let poolId = event.address.toHex();
    let pool = Pool.load(poolId);
    if(!pool) {
        return;
    }
    pool.asset = newRecipient;
    let communityId = pool.community;
    let community = Community.load(communityId);
    if (!community){
        return;
    }

    let userId = community.owner;
    let amount = BigInt.zero();
    let user = User.load(userId);
    if(!user){
        return;
    }
    pool.save();
    createUserOp(event, 'ADMINCHANGECURATIONRECIPIENT', community, pool.poolFactory, pool, Bytes.fromByteArray(ByteArray.fromHexString(userId)), 0, newRecipient, amount);
}

function createUserOp(event: ethereum.Event, type: string, community: Community, poolFactory: Bytes | null, pool: Pool, userb: Bytes, chainId: u32, asset: Bytes | null, amount: BigInt | null): void {
    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let op = new UserOperationHistory(opId);
    let index = getOpCount();
    op.index = index;
    op.type = type;
    op.community = community.id;
    op.poolFactory = poolFactory;
    op.pool = pool.id;
    op.user = userb;
    op.chainId = chainId;
    op.asset = asset;
    op.amount = amount;
    op.timestamp = event.block.timestamp;
    op.tx = event.transaction.hash;

    let user = User.load(userb.toHex());
    if(!user) {
        return;
    }
    op.save();
    let userOps = user.operationHistory;
    userOps.push(opId);
    user.operationHistory = userOps;
    user.operationCount++;
    user.save();

    let historys = community.operationHistory;
    historys.push(opId);
    community.operationHistory = historys;
    community.operationCount++;
    log.info('Create new staking history: community:{} pool:{} user:{} type:{}', [community.id, pool.name, community.owner, type]);
    community.save();
}