// DID (Decentralized Identifier) utilities
// This file contains mock implementations for DID-related functionality

export interface DidInfo {
  did: string;
  signature: string;
  timestamp: number;
}

export interface DidCredential {
  did: string;
  privateKey: string;
  publicKey: string;
}

/**
 * Mock DID validation
 * In a real implementation, this would verify the DID signature against the public key
 */
export function validateDid(didInfo: DidInfo): boolean {
  // Mock validation - check basic format and timestamp
  if (!didInfo.did || !didInfo.signature || !didInfo.timestamp) {
    return false;
  }

  // Check DID format (should start with did:nuwa:)
  if (!didInfo.did.startsWith("did:nuwa:")) {
    return false;
  }

  // Check timestamp is not too old (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - didInfo.timestamp);
  if (timeDiff > 300) {
    // 5 minutes
    return false;
  }

  // Mock signature validation (in real implementation, verify against public key)
  return didInfo.signature.length > 10;
}

/**
 * Mock DID signing
 * In a real implementation, this would create a cryptographic signature
 */
export function signWithDid(
  credential: DidCredential,
  message: string,
): string {
  // Mock signature - in real implementation, use proper cryptographic signing
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${credential.did}:${message}:${timestamp}`;
  return `mock-signature-${btoa(payload).substring(0, 20)}`;
}

/**
 * Create DID headers for API requests
 */
export function createDidHeaders(
  credential: DidCredential,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `auth:${timestamp}`;
  const signature = signWithDid(credential, message);

  return {
    "x-did": credential.did,
    "x-did-signature": signature,
    "x-did-timestamp": timestamp.toString(),
  };
}

/**
 * Parse DID from string input
 * Validates the format and returns parsed DID info
 */
export function parseDid(didString: string): {
  isValid: boolean;
  did?: string;
} {
  if (!didString) {
    return { isValid: false };
  }

  // Basic format validation
  if (!didString.startsWith("did:")) {
    return { isValid: false };
  }

  // For now, accept any did: format
  return { isValid: true, did: didString };
}

/**
 * Create a mock credential from a DID string
 * In a real implementation, this would involve proper key derivation or import
 */
export function createCredentialFromDid(
  didString: string,
): DidCredential | null {
  const parsed = parseDid(didString);
  if (!parsed.isValid || !parsed.did) {
    return null;
  }

  return {
    did: parsed.did,
    privateKey: `mock-private-key-for-${parsed.did}`,
    publicKey: `mock-public-key-for-${parsed.did}`,
  };
}
