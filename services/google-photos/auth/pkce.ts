/**
 * Utilitários para PKCE (Proof Key for Code Exchange)
 * Utilizado para aumentar a segurança do Authorization Code Flow em SPAs
 */

/**
 * Gera um verifier aleatório (string longa e segura)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  window.crypto.getRandomValues(array);
  return b64urlEncode(array);
}

/**
 * Gera um challenge a partir do verifier usando SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return b64urlEncode(new Uint8Array(digest));
}

/**
 * Codificação Base64Url (sem +, / ou =)
 */
function b64urlEncode(buffer: Uint8Array): string {
  const str = String.fromCharCode(...buffer);
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
