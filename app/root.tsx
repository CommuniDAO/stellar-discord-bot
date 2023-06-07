import type {
  MetaFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getUserAuthProgress, getUser } from "~/utils/session.server";
// import { checkRequirement } from "~/utils/misc.client";
import React from "react";
import {
  Links,
  //LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import designStyle from "communi-design-system/styles/index.css";
import { ModalProvider, WalletProvider, useWallet } from "~/context";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "CommuniDAO",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: designStyle },
];

type Require = "discord_auth" | "wallet_auth";

function checkRequirement(
  authProgress: { requires: Require[]; view: string },
  requirement: Require
) {
  if (
    authProgress &&
    authProgress.requires &&
    Array.isArray(authProgress.requires)
  ) {
    return authProgress.requires.includes(requirement);
  }
  return false;
}

export const loader = async ({ request, context }: LoaderArgs) => {
  const { sessionStorage } = context as any;
  const authProgress =
    (await getUserAuthProgress(request, sessionStorage)) ?? {};
  const { provider, account } =
  (await getUser(request, sessionStorage)) ?? {};
  if (authProgress === null) return null;
  const discordAuthed = checkRequirement(authProgress, "discord_auth");
  const walletAuthed = checkRequirement(authProgress, "wallet_auth");
  return json({ discordAuthed, walletAuthed, authProgress, provider, account });
};

const Layout = ({
  authProgress,
  discordAuthed,
  walletAuthed,
}: {
  authProgress: any;
  discordAuthed: boolean;
  walletAuthed: boolean;
}) => {
  const { newSession } = useWallet();

  React.useEffect(() => {
    if (!discordAuthed && walletAuthed) {
      newSession();
    }
  }, [authProgress, discordAuthed, walletAuthed]);

  return <Outlet />;
};

export default function App() {
  const { authProgress, discordAuthed, walletAuthed, provider, account } = useLoaderData() ?? {};

  return (
    <html lang="en" className="light">
      <head>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.9.4/lottie.min.js"
          integrity="sha512-ilxj730331yM7NbrJAICVJcRmPFErDqQhXJcn+PLbkXdE031JJbcK87Wt4VbAK+YY6/67L+N8p7KdzGoaRjsTg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        ></script>
        <Meta />
        <Links />
      </head>
      <body>
        <WalletProvider walletAuthed={!walletAuthed} publicKey={account} provider={provider}>
          <ModalProvider>
            <Layout
              authProgress={authProgress}
              discordAuthed={discordAuthed}
              walletAuthed={walletAuthed}
            />
          </ModalProvider>
        </WalletProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
