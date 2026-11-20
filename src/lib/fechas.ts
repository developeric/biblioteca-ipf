const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function sumarDias(desde: number, dias: number): number {
  return desde + dias * MS_POR_DIA;
}

function dosDigitos(numero: number): string {
  return String(numero).padStart(2, '0');
}

// dd/mm/aaaa, el formato que se usa en Argentina.
export function formatearFecha(milisegundos: number): string {
  const fecha = new Date(milisegundos);
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}
