import { describe, expect, it } from 'vitest';
import { assignOrders, moveItem, nextOrder } from '@/lib/ordering';

/** Lista tal y como la ve el usuario: de mayor a menor `order`. */
const lista = [
  { id: 'a', order: 5 },
  { id: 'b', order: 4 },
  { id: 'c', order: 3 },
];

describe('moveItem', () => {
  it('lleva un elemento al principio', () => {
    expect(moveItem(lista, 2, 0).map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });

  it('lo sube una posición', () => {
    expect(moveItem(lista, 1, 0).map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('no modifica el array original', () => {
    moveItem(lista, 2, 0);
    expect(lista.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('nextOrder', () => {
  it('coloca lo nuevo por encima de todo', () => {
    expect(nextOrder(lista)).toBe(6);
  });

  it('empieza en 1 con la lista vacía', () => {
    expect(nextOrder([])).toBe(1);
  });

  it('no se confunde si la lista no está ordenada', () => {
    expect(nextOrder([{ id: 'x', order: 2 }, { id: 'y', order: 9 }, { id: 'z', order: 4 }])).toBe(10);
  });
});

describe('assignOrders', () => {
  it('reutiliza las posiciones que ya existían', () => {
    const cambios = assignOrders(moveItem(lista, 2, 0));

    // Las posiciones siguen siendo 5, 4 y 3: sólo cambia quién ocupa cada una.
    expect(Object.fromEntries(cambios)).toEqual({ c: 5, a: 4, b: 3 });
  });

  it('no devuelve los que se quedan donde estaban', () => {
    const cambios = assignOrders(moveItem(lista, 1, 0));

    expect(Object.fromEntries(cambios)).toEqual({ b: 5, a: 4 });
    expect(cambios.has('c')).toBe(false);
  });

  it('no escribe nada si el orden no cambia', () => {
    expect(assignOrders(lista).size).toBe(0);
  });

  it('renumera si los datos traen posiciones repetidas', () => {
    const repetidas = [
      { id: 'a', order: 0 },
      { id: 'b', order: 0 },
      { id: 'c', order: 0 },
    ];

    expect(Object.fromEntries(assignOrders(moveItem(repetidas, 2, 0)))).toEqual({ c: 3, a: 2, b: 1 });
  });

  it('respeta los huecos entre posiciones no consecutivas', () => {
    const conHuecos = [
      { id: 'a', order: 100 },
      { id: 'b', order: 7 },
      { id: 'c', order: 2 },
    ];

    expect(Object.fromEntries(assignOrders(moveItem(conHuecos, 2, 0)))).toEqual({
      c: 100,
      a: 7,
      b: 2,
    });
  });
});
