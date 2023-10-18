import { Community, User, UserOperationHistory, Pool } from '../generated/schema'
import { Voted, Unvoted, CreateNewGauge, CTokenWithdrawn, UserWithdrewNut, CommunityWithdrewNut } from '../generated/Gauge/Gauge'
import { getWalnut } from './mappingCommittee'
import { Bytes, ByteArray, ethereum, BigInt, log } from '@graphprotocol/graph-ts';
import { getOpCount } from './utils'


//    event CreateNewGauge(address indexed community, address indexed factory, address indexed pool);
export function handleGaugeCreated(event: CreateNewGauge): void {
    let pid = event.params.pool.toHex();
    let communityId = event.params.community.toHex();
    let pool = Pool.load(pid);
    let community = Community.load(communityId);
    // ignore if the pool hasnt created
    if (!pool) {
        log.info('Gauge] Pool:{} not created', [pid]);
        return;
    }
    if (!community) {
        log.info('Gauge] Community:{} not created', [communityId]);
        return;
    }
    let user = User.load(community.owner);
    if (!user) {
        log.info('Gauge] User:{} not exist', [community.owner])
        return;
    }
    // update walnut data
    let walnut = getWalnut()
    walnut.totalGauges += 1;
    walnut.save();

    // create new gauge
    pool.hasCreateGauge = 1;

    // create new operation history
    createUserOp(event, "ADMINCREATENEWGAUGE", community, null, pool, Bytes.fromByteArray(ByteArray.fromHexString(community.owner)), pool.chainId, null, null);
}

//    event Voted(address indexed community, address indexed factory, address indexed pool, address user, uint256 amount);
export function handleVoted(event: Voted): void {
    let communityId = event.params.community.toHex();
    let poolId = event.params.pool.toHex();
    let userId = event.params.user.toHex();
    let amount = event.params.amount;
    let community = Community.load(communityId);
    let pool = Pool.load(poolId);
    if (!community){
        return;
    }
    if(!pool || !pool.hasCreateGauge) {
        log.info("Gauge] Gauge not created", []);
        return;
    }
    let user = User.load(userId);
    if(!user){
        let walnut = getWalnut()
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.user;
        walnut.totalUsers += 1;
        walnut.save();
    }
    let comUsers = community.users;
    if (!comUsers.includes(userId)){
        comUsers.push(userId);
        community.usersCount += 1;
        community.users = comUsers;
    }

    let poolVoters = pool.voters;
    if (!poolVoters.includes(userId)){
        poolVoters.push(userId);
        pool.voters = poolVoters;
        pool.votersCount += 1;
    }
    // update total vote amount 
    pool.votedAmount = pool.votedAmount.plus(amount);

    if (!user.inGauges.includes(poolId)){
        log.info("[Gauge] add new gauge of user:{}", [userId]);
        let userGauges = user.inGauges;
        userGauges.push(poolId);
        user.inGauges = userGauges;
    }
    if (!user.inCommunities.includes(communityId)) {
        let userCommunity = user.inCommunities;
        userCommunity.push(communityId);
        user.inCommunities = userCommunity;
    }
    user.save();
    log.info("{} Voted {}", [userId, poolId]);
    createUserOp(event, "VOTE", community, null, pool, event.params.user, pool.chainId, null, amount);
}

