import { describe, it } from '@xutl/test';
import assert from 'assert';

import EventEmitter, { EventManaged } from './events';

describe('events', () => {
	it('basic', async () => {
		const emitter = new EventEmitter();
		const result = new Promise<{ data: object; target: any }>((resolve) => {
			emitter.on('test', (data: object, target: any) => resolve({ data, target }));
		});
		const value = {};
		await EventEmitter.emit(emitter)('test', value);
		const { data, target } = await result;
		assert.strictEqual(await data, value);
		assert.strictEqual(await target, emitter);
	});
	it('this', async () => {
		const emitter = new EventEmitter();
		const result = new Promise<{ source: EventEmitter; data: object; target: any }>((resolve) => {
			emitter.on('test', function (data: object, target: any) {
				resolve({ source: this, data, target });
			});
		});
		const value = {};
		await EventEmitter.emit(emitter)('test', value);
		const { source, data, target } = await result;
		assert.strictEqual(await source, emitter);
		assert.strictEqual(await data, value);
		assert.strictEqual(await target, emitter);
	});
	it('target', async () => {
		const emitter = new EventEmitter();
		const result = new Promise<{ source: EventEmitter; data: object; target: any }>((resolve) => {
			emitter.on('test', function (data: object, target: any) {
				resolve({ source: this, data, target });
			});
		});
		const value = {};
		const target = {};
		await EventEmitter.emit(emitter)('test', value, target);
		const { source, data: actualValue, target: actualTarget } = await result;
		assert.strictEqual(source, emitter);
		assert.strictEqual(actualValue, value);
		assert.strictEqual(actualTarget, target);
	});
	it('managed', async () => {
		const emitter = new EventEmitter();
		const result = new Promise((resolve) => {
			let handled = false;
			const handler: EventManaged<undefined> = () => {
				handled = true;
			};
			handler.destroy = () => resolve(handled);
			emitter.on('test', handler);
		});
		await EventEmitter.emit(emitter)('test', undefined);
		emitter.off();
		assert(await result, 'this works');
	});
	it('iterated', async () => {
		const emitter = new EventEmitter();
		let idx = 0;
		const timeout = setInterval(() => {
			idx++;
			EventEmitter.emit(emitter)('test', idx);
		}, 0);
		for await (const evt of emitter.collect('test')) {
			assert.strictEqual(evt.data, idx);
			if (evt.data === 10) {
				clearInterval(timeout);
				emitter.off();
			}
		}
		assert(true);
	});
});
