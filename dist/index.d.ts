interface User<Id> {
    id: Id;
    email: string;
}
interface VerificationCode<Id> {
    id: Id;
    userId: Id;
    expiresIn: number;
    code: string;
}
interface Session<Id, TUser extends User<Id>> {
    id: Id;
    expiresIn: number;
    user: TUser;
}
interface SessionModel<Id, TUser extends User<Id>> {
    findById: (id: Id) => Promise<Session<Id, TUser> | null>;
    create: (data: Omit<Session<Id, TUser>, "id">) => Promise<Session<Id, TUser>>;
    remove: (id: Id) => Promise<void>;
}
interface UserModel<Id, TUser extends User<Id>> {
    findByEmail: (email: string) => Promise<TUser | null>;
}
interface VerificationCodeModel<Id> {
    findByUserId: (userId: Id) => Promise<VerificationCode<Id> | null>;
    create: (data: Omit<VerificationCode<Id>, "id">) => Promise<VerificationCode<Id>>;
    update: (id: Id, data: Partial<Omit<VerificationCode<Id>, "id">>) => Promise<void>;
    remove: (id: Id) => Promise<void>;
}
declare class AuthError extends Error {
    constructor(message: string);
}
interface ClientModels<Id, TUser extends User<Id>> {
    verificationCode: VerificationCodeModel<Id>;
    user: UserModel<Id, TUser>;
    session: SessionModel<Id, TUser>;
}
type MailerFunction<Id, TUser extends User<Id>> = (user: TUser, code: string) => Promise<void>;
interface ClientOptions<Id, TUser extends User<Id>> {
    secret: string;
    sessionExpiresIn?: number;
    codeExpiresIn?: number;
    mailer: MailerFunction<Id, TUser>;
}
declare class Client<Id, TUser extends User<Id>> {
    private models;
    private ncrypt;
    private sessionExpiresIn;
    private codeExpiresIn;
    private mailer;
    constructor(models: ClientModels<Id, TUser>, options: ClientOptions<Id, TUser>);
    private encode;
    private decode;
    private generateVerificationCode;
    private getVerificationCode;
    sendVerificationCode(email: string): Promise<TUser>;
    validateVerificationCode(email: string, inputCode: string): Promise<Session<Id, TUser>>;
    validateUserSession(sessionId: Id): Promise<Session<Id, TUser>>;
}

export { AuthError, Client, type ClientModels, type ClientOptions, type MailerFunction, type Session, type SessionModel, type User, type UserModel, type VerificationCode, type VerificationCodeModel };
