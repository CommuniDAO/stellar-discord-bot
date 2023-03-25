import type { MetaFunction, LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches
} from "@remix-run/react";
// import designStyle from 'wally-design-system/lib/styles/index.css';

// export const links: LinksFunction = () => ([
//   { rel: 'stylesheet', href: designStyle },
//   { rel: 'stylesheet', href: 'https://use.typekit.net/wdd6isw.css' },
// ]);

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "CommuniDAO",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  const matches = useMatches().find(
    (m) => m.pathname === '/auth_wallet'
  )
  if (typeof window !== "undefined") {
    // window.rabet.connect()
    const w: any = window;
    if (w.StellarSdk){
      console.log('Stellar SDK LOADED', w.StellarSdk);
    }
    
    // if (w.rabet) {
    //   w.rabet.connect()
    // }
  }

  return (
    <html lang="en" className="light">
      <head>
        <Meta />
        <Links />
        { matches?.pathname === '/auth_wallet' && <script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/10.1.0-beta.0/stellar-sdk.min.js" integrity="sha512-lujhwv2ioQeQ6B1Dsc+WTc8Fx6IXGM25e7lbYwG3vABdeMqz7RKbG2lX1zS81JA4KFRH4Ekv4ZXIxD1nSrTrJQ==" crossOrigin="anonymous" referrerPolicy="no-referrer"></script> }
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
