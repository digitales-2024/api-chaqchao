export function numberToLetter(num: number, moneda = 'soles') {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = [
    '',
    'diez',
    'veinte',
    'treinta',
    'cuarenta',
    'cincuenta',
    'sesenta',
    'setenta',
    'ochenta',
    'noventa'
  ];
  const especiales = [
    'diez',
    'once',
    'doce',
    'trece',
    'catorce',
    'quince',
    'dieciséis',
    'diecisiete',
    'dieciocho',
    'diecinueve'
  ];
  const centenas = [
    '',
    'ciento',
    'doscientos',
    'trescientos',
    'cuatrocientos',
    'quinientos',
    'seiscientos',
    'setecientos',
    'ochocientos',
    'novecientos'
  ];

  function convertirEntero(num: number) {
    if (num === 0) return 'cero';
    if (num === 100) return 'cien';

    let texto = '';
    const centenasParte = Math.floor(num / 100);
    const decenasParte = Math.floor((num % 100) / 10);
    const unidadesParte = num % 10;

    if (centenasParte > 0) texto += centenas[centenasParte] + ' ';
    if (decenasParte === 1 && unidadesParte > 0) {
      texto += especiales[unidadesParte] + ' ';
    } else {
      if (decenasParte > 0) texto += decenas[decenasParte] + (unidadesParte > 0 ? ' y ' : ' ');
      if (unidadesParte > 0) texto += unidades[unidadesParte];
    }

    return texto.trim();
  }

  function convertirDecimales(decimales: string) {
    return decimales.toString().padStart(2, '0');
  }

  const [parteEntera, parteDecimal] = num.toFixed(2).split('.');
  const letrasEntero = convertirEntero(Number(parteEntera));
  const letrasDecimales = convertirDecimales(parteDecimal);

  return `${letrasEntero.toUpperCase()} con ${letrasDecimales}/100 ${moneda.toUpperCase()}`;
}
