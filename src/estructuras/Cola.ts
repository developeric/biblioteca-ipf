// Cola (FIFO): el primero que entra es el primero que sale.
// No usa shift() (que es O(n)): avanza un índice al desencolar.
export class Cola<T> {
  #items: T[] = [];
  #inicio = 0;

  static desde<T>(elementos: readonly T[]): Cola<T> {
    const cola = new Cola<T>();
    for (const elemento of elementos) {
      cola.encolar(elemento);
    }
    return cola;
  }

  encolar(elemento: T): void {
    this.#items.push(elemento);
  }

  desencolar(): T | undefined {
    if (this.estaVacia()) return undefined;
    const elemento = this.#items[this.#inicio];
    this.#inicio += 1;
    if (this.#inicio === this.#items.length) {
      this.#items = [];
      this.#inicio = 0;
    }
    return elemento;
  }

  verFrente(): T | undefined {
    return this.estaVacia() ? undefined : this.#items[this.#inicio];
  }

  estaVacia(): boolean {
    return this.tamanio === 0;
  }

  incluye(elemento: T): boolean {
    return this.aArray().includes(elemento);
  }

  // Posición empezando en 1 (el frente es la posición 1); 0 si no está.
  posicionDe(elemento: T): number {
    return this.aArray().indexOf(elemento) + 1;
  }

  get tamanio(): number {
    return this.#items.length - this.#inicio;
  }

  // Del frente al final.
  aArray(): T[] {
    return this.#items.slice(this.#inicio);
  }

  clonar(): Cola<T> {
    return Cola.desde(this.aArray());
  }
}
