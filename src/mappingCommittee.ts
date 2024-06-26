import { BigInt } from '@graphprotocol/graph-ts';
import { NewRevenue, NewAppropriation } from '../generated/Committee/Committee'
import { Walnut, FeeHistory, AppropriationHistory } from '../generated/schema'
import { Committee } from './contracts';

export function handleNewRevenue(event: NewRevenue): void {
    let walnut = getWalnut();
    let feeId:string = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toHexString();
    let feeHistory = new FeeHistory(feeId);
    feeHistory.timestamp = event.block.timestamp;
    feeHistory.feeType = event.params.feeType;
    feeHistory.payer = event.params.who.toHex();
    feeHistory.amount = event.params.amount;
    feeHistory.community = event.params.community.toHex();
    feeHistory.pool = event.params.pool.toHex();
    let historys = walnut.feeHistory;
    historys.push(feeId);
    walnut.feeHistory = historys;
    walnut.revenue = walnut.revenue.plus(event.params.amount);
    feeHistory.save();
    walnut.save();
}

export function handleNewAppropriation(event: NewAppropriation): void {
    let walnut = getWalnut();
    let appropriationId:string = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toHexString();
    let appropriationHistory = new AppropriationHistory(appropriationId);
    appropriationHistory.timestamp = event.block.timestamp;
    appropriationHistory.recipient = event.params.recipient;
    appropriationHistory.amount = event.params.amount;
    appropriationHistory.tx = event.transaction.hash;
    let historys = walnut.propriationHistory;
    historys.push(appropriationId);
    walnut.propriationHistory = historys;
    appropriationHistory.save();
    walnut.save();
}

export function getWalnut(): Walnut {
    let walnut = Walnut.load(Committee.toHex());
    if (!walnut) {
        walnut = new Walnut(Committee.toHex());
        walnut.tvl = new BigInt(0);
        walnut.stakeAssets = [];
        walnut.cTokens = [];
        walnut.revenue = new BigInt(0);
        walnut.feeHistory = [];
        walnut.propriationHistory = [];
        walnut.communities = [];
        walnut.totalCommunities = 0;
        walnut.totalUsers = 0;
        walnut.totalPools = 0;
        walnut.totalGauges = 0;
        walnut.save();
    }
    return walnut;
}