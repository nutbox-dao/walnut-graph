import { BigInt } from '@graphprotocol/graph-ts';
import { Counter } from '../generated/schema'
const OpCounterKey = 'Operation'

export function formatOddString(s: string): string {
    return s.length % 2 === 0 ? s : '0' + s;
}

export function getOpCount(): BigInt {
    let counter = Counter.load(OpCounterKey);
    if (!counter) {
        counter = new Counter(OpCounterKey);
        counter.index = new BigInt(0)
    }
    counter.index = counter.index.plus(BigInt.fromU64(1));
    counter.save();
    return counter.index;
}