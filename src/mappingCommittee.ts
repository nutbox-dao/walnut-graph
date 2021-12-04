import { NewRevenue, NewAppropriation } from '../generated/Committee/Committee'
import { Walnut, FeeHistory, AppropriationHistory } from '../generated/schema'

export function handleNewRevenue(event: NewRevenue): void {
    let walnut = getWalnut();
    let feeId:string = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
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
    let appropriationId:string = event.transaction.hash.toHex() + '-' + event.transactionLogIndex.toString();
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
    let walnut = Walnut.load('0x00');
    if (!walnut) {
        walnut = new Walnut("0x00");
    }
    return walnut;
}