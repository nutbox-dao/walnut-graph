import { Pool, Community, User, UserOperationHistory } from '../generated/schema'
import { Deposited, Withdrawn } from '../generated/templates/ERC20StakingTemplate/ERC20Staking'
import { getWalnut } from './mappingCommittee'
import { Bytes, ByteArray, ethereum, BigInt, log } from '@graphprotocol/graph-ts';

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
    pool.save();

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
    
    createUserOp(event, 'DEPOSIT', community, pool.poolFactory, pool, event.params.who, 0, pool.asset, amount);
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
    createUserOp(event, 'WITHDRAW', community, pool.poolFactory, pool, event.params.who, 0, pool.asset, amount);
}

function createUserOp(event: ethereum.Event, type: string, community: Community, poolFactory: Bytes | null, pool: Pool, userb: Bytes, chainId: u32, asset: Bytes | null, amount: BigInt | null): void {
    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let op = new UserOperationHistory(opId);
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
    op.save();

    let user = User.load(community.owner);
    if(!user) {
        return;
    }
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