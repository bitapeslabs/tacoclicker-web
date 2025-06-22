// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license –
//
// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the “Software”), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* ------------------------------------------------------------------------- */
/*  Typed class wrapper retaining 100 % of the original functionality        */
/* ------------------------------------------------------------------------- */

export interface AleaState {
  c: number;
  s0: number;
  s1: number;
  s2: number;
}

export class Alea {
  private c!: number;
  private s0!: number;
  private s1!: number;
  private s2!: number;
  private readonly mash: (data: string) => number;

  constructor(seed: string, state?: Partial<AleaState>) {
    this.mash = Alea.createMash();

    /* Apply Baagøe’s original seeding procedure */
    this.c = 1;
    this.s0 = this.mash(" ");
    this.s1 = this.mash(" ");
    this.s2 = this.mash(" ");

    this.seed(seed);

    if (state) this.setState(state);
  }

  next(): number {
    const t = 2091639 * this.s0 + this.c * 2.3283064365386963e-10; // 2-32
    this.s0 = this.s1;
    this.s1 = this.s2;
    this.s2 = t - (this.c = t | 0);
    return this.s2;
  }

  int32(): number {
    return (this.next() * 0x100000000) | 0;
  }

  double(): number {
    /* 2-53 */ return (
      this.next() + ((this.next() * 0x200000) | 0) * 1.1102230246251565e-16
    );
  }

  quick(): number {
    return this.next();
  }

  getState(): AleaState {
    return { c: this.c, s0: this.s0, s1: this.s1, s2: this.s2 };
  }

  setState(state: Partial<AleaState>): void {
    if (state.c !== undefined) this.c = state.c;
    if (state.s0 !== undefined) this.s0 = state.s0;
    if (state.s1 !== undefined) this.s1 = state.s1;
    if (state.s2 !== undefined) this.s2 = state.s2;
  }

  private seed(seed: string): void {
    this.s0 -= this.mash(seed);
    if (this.s0 < 0) this.s0 += 1;
    this.s1 -= this.mash(seed);
    if (this.s1 < 0) this.s1 += 1;
    this.s2 -= this.mash(seed);
    if (this.s2 < 0) this.s2 += 1;
  }

  static createMash(): (data: string) => number {
    let n = 0xefc8249d;
    return function (data: string): number {
      data = String(data);
      for (let i = 0; i < data.length; i++) {
        n += (data as string).charCodeAt(i);
        let h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000;
      }
      return (n >>> 0) * 2.3283064365386963e-10;
    };
  }

  static factory(seed: string, opts?: { state?: AleaState }): AleaCallable {
    const gen = new Alea(seed);
    const fn = gen.next.bind(gen) as AleaCallable;

    fn.int32 = () => gen.int32();
    fn.double = () => gen.double();
    fn.quick = fn;

    if (opts?.state) gen.setState(opts.state);
    fn.state = () => gen.getState();

    return fn;
  }
}

export interface AleaCallable {
  (): number;
  int32(): number;
  double(): number;
  quick(): number;
  state?(): AleaState;
}
