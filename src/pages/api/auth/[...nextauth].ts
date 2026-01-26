import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findDriverByEmail, verifyPassword } from "@/lib/airtable";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Haslo", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const driver = await findDriverByEmail(credentials.email);

        if (!driver) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, driver.password);

        if (!isValid) {
          return null;
        }

        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: undefined,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
