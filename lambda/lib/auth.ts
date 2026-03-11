import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';

interface Auth0User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

class JWTVerifier {
  private client: jwksClient.JwksClient;
  private auth0Domain: string;
  private audience: string;

  constructor() {
    this.auth0Domain = process.env.AUTH0_DOMAIN!;
    this.audience = process.env.AUTH0_AUDIENCE!;

    if (!this.auth0Domain || !this.audience) {
      throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be set');
    }

    this.client = jwksClient({
      jwksUri: `https://${this.auth0Domain}/.well-known/jwks.json`,
      requestHeaders: {},
      timeout: 30000,
    });
  }

  private getKey = (header: any, callback: any) => {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err, null);
        return;
      }

      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  };

  async verifyToken(token: string): Promise<Auth0User> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getKey,
        {
          audience: this.audience,
          issuer: `https://${this.auth0Domain}/`,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            reject(new Error(`Token verification failed: ${err.message}`));
            return;
          }

          if (!decoded || typeof decoded === 'string') {
            reject(new Error('Invalid token payload'));
            return;
          }

          resolve(decoded as Auth0User);
        },
      );
    });
  }
}

export { JWTVerifier, Auth0User };
