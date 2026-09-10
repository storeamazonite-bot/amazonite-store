import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { generatePasswordHash, verifyOwnerPassword, verifyOwnerEmail, verifyTotp, buildTotpUri, createOwnerSession, verifyOwnerSession } from '../lib/owner-auth.mjs';

process.env.AMAZONITE_AUTH_SECRET = 'test-only-secret-change-me';
process.env.AMAZONITE_OWNER_EMAIL = 'owner@example.com';
process.env.AMAZONITE_OWNER_PASSWORD_HASH = generatePasswordHash('correct-password');

function totp(secret, nowMs) {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits=0,buffer=0,out=[];
  for(const c of secret){const n=alphabet.indexOf(c);buffer=(buffer<<5)|n;bits+=5;while(bits>=8){bits-=8;out.push((buffer>>bits)&255);}}
  const key=Buffer.from(out), counter=Math.floor(nowMs/1000/30), message=Buffer.alloc(8); message.writeBigUInt64BE(BigInt(counter));
  const digest=createHmac('sha1',key).update(message).digest(),i=digest[digest.length-1]&15;
  return String((((digest[i]&127)<<24)|(digest[i+1]<<16)|(digest[i+2]<<8)|digest[i+3])%1000000).padStart(6,'0');
}

test('owner password and configured owner email validate', () => {
  assert.equal(verifyOwnerPassword('correct-password'), true);
  assert.equal(verifyOwnerPassword('wrong-password'), false);
  assert.equal(verifyOwnerEmail('OWNER@example.com'), true);
  assert.equal(verifyOwnerEmail('other@example.com'), false);
});

test('TOTP accepts current code and rejects invalid code', () => {
  const secret='JBSWY3DPEHPK3PXP', now=1_800_000_000_000, code=totp(secret,now);
  assert.equal(verifyTotp(code,secret,now),true);
  assert.equal(verifyTotp('000000',secret,now),false);
  assert.match(buildTotpUri(secret),/^otpauth:\/\/totp\//);
});

test('owner session requires password + TOTP assurance marker', () => {
  const now=1_800_000_000, token=createOwnerSession(now);
  assert.equal(verifyOwnerSession(token,now+60),true);
  const payload=JSON.parse(Buffer.from(token.split('.')[0],'base64url').toString('utf8'));
  payload.amr=['pwd'];
  const unsigned=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature=createHmac('sha256',process.env.AMAZONITE_AUTH_SECRET).update(unsigned).digest('base64url');
  assert.equal(verifyOwnerSession(`${unsigned}.${signature}`,now+60),false);
  assert.equal(verifyOwnerSession(token,now+60*60*9),false);
  assert.equal(verifyOwnerSession(`${token}x`,now+60),false);
});
