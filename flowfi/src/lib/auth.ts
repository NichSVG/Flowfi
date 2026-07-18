import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";

const googleProvider = process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  ? Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET, checks: [] })
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        if (!user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const email = user.email;
          if (!email) return false;

          let dbUser = await prisma.user.findUnique({ where: { email } });

          if (!dbUser) {
            // New user - create account (sign-up)
            const newUser = await prisma.user.create({
              data: { email, name: user.name, image: user.image },
            });
            dbUser = newUser;

            // Create default categories
            try {
              for (const cat of EXPENSE_CATEGORIES) {
                const parent = await prisma.category.create({
                  data: {
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                    type: "expense",
                    userId: newUser.id,
                    isDefault: true,
                  },
                });
                if (cat.subcategories.length > 0) {
                  await prisma.category.createMany({
                    data: cat.subcategories.map((subName) => ({
                      name: subName,
                      icon: cat.icon,
                      color: cat.color,
                      type: "expense",
                      userId: newUser.id,
                      isDefault: true,
                      parentId: parent.id,
                    })),
                  });
                }
              }
              for (const cat of INCOME_CATEGORIES) {
                const parent = await prisma.category.create({
                  data: {
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                    type: "income",
                    userId: newUser.id,
                    isDefault: true,
                  },
                });
                if (cat.subcategories.length > 0) {
                  await prisma.category.createMany({
                    data: cat.subcategories.map((subName) => ({
                      name: subName,
                      icon: cat.icon,
                      color: cat.color,
                      type: "income",
                      userId: newUser.id,
                      isDefault: true,
                      parentId: parent.id,
                    })),
                  });
                }
              }
            } catch (catError) {
              console.error("Error creating categories:", catError);
            }

            // Mark as new user in JWT
            user.id = newUser.id;
          } else {
            // Existing user - sign in
            user.id = dbUser.id;
          }

          // Create account link if it doesn't exist
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null | undefined,
              },
            });
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard - the dashboard layout will handle onboarding redirect
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && token.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
          if (dbUser) {
            token.sub = dbUser.id;
          }
        }
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
