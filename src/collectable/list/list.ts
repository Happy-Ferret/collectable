import {log} from './common';
import {append, prepend} from './capacity';
import {focusOrdinal} from './focus';
import {ListState} from './state';

export type ListMutationCallback<T> = (list: List<T>) => void;

export class List<T> {
  static empty<T>(): List<T> {
    return _emptyList;
  }

  static of<T>(values: T[]): List<T> {
    if(!Array.isArray(values)) {
      throw new Error('First argument must be an array of values');
    }
    var state = ListState.empty<T>(false);
    append(state, values);
    return new List<T>(state);
  }

  constructor(public _state: ListState<T>) {}

  private _exec(fn: (state: ListState<T>) => void): List<T> {
    var state = this._state;
    var immutable = !state.mutable;
    if(immutable) {
      state = state.toMutable();
    }
    fn(state);
    return immutable ? new List<T>(state.toImmutable(true)) : this;
  }

  get size(): number {
    return this._state.size;
  }

  batch(callback: ListMutationCallback<T>): List<T> {
    var state = this._state.toMutable();
    var list = new List<T>(state);
    callback(list);
    state.toImmutable(true);
    return list;
  }

  asMutable(): List<T> {
    if(this._state.mutable) return this;
    return new List<T>(this._state.toMutable());
  }

  asImmutable(finished: boolean): List<T> {
    if(!this._state.mutable) return this;
    if(finished) {
      this._state.toImmutable(true);
      return this;
    }
    return new List<T>(this._state.toImmutable(false));
  }

  get(index: number): T|undefined {
    var view = focusOrdinal(this._state, index, false);
    if(view === void 0) return void 0;
    return <T>view.slot.slots[index - view.offset];
  }

  append(...values: T[]): List<T>
  append(): List<T> {
    return arguments.length === 0 ? this
      : this._exec(state => append(state, Array.from(arguments)));
  }

  appendArray(values: T[]): List<T> {
    return arguments.length === 0 ? this
      : this._exec(state => append(state, values));
  }

  prepend(...values: T[]): List<T>
  prepend(): List<T> {
    return arguments.length === 0 ? this
      : this._exec(state => prepend(state, Array.from(arguments)));
  }

  prependArray(values: T[]): List<T> {
    return arguments.length === 0 ? this
      : this._exec(state => prepend(state, values));
  }

  pop(): T|undefined {
    return void 0;
  }

  slice(start: number, end?: number): List<T> {
    throw new Error('Not implemented yet');
  }

  concat(...lists: List<T>[]): List<T>
  concat(): List<T> {
    if(arguments.length === 0) return this;
    var list = MutableList.transient<T>(this);
    list.concat.apply(list, arguments);
    return list.immutable();
  }
}

export function isDefaultEmptyList(list: List<any>): boolean {
  return list === _emptyList;
}

export var _emptyList = new List<any>(ListState.empty<any>(false));
