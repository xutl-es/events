# @xutl/events

One [eXtremely Useful Tool Library](https://xutl.es) to provide async events. The event handler is allowed to return a Promise and
event emitting will wait for that Promise to complete before continuing on to the next event handler. `.emit` also returns a Promise
which will resolve when all handlers have completed.

## Install

`npm install @xutl/events`

## Usage

```
import EventEmitter from '@xutl/events';

class MyEmitter extends EventEmitter {
  async trigger(name) {
    console.log('before');
    await EventEmitter.emit(this)('hello', name);
    console.log('after');
  }
}

const test = new MyEmitter();
test.on('hello', async (name)=>{
  await sleep(1000);
  console.log(`Hello ${name});
  await sleep(1000);
});

test.trigger('tester').then(()=>console.log('done'));
console.log('here');

function sleep(ms) { return new Promise(resolve, setTimeout(resolve, ms)); }

// before
// here
// Hello tester
// after
// done
```

## License

Copyright 2020,2021 xutl.es

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
