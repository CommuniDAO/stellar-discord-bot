import type {
  MetaFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";

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
import { ModalProvider, WalletProvider } from "~/context";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "CommuniDAO",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: designStyle },
];

export const loader = async ({ request, context }: LoaderArgs) => {
  const { sessionStorage } = context as any;

  const user = await getUser(request, sessionStorage);
  console.log("user", user);
  return json({ session: Boolean(user), user });
};

export default function App() {
  const data = useLoaderData();
  console.log("DATA", data);
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
        <ModalProvider>
          <WalletProvider>
            <Outlet />
          </WalletProvider>
        </ModalProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
