import { ncrypt as Ncrypt } from "ncrypt-js";

export interface User<Id> {
  id: Id;
  email: string;
}

export interface VerificationCode<Id> {
  id: Id;
  userId: Id;
  expiresIn: number;
  code: string;
}

export interface Session<Id, TUser extends User<Id>> {
  id: Id;
  expiresIn: number;
  user: TUser;
}

export interface SessionModel<
  Id,
  TUser extends User<Id>,
  TSession extends Session<Id, TUser>
> {
  findById: (id: Id) => Promise<TSession | null>;
  create: (data: Omit<TSession, "id">) => Promise<TSession>;
  remove: (id: Id) => Promise<void>;
}

export interface UserModel<Id, TUser extends User<Id>> {
  findByEmail: (email: string) => Promise<TUser | null>;
}

export interface VerificationCodeModel<Id> {
  findByUserId: (userId: Id) => Promise<VerificationCode<Id> | null>;
  create: (
    data: Omit<VerificationCode<Id>, "id">
  ) => Promise<VerificationCode<Id>>;
  update: (
    id: Id,
    data: Partial<Omit<VerificationCode<Id>, "id">>
  ) => Promise<void>;
  remove: (id: Id) => Promise<void>;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface ClientModels<
  Id,
  TUser extends User<Id>,
  TSession extends Session<Id, TUser>
> {
  verificationCode: VerificationCodeModel<Id>;
  user: UserModel<Id, TUser>;
  session: SessionModel<Id, TUser, TSession>;
}

export type MailerFunction<Id, TUser extends User<Id>> = (
  user: TUser,
  code: string
) => Promise<void>;

export interface ClientOptions<Id, TUser extends User<Id>> {
  secret: string;
  sessionExpiresIn?: number;
  codeExpiresIn?: number;
  mailer: MailerFunction<Id, TUser>;
}

export class Client<
  Id,
  TUser extends User<Id>,
  TSession extends Session<Id, TUser>
> {
  private models: ClientModels<Id, TUser, TSession>;
  private ncrypt: Ncrypt;
  private sessionExpiresIn: number;
  private codeExpiresIn: number;
  private mailer: MailerFunction<Id, TUser>;

  constructor(
    models: ClientModels<Id, TUser, TSession>,
    options: ClientOptions<Id, TUser>
  ) {
    this.models = models;
    if (!options.secret) throw new AuthError("Secret is required.");
    this.sessionExpiresIn = options.sessionExpiresIn ?? 1000 * 60 * 180; // 3h
    this.codeExpiresIn = options.sessionExpiresIn ?? 1000 * 60 * 15; // 15m
    const ncrypt = new Ncrypt(options.secret);
    this.ncrypt = ncrypt;
    this.mailer = options.mailer;
  }

  private encode(text: string) {
    return this.ncrypt.encrypt(text);
  }

  private decode(hash: string) {
    return this.ncrypt.decrypt(hash).toString();
  }

  private generateVerificationCode() {
    const code = Math.floor(10000000 + Math.random() * 90000000);
    return code.toString();
  }

  private async getVerificationCode(
    email: string
  ): Promise<[user: TUser, code: string]> {
    const user = await this.models.user.findByEmail(email);
    if (!user) throw new AuthError("User not found.");
    const currentCode = await this.models.verificationCode.findByUserId(
      user.id
    );
    if (currentCode) {
      await this.models.verificationCode.update(currentCode.id, {
        expiresIn: Date.now() + this.codeExpiresIn,
      } as Partial<Omit<VerificationCode<Id>, "id">>);
      return [user, this.decode(currentCode.code)];
    }
    const newCode = this.generateVerificationCode();
    await this.models.verificationCode.create({
      code: this.encode(newCode),
      expiresIn: Date.now() + this.codeExpiresIn,
      userId: user.id,
    });
    return [user, newCode];
  }

  async sendVerificationCode(email: string) {
    const [user, code] = await this.getVerificationCode(email);
    await this.mailer(user, code);
    return user;
  }

  async validateVerificationCode(
    email: string,
    inputCode: string,
    sessionOptions: Omit<Omit<Omit<TSession, "id">, "expiresIn">, "user">
  ) {
    const user = await this.models.user.findByEmail(email);
    if (!user) throw new AuthError("User not found.");
    const userCode = await this.models.verificationCode.findByUserId(user.id);
    if (!userCode) throw new AuthError("Verification code not found.");
    const code = this.decode(userCode.code);
    if (userCode.expiresIn < Date.now()) {
      await this.models.verificationCode.remove(userCode.id);
      throw new AuthError("Verification code expired.");
    }
    if (code !== inputCode)
      throw new AuthError("Verification code is incorrect.");
    await this.models.verificationCode.remove(userCode.id);
    const session = await this.models.session.create({
      user,
      expiresIn: Date.now() + this.sessionExpiresIn,
      ...sessionOptions,
    } as TSession);
    return session;
  }

  async validateUserSession(sessionId: Id) {
    const session = await this.models.session.findById(sessionId);
    if (!session) throw new AuthError("Session not found.");
    if (session.expiresIn < Date.now()) {
      await this.models.session.remove(session.id);
      throw new AuthError("Session expired.");
    }
    return session;
  }
}
