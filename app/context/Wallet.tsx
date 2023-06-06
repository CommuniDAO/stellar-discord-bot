import React, { type ReactElement, type FunctionComponent } from "react";
import { WalletClient } from "~/utils/WalletClient.client";
import { Modal } from "communi-design-system";
import { useTheme } from "./Theme";
import { QRCode } from "react-qrcode-logo";
import { useFetcher } from "@remix-run/react";
import {
  RadioGroup,
  Button,
  Loader,
  Layout,
  Icon,
} from "communi-design-system";
import { isConnected } from "@stellar/freighter-api";
import { isBrowser } from "~/utils/misc.client";

type WalletProviderProps = { children: ReactElement };
type Provider = "albedo" | "rabet" | "freighter" | "wallet_connect";
type Client = any | null;
type WalletContextType = {
  provider: Provider | null;
  url: string | null;
  publicKey: string | null;
  getProvider: () => void;
  newSession: () => void;
  initClient: (provider: Provider) => void;
  signTransaction: (xdr: string) => void;
  signChallenge: (xdr: string) => void;
};

export const WalletContext = React.createContext<WalletContextType>(
  {} as WalletContextType
);

export const WalletProvider: FunctionComponent<WalletProviderProps> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [provider, setProvider] = React.useState<Provider | null>(null);
  const [status, setStatus] = React.useState<"connected" | "disconnected">(
    "disconnected"
  );
  const [publicKey, setPublicKey] = React.useState<string | null>(null);
  const [client, setClient] = React.useState<Client>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [url, setUrl] = React.useState<string | null>(null);
  const fetcher = useFetcher();
  const closeModal = () => {
    setIsOpen(false);
  };

  const initClient = (provider: Provider) => {
    if (provider === null) return;
    setProvider(provider);
    const wc = new WalletClient(provider, "PUBLIC");
    setClient(wc);
    if (provider === "wallet_connect") {
      wc.initWalletConnect().then(({ uri }: any) => {
        setUrl(uri);
        wc.getPublicKey().then(async ({ publicKey, code, message }: any) => {
          if (code === 200) setPublicKey(publicKey);
        });
      });
    } else {
      wc.getPublicKey().then(async ({ publicKey, code, message }: any) => {
        if (code === 200) setPublicKey(publicKey);
      });
    }
  };

  const signTransaction = async (xdr: string) => {};

  const signChallenge = async (xdr: string) => {
    const { signed_envelope_xdr } = await client.signTransaction(xdr, false);
    if (
      !!signed_envelope_xdr &&
      fetcher.state === "idle" &&
      fetcher.data == null
    ) {
      fetcher.submit(
        { signed_envelope_xdr },
        { method: "post", action: `/challenge/verify?provider=${provider}` }
      );
    }
  };

  const getProvider = () => {
    return provider;
  };

  const newSession = () => {
    setIsOpen(true);
  };

  React.useEffect(() => {
    console.log("Wallet Provider", provider);
    if (fetcher.data) {
      // Once the challenge is signed
      // 1. we can close the modal
      // 2. let the session storage know that the user is connected
      console.log("fetcher data", fetcher.data);
    }
  }, [fetcher.data, provider]);

  return (
    <WalletContext.Provider
      value={{
        provider,
        getProvider,
        newSession,
        initClient,
        url,
        publicKey,
        signChallenge,
        signTransaction,
      }}
    >
      {children}
      <Modal
        initialState={isOpen}
        closeModal={closeModal}
        theme={theme}
        padding="large"
        size="medium"
        showBar={false}
        overflow={false}
      >
        <ImportAccount />
      </Modal>
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  return React.useContext(WalletContext);
};

const WalletConnect = ({}: any) => {
  const { initClient, url } = useWallet();

  React.useEffect(() => {
    if (isBrowser) {
      initClient("wallet_connect");
    }
  }, []);

  React.useEffect(() => {
    console.log("URL", url);
  }, [url]);

  return !url ? (
    <Loader />
  ) : (
    <div>
      <QRCode
        value={url}
        logoImage="https://imagedelivery.net/uDbEDRBQqhBXrrfuCRrATQ/eee714c7-b85b-42cf-23f7-d986b99c1b00/public"
        logoHeight={48}
        logoWidth={48}
        eyeRadius={8}
        size={256}
        bgColor="#C8D1E6"
        fgColor="#03050B"
        removeQrCodeBehindLogo={true}
        qrStyle="dots"
      />
    </div>
  );
};

