import type { ChargingStation, Connector } from ".";

const seed = 123456789; // You can change the seed value

class SplitMix32 {
    state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    next() {
        this.state = (this.state + 0x9E3779B9) | 0;
        let z = this.state;
        z = (z ^ (z >>> 15)) * 0x85EBCA77;
        z = (z ^ (z >>> 13)) * 0xC2B2AE35;
        z = z ^ (z >>> 16);
        return (z >>> 0) / 0xFFFFFFFF; // normalize to [0, 1)
    }
}

const rng = new SplitMix32(seed);

const outputs = [475, 22, 11]

export function createDummyConnector(output?: number, start = 0, range = 10): number[][] {
    if (!output)
        output = outputs[Math.floor(Math.random() * outputs.length)]
    
    return new Array(range).fill(null).map(() => [start + range, output])
}