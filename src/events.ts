import { queue } from '@xutl/queue';

export interface EventEmit<DataType> {
	(name: string, data: DataType, target?: any): Promise<void>;
}
export interface EventHandler<DataType> {
	(this: EventEmitter, data: DataType, target?: any): Promise<void> | void;
}
export interface EventManaged<DataType> extends EventHandler<DataType> {
	destroy?: (handler: EventManaged<DataType>) => void;
}
export interface EventIteratorValue<DataType, TargetType = EventEmitter> {
	source: EventEmitter;
	event: string;
	data: DataType;
	target: TargetType;
}

export class EventEmitter {
	#handlers: Map<string, Set<EventManaged<any>>> = new Map();
	#emit?: EventEmit<any>;
	on<T>(name: string, handler: EventManaged<T>) {
		if (!this.#handlers.has(name)) this.#handlers.set(name, new Set());
		const handlers = this.#handlers.get(name) as Set<EventManaged<any>>;
		handlers.add(handler);
		return this;
	}
	off(name?: string, handler?: EventManaged<any>) {
		if (!name) {
			for (const name of this.#handlers.keys()) this.off(name);
			return this;
		}
		if (!handler) {
			const handlers = this.#handlers.get(name);
			if (!handlers) return this;
			for (const handler of handlers) this.off(name, handler);
			return this;
		}
		const handlers = this.#handlers.get(name);
		if (!handlers) return this;
		handlers.delete(handler);
		if (handler.destroy) handler.destroy(handler);
		if (!handlers.size) this.#handlers.delete(name);
		return this;
	}
	collect<EventType, SourceType = EventEmitter>(name: string, ...more: string[]): AsyncIterable<EventIteratorValue<EventType, SourceType>> {
		const streams = [name, ...more].map((name: string) => {
			let iter = queue<EventIteratorValue<EventType, SourceType>>();
			const handler: EventManaged<EventType> = function (this: EventEmitter, data: EventType, target: SourceType) {
				iter.push({ source: this, event: name, data, target });
			};
			handler.destroy = (offed) => {
				if (offed === handler) iter.done();
			};
			this.on(name, handler);
			return iter;
		});
		switch (streams.length) {
			case 0: {
				const result = queue<EventIteratorValue<EventType, SourceType>>();
				result.done();
				return result;
			}
			case 1: {
				return streams[0] as AsyncIterableIterator<EventIteratorValue<EventType, SourceType>>;
			}
			default: {
				return merge<EventIteratorValue<EventType, SourceType>>(...streams);
			}
		}
	}
	get events() {
		return this.#handlers.keys();
	}
	static emit<T>(emitter: EventEmitter): EventEmit<T> {
		emitter.#emit =
			emitter.#emit ||
			async function emit(this: EventEmitter, name: string, data: any, target: any = this) {
				const handlers = emitter.#handlers.get(name);
				if (!handlers) {
					if (name === 'error' && data instanceof Error) throw data;
					return;
				}
				for (const handler of handlers) {
					await handler.call(this, data, target);
				}
			}.bind(emitter);
		return emitter.#emit;
	}
}

export default EventEmitter;

function merge<T>(...items: AsyncIterable<T>[]): AsyncIterableIterator<T> {
	const iter = queue<T>();
	const strains: Promise<void>[] = items.map((item) => drain(item, (value: T) => iter.push(value)));
	Promise.all(strains).then(
		() => iter.done(),
		(err: Error) => iter.error(err),
	);
	return iter;
}

async function drain<T>(source: AsyncIterable<T>, handler: (value: T) => void) {
	for await (const item of source) handler(item);
}
