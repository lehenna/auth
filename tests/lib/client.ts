import { nanoid } from "nanoid";
import {
  Client,
  SessionModel,
  UserModel,
  VerificationCodeModel,
} from "../../src";

const testUser: User = {
  id: nanoid(),
  email: "example@mail.com",
};

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

const users: User[] = [testUser];
const codes: VerificationCode[] = [];
const sessions: Session[] = [];

const userModel: UserModel<string, User> = {
  async findByEmail(email) {
    const user = users.find((u) => u.email === email);
    return user ?? null;
  },
};

const verificationCodeModel: VerificationCodeModel<string> = {
  async create(data) {
    const newCode = {
      id: nanoid(),
      ...data,
    };
    codes.push(newCode);
    return newCode;
  },
  async findByUserId(userId) {
    const code = codes.find((u) => u.userId === userId);
    return code ?? null;
  },
  async remove(id) {
    const index = codes.findIndex((u) => u.id === id);
    codes.splice(index, 1);
  },
  async update(id, data) {
    const index = codes.findIndex((u) => u.id === id);
    codes[index] = {
      ...codes[index],
      ...data,
    };
  },
};

const sessionModel: SessionModel<string, User> = {
  async create(data) {
    const newSession = {
      id: nanoid(),
      ...data,
    };
    sessions.push(newSession);
    return newSession;
  },
  async findById(id) {
    const session = sessions.find((u) => u.id === id);
    return session ?? null;
  },
  async remove(id) {
    const index = sessions.findIndex((u) => u.id === id);
    sessions.splice(index, 1);
  },
};

let inputCode: string;

const client = new Client<string, User>(
  {
    user: userModel,
    verificationCode: verificationCodeModel,
    session: sessionModel,
  },
  {
    secret: "my-secret",
    mailer: async (user, code) => {
      console.info(`${user.email} -> Your code is ${code}`);
      inputCode = code;
    },
  }
);

export {
  client,
  users,
  userModel,
  sessionModel,
  verificationCodeModel,
  codes,
  sessions,
  testUser,
  inputCode,
};
