import { execSync } from "node:child_process";

export function encryptEnvs() {
  if (!process.env.ENV_PASSPHRASE)
    throw new Error("ENV_PASSPHRASE is not set.");
  execSync(
    `gpg --quiet --batch --yes --passphrase="${process.env.ENV_PASSPHRASE}" --symmetric --cipher-algo AES256 --output .env.gpg .env`
  );
}

export function decryptEnvs() {
  if (!process.env.ENV_PASSPHRASE)
    throw new Error("ENV_PASSPHRASE is not set.");
  execSync(
    `gpg --quiet --batch --yes --passphrase="${process.env.ENV_PASSPHRASE}" --output .env --decrypt .env.gpg`
  );
}
