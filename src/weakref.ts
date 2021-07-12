class ShamRef<T extends object> implements WeakRef<T> {
  #target: T;
  constructor(target: T) {
    this.#target = target;
  }
  [Symbol.toStringTag]: "WeakRef" = "WeakRef";
  public deref(): T | undefined {
    return this.#target;
  }
}

export default undefined !== typeof WeakRef ? WeakRef : ShamRef;
