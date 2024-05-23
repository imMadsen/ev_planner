export class BidirectionalMap<K, V> {
    private keyToValue: Map<K, V>;
    private valueToKey: Map<V, K>;

    constructor() {
        this.keyToValue = new Map<K, V>();
        this.valueToKey = new Map<V, K>();
    }

    set(key: K, value: V): void {
        if (this.keyToValue.has(key)) {
            const oldValue = this.keyToValue.get(key)!;
            this.valueToKey.delete(oldValue);
        }
        if (this.valueToKey.has(value)) {
            const oldKey = this.valueToKey.get(value)!;
            this.keyToValue.delete(oldKey);
        }

        this.keyToValue.set(key, value);
        this.valueToKey.set(value, key);
    }

    getValue(key: K): V | undefined {
        return this.keyToValue.get(key);
    }

    getKey(value: V): K | undefined {
        return this.valueToKey.get(value);
    }

    hasKey(key: K): boolean {
        return this.keyToValue.has(key);
    }

    hasValue(value: V): boolean {
        return this.valueToKey.has(value);
    }

    deleteByKey(key: K): boolean {
        if (!this.keyToValue.has(key)) {
            return false;
        }
        const value = this.keyToValue.get(key)!;
        this.keyToValue.delete(key);
        this.valueToKey.delete(value);
        return true;
    }

    deleteByValue(value: V): boolean {
        if (!this.valueToKey.has(value)) {
            return false;
        }
        const key = this.valueToKey.get(value)!;
        this.keyToValue.delete(key);
        this.valueToKey.delete(value);
        return true;
    }

    clear(): void {
        this.keyToValue.clear();
        this.valueToKey.clear();
    }

    get size(): number {
        return this.keyToValue.size;
    }
}
