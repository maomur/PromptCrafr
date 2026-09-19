import { describe, expect, it } from 'vitest';
import { matchesQuery, normalizeText, parseQuery } from '@/lib/search';

/** Prompt de referencia, con acentos repartidos por los tres campos. */
const campos = [
  'Generador de vídeo cinematográfico',
  'Prompt para Sora con estética años 80',
  'Plano secuencia, luz azul neón, cámara en mano',
];

const busca = (consulta: string) => matchesQuery(campos, parseQuery(consulta));

describe('normalizeText', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizeText('Diseño Gráfico ÁÉÍÓÚ')).toBe('diseno grafico aeiou');
  });
});

describe('matchesQuery', () => {
  it('encuentra sin tildes lo que sí las lleva, y al revés', () => {
    expect(busca('video')).toBe(true);
    expect(busca('vídeo')).toBe(true);
    expect(busca('cinematografico')).toBe(true);
  });

  it('ignora las mayúsculas', () => {
    expect(busca('VIDEO')).toBe(true);
  });

  it('busca en la descripción y en el contenido, no sólo en el título', () => {
    expect(busca('sora')).toBe(true);
    expect(busca('neón')).toBe(true);
  });

  it('exige todas las palabras, aunque estén en campos distintos', () => {
    expect(busca('video sora')).toBe(true);
    expect(busca('sora video')).toBe(true);
    expect(busca('video podcast')).toBe(false);
  });

  it('no inventa coincidencias', () => {
    expect(busca('fotografía')).toBe(false);
  });

  it('una consulta vacía no filtra', () => {
    expect(busca('')).toBe(true);
    expect(busca('   ')).toBe(true);
    expect(busca('  video  ')).toBe(true);
  });

  it('aguanta los campos vacíos de un enlace sin título', () => {
    expect(matchesQuery([null, undefined, 'https://ejemplo.com'], parseQuery('ejemplo'))).toBe(true);
    expect(matchesQuery([null, undefined], parseQuery('ejemplo'))).toBe(false);
  });
});
