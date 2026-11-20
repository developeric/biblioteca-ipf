import { describe, expect, it } from '@jest/globals';
import { Cola } from '../Cola';

describe('Cola', () => {
  it('empieza vacía', () => {
    const cola = new Cola<string>();
    expect(cola.estaVacia()).toBe(true);
    expect(cola.tamanio).toBe(0);
    expect(cola.verFrente()).toBeUndefined();
  });

  it('desencola en el mismo orden en que se encoló', () => {
    const cola = Cola.desde(['Ana', 'Beto', 'Caro']);
    expect(cola.desencolar()).toBe('Ana');
    expect(cola.desencolar()).toBe('Beto');
    expect(cola.desencolar()).toBe('Caro');
    expect(cola.estaVacia()).toBe(true);
  });

  it('desencolar una cola vacía devuelve undefined sin romperse', () => {
    const cola = new Cola<string>();
    expect(cola.desencolar()).toBeUndefined();
    expect(cola.tamanio).toBe(0);
    cola.encolar('Ana');
    expect(cola.verFrente()).toBe('Ana');
  });

  it('mantiene el tamaño correcto al mezclar encolar y desencolar', () => {
    const cola = Cola.desde([1, 2, 3]);
    cola.desencolar();
    cola.encolar(4);
    expect(cola.tamanio).toBe(3);
    expect(cola.aArray()).toEqual([2, 3, 4]);
  });

  it('informa la posición empezando en 1', () => {
    const cola = Cola.desde(['Ana', 'Beto']);
    expect(cola.posicionDe('Ana')).toBe(1);
    expect(cola.posicionDe('Beto')).toBe(2);
    expect(cola.posicionDe('Nadie')).toBe(0);
    expect(cola.incluye('Beto')).toBe(true);
  });

  it('clonar crea una cola independiente', () => {
    const original = Cola.desde(['Ana']);
    const clon = original.clonar();
    clon.encolar('Beto');
    clon.desencolar();
    expect(original.aArray()).toEqual(['Ana']);
    expect(clon.aArray()).toEqual(['Beto']);
  });
});
