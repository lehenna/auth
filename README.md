# @lehenna/auth

> Implement a user authentication system in minutes.

## Introduction

With `@lehenna/auth` you can implement an authentication system using email or OAuth providers in minutes.

This module is database agnostic, so it can be used in any project.

## Quick start

### 1. Create a new authentication client:

```ts
import { Client } from "@lehenna/auth";

const client = new Client(models, options);
```

### 2. Create models:

```ts
const userModel: UserModel<string, User> = {
  async findByEmail(email) {
    return db.users.findOne({ email });
  },
};

const verificationCodeModel: VerificationCodeModel<string> = {
  async create(data) {
    return db.verificationCodes.create(data);
  },
  async findByUserId(userId) {
    return db.verificationCodes.findOne({ userId });
  },
  async remove(id) {
    return db.verificationCodes.remove({ id });
  },
  async update(id, data) {
    return db.verificationCodes.update({ id }, data);
  },
};

const sessionModel: SessionModel<string, User> = {
  async findById(id) {
    return db.sessions.findOne({ id });
  },
  async remove(id) {
    return db.sessions.remove({ id });
  },
  async update(id, data) {
    return db.sessions.update({ id }, data);
  },
};
```

The models in the database must have a definition equal to the following:

```ts
interface User {
  id: string;
  email: string;
}

interface Session {
  id: string;
  expiresIn: number;
  user: User;
}

interface VerificationCode {
  id: string;
  expiresIn: number;
  userId: string;
  code: string;
}
```

### 3. Options

```ts
interface ClientOptions {
  secret: string;
  mailer: MailerFunction;
  sessionExpiresIn?: number;
  codeExpiresIn?: number;
}

const options: ClientOptions = {
  secret: "my-secret",
  mailer: async (user, code) => {
    const html = `<p>Your code is ${code}</p>`;
    await sendMail(user.email, html);
  },
};
```

## Authentication flow:

### Send Verification Code:

```ts
const user = await client.sendVerificationCode(email);
console.info(user);
```

### Validate Verification Code:

```ts
const session = await client.validateVerificationCode(email, inputCode);
console.info(session);
```

### Validate Session:

```ts
const session = await client.validateUserSession(sessionsId);
console.info(session);
```

## License

[MIT License](/LICENSE.md)
