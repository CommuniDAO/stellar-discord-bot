import React from "react";
import {
  RadioGroup,
  Button,
  Loader,
  Layout,
  Icon,
} from "communi-design-system";
import { isConnected } from "@stellar/freighter-api";
// import { useFetcher } from "@remix-run/react";
import { WalletClient } from "~/utils/WalletClient.client";
import { isBrowser } from "~/utils/misc.client";
import { QRCode } from "react-qrcode-logo";
import { useModal, useWallet } from "~/context";

const WalletConnect = ({ openModal }: any) => {
  const [url, setUrl] = React.useState("");
  // const wc = new WalletClient("wallet_connect", "TESTNET");

  // React.useEffect(() => {
  //   if (isBrowser) {
  //     wc.initWalletConnect()
  //       .then(({ uri }: any) => {
  //         if (uri) {
  //           setUrl(uri);
  //           wc.getPublicKey().then(async (publicKey: any) => {
  //             console.log("session, ", wc.getSession());
  //             openModal({
  //               type: "challenge",
  //               content: {
  //                 public_key: publicKey,
  //                 provider: "wallet_connect",
  //                 padding: "large",
  //               },
  //             });
  //           });
  //         }
  //       })
  //       .catch((e: any) => {
  //         console.log("error, ", e);
  //       });
  //   }
  // }, []);

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

const Albedo = ({ openModal }: any) => {
  // const wc = new WalletClient("albedo", "TESTNET");
  // wc.getPublicKey().then(async (account: any) => {
  //   openModal({
  //     type: "challenge",
  //     content: {
  //       public_key: account.pubkey,
  //       provider: "albedo",
  //       padding: "large",
  //     },
  //   });
  // });
  return <Loader />;
};

const Freighter = ({ openModal }: any) => {
  // const { initClient } = useWallet();
  React.useEffect(() => {
    // initClient("freighter");
  }, []);
  // React.useEffect(() => {
  //   if (isConnected()) {
  //     const wc = new WalletClient("freighter", "TESTNET");
  //     wc.getPublicKey().then(async (value: any) => {
  //       const public_key = await value();
  //       openModal({
  //         type: "challenge",
  //         content: { public_key, provider: "freighter", padding: "large" },
  //       });
  //     });
  //   }
  // }, []);
  return <Loader />;
};

const Rabet = ({ openModal }: any) => {
  console.log('useWallet', useWallet())
  console.log('useModal', useModal())

  // const { getProvider } = useWallet();
  React.useEffect(() => {
    // initClient("rabet");
    // getProvider();
  }, []);
  // React.useEffect(() => {
  //   const wc = new WalletClient("rabet", "TESTNET");
  //   wc.getPublicKey().then(async (publicKey: any) => {
  //     console.log("getting", publicKey);
  //     openModal({
  //       type: "challenge",
  //       content: { public_key: publicKey, provider: "rabet", padding: "large" },
  //     });
  //   });
  // }, []);

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

const walletAssert = (view: any, openModal: any) => {
  switch (view) {
    case "Rabet":
      return <Rabet openModal={openModal} />;
    case "Freighter":
      return <Freighter openModal={openModal} />;
    case "Albedo":
      return <Albedo openModal={openModal} />;
    case "Wallet Connect":
      return <WalletConnect openModal={openModal} />;
    default:
      return <></>;
  }
};

// Move to DS Headings.
const IconHeading = ({ text, icon }: any) => {
  return (
    <div className="flex flex-row">
      <Icon name={icon} />
      <div className="text-h6-bold">{text}</div>
    </div>
  );
};

export const ImportAccount: React.FC<ImportAccountProps> = ({}) => {
  const [view, setView] = React.useState("");
  const { openModal } = useModal();

  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-full">
        {/* <div className="flex-1">
                    <IconHeading text="Wallet Connect" icon="walletConnect" />
                    <div className="text-p2-medium ">
                      Scan the QR with your phone from a wallet app
                      ** WALLET CONNECT IS STILL BEING DEBUGGED USE A DIFFERENT WALLET**
                    </div>
                    <div className="flex flex-col items-center my-8" style={{height: '300px'}}>
                      <WalletConnect openModal={openModal} />
                    </div>
                  </div> */}
        <div className="flex-1">
          <IconHeading text="Extensions" icon="extensions" />
          <div className="text-p2-medium ">
            Other login options to login from your browser
          </div>
          <div className="my-8">
            <div className="flex flex-col space-y-4">
              {view === "" ? (
                <>
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
                </>
              ) : (
                walletAssert(view, openModal)
              )}
            </div>
          </div>
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
