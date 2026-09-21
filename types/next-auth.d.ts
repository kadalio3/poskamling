import { DefaultSession, DefaultUser } from "auth";
import { JWT, DefaultJWT } from "auth/jwt";

declare module "auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {}
}

declare module "auth/jwt" {
  interface JWT {
    id: string;
  }
}
