import * as jwt from 'jsonwebtoken';

/**
 * Decodifica un JWT sin verificar su firma.
 * @param token El token JWT a decodificar.
 * @returns El payload del token o `null` si el token es inválido.
 */
export function decodeJwt(token: string): Record<string, any> | null {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded ? (decoded as any).payload : null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
