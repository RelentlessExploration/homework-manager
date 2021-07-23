import "../styles/master.css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject,
} from "@apollo/client";
import { BACKEND } from "../constants/apollo";
import { generateApolloClient } from "../lib/clientGenerator";
import { getWithExpiry } from "../lib/localStorageExpiration";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-calendar/dist/Calendar.css";
import { Nav } from "../components/nav/Nav";
import { isClient } from "../lib/isClient";
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/AuthContext";

export const shibe = generateApolloClient(BACKEND);
export const SERVER_ID = isClient
  ? getWithExpiry(window.localStorage, "serverId")
  : -1;

export const burrito: ApolloClient<NormalizedCacheObject> =
  generateApolloClient(
    `${
      process.env.NODE_ENV === "development"
        ? `http://localhost:500${SERVER_ID}`
        : `http://homework-manager-db${SERVER_ID}.herokuapp.com`
    }`
  );

const App = ({ Component, pageProps }: AppProps) => {
  const [b, setB] = useState<boolean>(false);

  useEffect(() => {
    setB(isClient);
  }, []);

  return b ? (
    <>
      <Nav transparent={false} />
      <div className="App">
        <Head>
          <title>Your Doge</title>
          <meta
            name="description"
            content="An awesome doge themed homework manager."
          />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Your Doge Home" />
          <meta
            property="og:description"
            content="An awesome doge themed homework manager."
          />
          <meta property="og:site_name" content="Your Doge" />
        </Head>
        <main>
          <Component {...pageProps} />
        </main>
      </div>
    </>
  ) : (
    <></>
  );
};

const ApolloWrapper: React.FC<AppProps> = (props) => {
  const baseClient = (
    <ApolloProvider client={shibe}>
      <AuthProvider>
        <App {...props} />
      </AuthProvider>
    </ApolloProvider>
  );

  if (SERVER_ID) {
    return <ApolloProvider client={burrito}>{baseClient}</ApolloProvider>;
  }

  return baseClient;
};

export default ApolloWrapper;