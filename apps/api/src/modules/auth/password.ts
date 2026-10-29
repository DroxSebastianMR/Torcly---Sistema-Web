import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'

const parameters = { cost: 16_384, blockSize: 8, parallelization: 1 }
const keyLength = 64

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      keyLength,
      {
        N: parameters.cost,
        r: parameters.blockSize,
        p: parameters.parallelization,
        maxmem: 64 * 1024 * 1024,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    )
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt)
  return [
    'scrypt',
    parameters.cost,
    parameters.blockSize,
    parameters.parallelization,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$')
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, expected] =
    encodedHash.split('$')

  if (
    algorithm !== 'scrypt' ||
    Number(cost) !== parameters.cost ||
    Number(blockSize) !== parameters.blockSize ||
    Number(parallelization) !== parameters.parallelization ||
    !salt ||
    !expected
  ) {
    return false
  }

  try {
    const actualKey = await deriveKey(password, Buffer.from(salt, 'base64url'))
    const expectedKey = Buffer.from(expected, 'base64url')
    return (
      actualKey.length === expectedKey.length &&
      timingSafeEqual(actualKey, expectedKey)
    )
  } catch {
    return false
  }
}
