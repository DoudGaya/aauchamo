import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    username: string;
    companyId: string;
    securityVersion: number;
  }

  interface Session extends DefaultSession {
    sessionId: string;
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      companyId: string;
      securityVersion: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionId: string;
    username: string;
    companyId: string;
    securityVersion: number;
  }
}
