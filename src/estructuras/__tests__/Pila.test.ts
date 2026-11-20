import { describe, expect, it } from '@jest/globals';
import { Pila } from '../Pila';

describe('Pila', () => {
  it('empieza vacía', () => {
    const pila = new Pila<string>();
    expect(pila.estaVacia()).toBe(true);
    expect(pila.tamanio).toBe(0);
    expect(pila.verTope()).toBeUndefined();
  });

  it('desapila en orden inverso al que se apiló', () => {
    const pila = Pila.desde(['a', 'b', 'c']);
    expect(pila.desapilar()).toBe('c');
    expect(pila.desapilar()).toBe('b');
    expect(pila.desapilar()).toBe('a');
    expect(pila.estaVacia()).toBe(true);
  });

  it('desapilar una pila vacía devuelve undefined sin romperse', () => {
    const pila = new Pila<number>();
    expect(pila.desapilar()).toBeUndefined();
    expect(pila.tamanio).toBe(0);
  });

  it('verTope no quita el elemento', () => {
    const pila = Pila.desde([1, 2]);
    expect(pila.verTope()).toBe(2);
    expect(pila.tamanio).toBe(2);
  });

  it('aArray devuelve una copia de la base al tope', () => {
    const pila = Pila.desde([1, 2, 3]);
    const copia = pila.aArray();
    copia.push(99);
    expect(pila.aArray()).toEqual([1, 2, 3]);
  });

  it('clonar crea una pila independiente', () => {
    const original = Pila.desde(['x']);
    const clon = original.clonar();
    clon.apilar('y');
    expect(original.tamanio).toBe(1);
    expect(clon.tamanio).toBe(2);
  });
});