//    event Unvoted(address indexed community, address indexed factory, address indexed pool, address user, uint256 amount);
export function handleUnvoted(event: Unvoted): void {
    let communityId = event.params.community.toHex();
    let poolId = event.params.pool.toHex();
    let userId = event.params.user.toHex();
    let amount = event.params.amount;
    let community = Community.load(communityId);
    let pool = Pool.load(poolId);
    if (!community){
        return;
    }
    if(!pool || !pool.hasCreateGauge) {
        return;
    }
    let user = User.load(userId);
    if(!user){
        let walnut = getWalnut()
        user = new User(userId);
        user.createdAt = event.block.timestamp;
        user.address = event.params.user;
        walnut.totalUsers += 1;
        walnut.save();
    }
    let comUsers = community.users;
    if (!comUsers.includes(userId)){
        comUsers.push(userId);
        community.usersCount += 1;
        community.users = comUsers;
    }

    let poolVoters = pool.voters;
    if (!poolVoters.includes(userId)){
        poolVoters.push(userId);
        pool.voters = poolVoters;
        pool.votersCount += 1;
    }
    // update total vote amount 
    pool.votedAmount = pool.votedAmount.minus(amount);

    if (!user.inGauges.includes(poolId)){
        let userGauges = user.inGauges;
        userGauges.push(poolId);
        user.inGauges = userGauges;
    }
    if (!user.inCommunities.includes(communityId)) {
        let userCommunity = user.inCommunities;
        userCommunity.push(communityId);
        user.inCommunities = userCommunity;
    }
    log.info("Gauge] {} Unvoted {}", [userId, poolId]);
    user.save();
    createUserOp(event, "UNVOTE", community, null, pool, event.params.user, pool.chainId, null, amount);
}

//    event CTokenWithdrawn(address indexed pool, address indexed recipient, uint256 amount);
export function handleCTokenWithdrawn(event: CTokenWithdrawn): void {
    let pid = event.params.pool.toHex();
    let pool = Pool.load(pid);
    if (!pool) return;
    let communityId = pool.community;
    let community = Community.load(communityId);
    if (!community) {
        return;
    }
    let userId: string = event.params.recipient.toHex();
    let user = User.load(userId);
    if (!user) {
        // If user did not stake first, do nothing with this event
        return;
    }
    log.info("Gauge] {} withdraw ctoken from pool {}", [userId, pid]);
    createUserOp(event, "WITHDRAWGAUGECTOKEN", community, null, pool, event.params.recipient, pool.chainId, community.cToken, event.params.amount);
}

// UserWithdrewNut(address indexed pool, address indexed recipient, uint256 amount);
export function handleUserWithdrewNut(event: UserWithdrewNut): void {
    let pid = event.params.pool.toHex();
    let pool = Pool.load(pid);
    if (!pool) return;
    let communityId = pool.community;
    let community = Community.load(communityId);
    if (!community) {
        return;
    }
    let userId: string = event.params.recipient.toHex();
    let user = User.load(userId);
    if (!user) {
        // If user did not stake first, do nothing with this event
        return;
    }
    log.info("Gauge] {} withdraw nut from pool {}", [userId, pid]);
    createUserOp(event, "WITHDRAWGAUGENUT", community, null, pool, event.params.recipient, pool.chainId, null, event.params.amount);
}

//    event CommunityWithdrewNut(address indexed community, address indexed recipient, uint256 amount);
export function handleCommunityWithdrewNut(event: CommunityWithdrewNut): void {
    let communityId = event.params.community;
    let userId = event.params.recipient;
    let amount = event.params.amount;
    let community = Community.load(communityId.toHex());
    let user = User.load(userId.toHex());

    if (!community || !user) {
        return;
    }
    log.info("Gauge] {} withdraw nut from gauge", [communityId.toHex()]);
    createUserOp(event, "ADMINWITHDRAWGAUGENUT", community, null, null, Bytes.fromByteArray(ByteArray.fromHexString(community.owner)), 0, null, amount);
}

// create a new operation history
function createUserOp(event: ethereum.Event, type: string, community: Community, poolFactory: Bytes | null, pool: Pool | null, userb: Bytes, chainId: u32, asset: Bytes | null, amount: BigInt | null): void {
    let opId = event.transaction.hash.toHex().concat('-').concat(event.transactionLogIndex.toString());
    let op = new UserOperationHistory(opId);
    let index = getOpCount();
    op.index = index;
    op.type = type;
    op.community = community.id;
    op.poolFactory = poolFactory;
    op.pool = pool ? pool.id : null;
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
    if (pool) {
        pool.save();
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
    log.info('Create new staking history: community:{} pool:{} user:{} type:{}', [community.id, pool ? pool.name : 'null', community.owner, type]);
    community.save();
}