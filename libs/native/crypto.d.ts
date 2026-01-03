declare module 'native/crypto' {
  /**
   * Supported hash algorithms
   */
  type HashAlgorithm = 'sha1' | 'sha256' | 'sha512' | 'md5';

  /**
   * Hash instance for computing message digests
   */
  interface Hash {
    /**
     * Update the hash with new data
     * @param data Data to hash (string or ArrayBuffer)
     * @throws {Error} If hash instance is already finalized
     */
    update(data: string | ArrayBuffer): void;

    /**
     * Finalize the hash computation and get the digest
     * @returns Digest as ArrayBuffer
     * @throws {Error} If hash instance is already finalized
     */
    finalize(): ArrayBuffer;
  }

  /**
   * Cryptographic operations
   */
  interface Crypto {
    /**
     * Create a new hash instance for the specified algorithm
     * @param algorithm Hash algorithm to use
     * @returns New Hash instance
     * @throws {Error} If algorithm is not supported
     */
    createHash(algorithm: HashAlgorithm): Hash;
  }

  const crypto: Crypto;
  export = crypto;
}