const Albedo = ({}: any) => {
  const { initClient } = useWallet();
  React.useEffect(() => {
    initClient("albedo");
  }, []);
  return <Loader />;
};

const Freighter = ({}: any) => {
  const { initClient } = useWallet();
  React.useEffect(() => {
    initClient("freighter");
  }, []);
  return <Loader />;
};

const Rabet = ({}: any) => {
  const { initClient } = useWallet();
  React.useEffect(() => {
    initClient("rabet");
  }, []);
  return <Loader />;
};

const options = [
  {
    name: "Albedo",
    icon: "Albedo",
  },
  {
    name: "Rabet",
    icon: "Rabet",
  },
  {
    name: "Freighter",
    icon: "Freighter",
  },
  {
    name: "Wallet Connect",
    icon: "WalletConnect",
  },
];

type ImportAccountProps = {};

const walletAssert = (view: any) => {
  switch (view) {
    case "Rabet":
      return <Rabet />;
    case "Freighter":
      return <Freighter />;
    case "Albedo":
      return <Albedo />;
    case "Wallet Connect":
      return <WalletConnect />;
    default:
      return <></>;
  }
};

// Move to DS Headings.
const IconHeading = ({ text, icon }: any) => {
  return (
    <div className="flex flex-row">
      <Icon name={icon} size="large" />
      <div className="text-h4-bold">{text}</div>
    </div>
  );
};

const ImportAccount: React.FC<ImportAccountProps> = ({}) => {
  const { publicKey, signChallenge } = useWallet();
  const [view, setView] = React.useState("");
  const fetcher = useFetcher();

  React.useEffect(() => {
    console.log("publicKey", publicKey);
    if (
      publicKey !== null &&
      fetcher.state === "idle" &&
      fetcher.data == null
    ) {
      fetcher.load(`/challenge/${publicKey}`);
    }
  }, [fetcher, publicKey]);

  const { challenge } = fetcher.data ?? {};

  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-full">
        <div className="flex-1 w-full">
          {publicKey ? (
            <>
              <div className="text-h3-semi-bold">Challenge</div>
              <div className="text-p3-medium">
                Complete the following challenge to finish your
                authentification.
              </div>
              <div className="text-p2-medium">Public Key</div>
              <div
                className="text-caption-bold truncate text-neutral-700 bg-neutral-400 rounded-md"
                style={{ padding: "20px", marginTop: "8px" }}
              >
                <p className="truncate">{publicKey}</p>
              </div>
              <div className="text-p2-medium">Challenge XDR</div>
              <div
                className="text-caption-bold truncate text-neutral-700 bg-neutral-400 rounded-md"
                style={{ padding: "20px", marginTop: "8px" }}
              >
                <p className="truncate">{challenge}</p>
              </div>
              <div className="mt-[20px]">
                <Button
                  customCss="w-full"
                  icon="WalletConnect"
                  text="Sign Challenge"
                  onClick={() => signChallenge(challenge)}
                />
              </div>
            </>
          ) : view === "" ? (
            <>
              <IconHeading text="Extensions" icon="Extension" />
              <div className="text-p2-medium">
                Choose one of the login options to continue.
              </div>
              <div className="my-8">
                <div className="flex flex-col space-y-4">
                  {options.map((item, key) => {
                    return (
                      <div key={key}>
                        <Button
                          customCss="w-full"
                          variant="basic"
                          icon={item.icon}
                          text={item.name}
                          onClick={() => setView(item.name)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>{walletAssert(view)}</>
          )}
        </div>
      </div>
      <div>
        <div className="text-caption-medium text-center">
          <span>By continuing you accept our </span>
          <span className="text-caption-underlined text-primary-700">
            term of conditioons
          </span>
          <span> and our </span>
          <span className="text-caption-underlined text-primary-700">
            privacy policy
          </span>
        </div>
      </div>
    </div>
  );
};
