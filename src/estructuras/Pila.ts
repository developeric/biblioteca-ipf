// Pila (LIFO): el último elemento que entra es el primero que sale.
export class Pila<T> {
  #items: T[] = [];

  static desde<T>(elementos: readonly T[]): Pila<T> {
    const pila = new Pila<T>();
    for (const elemento of elementos) {
      pila.apilar(elemento);
    }
    return pila;
  }

  apilar(elemento: T): void {
    this.#items.push(elemento);
  }

  desapilar(): T | undefined {
    return this.#items.pop();
  }

  verTope(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  estaVacia(): boolean {
    return this.#items.length === 0;
  }

  get tamanio(): number {
    return this.#items.length;
  }

  // De la base al tope.
  aArray(): T[] {
    return [...this.#items];
  }

  clonar(): Pila<T> {
    return Pila.desde(this.#items);
  }
}
