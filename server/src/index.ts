import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./Resolvers/UserResolver";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectRedis from "connect-redis";
import session from "express-session";
import { redis } from "./redis";

// Import the routes
import { router as AuthRouter } from "./routes/AuthRoute";
import { HomeworkResolver } from "./Resolvers/HomeworkResolver";

const PORT: number = parseInt(process.env.PORT!) || 4000;
const HOSTNAME: string = process.env.HOST || "localhost";
export const FRONTEND_URL = "https://yourdoge.netlify.app";
export const DEV_FRONTEND = "http://localhost:3000";

(async () => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(
    cors({
      credentials: true,
      origin: [FRONTEND_URL, DEV_FRONTEND],
    })
  );
  const RedisStore = connectRedis(session);
  app.use(
    session({
      store: new RedisStore({
        client: redis as any,
      }),
      name: "angularsucks",
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
      },
    })
  );

  // use the routes
  app.use("/auth", AuthRouter);

  await createConnection();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers:
        process.env.HANDLE_HOMEWORK! === "true"
          ? [UserResolver, HomeworkResolver]
          : [UserResolver],
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(PORT, HOSTNAME, () => {
    console.log(`app listening at: http://${HOSTNAME}:${PORT}`);
  });
})();
