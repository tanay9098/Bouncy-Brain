/**
 * Google Auth integration tests
 * Run with: node --test tests/auth.google.test.js
 * Requires: npm install --save-dev @jest/globals (or use node:test)
 */
const assert = require('node:assert/strict');
const { describe, it, before, after, mock } = require('node:test');
const mongoose = require('mongoose');

// Mock google-auth-library before requiring auth route
const mockVerifyIdToken = mock.fn();
mock.module('google-auth-library', {
  namedExports: {
    OAuth2Client: class {
      verifyIdToken({ idToken }) {
        return mockVerifyIdToken(idToken);
      }
    },
  },
});

const express = require('express');
const authRouter = require('../routes/auth');

process.env.JWT_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';

const MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/jumpybrain_test';

let app;

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.db.dropDatabase();
  app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
});

after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

function fakeTicket(email, sub, name = 'Test User', email_verified = true) {
  return {
    getPayload: () => ({ sub, email, name, email_verified }),
  };
}

async function post(path, body) {
  const { default: supertest } = await import('supertest');
  return supertest(app).post(path).send(body);
}

describe('POST /auth/google', () => {
  it('Scenario 1: creates new user when no account exists', async () => {
    mockVerifyIdToken.mock.mockImplementationOnce(() =>
      Promise.resolve(fakeTicket('newuser@example.com', 'google-id-1'))
    );
    const res = await post('/auth/google', { idToken: 'valid-token' });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'newuser@example.com');
    assert.ok(res.body.token);
    assert.equal(res.body.isNewUser, true);
  });

  it('Scenario 2: signs in existing Google-linked account', async () => {
    mockVerifyIdToken.mock.mockImplementationOnce(() =>
      Promise.resolve(fakeTicket('newuser@example.com', 'google-id-1'))
    );
    const res = await post('/auth/google', { idToken: 'valid-token' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'newuser@example.com');
    assert.ok(res.body.token);
    assert.equal(res.body.isNewUser, undefined);
  });

  it('Scenario 3 & 4: blocks Google auth when email belongs to email/password account', async () => {
    // First create an email/password account
    await post('/auth/signup', {
      email: 'existing@example.com',
      password: 'Password1',
      name: 'Existing User',
    });

    mockVerifyIdToken.mock.mockImplementationOnce(() =>
      Promise.resolve(fakeTicket('existing@example.com', 'google-id-2'))
    );
    const res = await post('/auth/google', { idToken: 'valid-token' });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'EMAIL_ACCOUNT_EXISTS');
    assert.ok(res.body.error.includes('email and password'));
  });

  it('returns 401 for invalid Google token', async () => {
    mockVerifyIdToken.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('Invalid token'))
    );
    const res = await post('/auth/google', { idToken: 'bad-token' });
    assert.equal(res.status, 401);
  });

  it('returns 400 when idToken is missing', async () => {
    const res = await post('/auth/google', {});
    assert.equal(res.status, 400);
  });

  it('returns 400 when Google email is not verified', async () => {
    mockVerifyIdToken.mock.mockImplementationOnce(() =>
      Promise.resolve(fakeTicket('unverified@example.com', 'google-id-3', 'User', false))
    );
    const res = await post('/auth/google', { idToken: 'valid-token' });
    assert.equal(res.status, 400);
  });
});

describe('POST /auth/login with Google-only accounts', () => {
  it('returns clear error when Google-only user tries password login', async () => {
    // Create a Google-only account first
    mockVerifyIdToken.mock.mockImplementationOnce(() =>
      Promise.resolve(fakeTicket('googleonly@example.com', 'google-id-4'))
    );
    await post('/auth/google', { idToken: 'valid-token' });

    const res = await post('/auth/login', {
      email: 'googleonly@example.com',
      password: 'anypassword',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'GOOGLE_ACCOUNT_NO_PASSWORD');
  });
});
