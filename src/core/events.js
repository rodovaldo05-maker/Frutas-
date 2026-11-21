// Barramento de eventos simples para os sistemas conversarem sem dependência direta.

export class Events {
  constructor() {
    this.handlers = new Map();
  }

  on(name, fn) {
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name).add(fn);
    return () => this.handlers.get(name)?.delete(fn);
  }

  emit(name, payload) {
    const set = this.handlers.get(name);
    if (!set) return;
    for (const fn of set) fn(payload);
  }
}

export const events = new Events();
