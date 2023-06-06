import React from "react";
import { useFetcher } from "@remix-run/react";
import { WalletClient } from "~/utils/WalletClient.client";
import { Button } from "communi-design-system";
import { useModal } from "~/context";
import { QRCode } from "react-qrcode-logo";
import { isBrowser } from "~/utils/misc.client";

type ChallengeProps = {
  content: {
    public_key: string;
    provider: "albedo" | "rabet" | "freighter" | "wallet_connect";
  };
};

type SignerProps = {
  provider: "albedo" | "rabet" | "freighter" | "wallet_connect";
  xdr: string;
  afterSuccess?: () => void;
};

const Signer: React.FC<SignerProps> = ({ provider, xdr, afterSuccess }) => {
  const [url, setUrl] = React.useState("");
  const wc = new WalletClient("wallet_connect", "TESTNET");

  React.useEffect(() => {
    if (isBrowser && provider === "wallet_connect") {
      wc.initWalletConnect()
        .then(({ uri }: any) => {
          if (uri) {
            setUrl(uri);
            // wc.getPublicKey().then(async (publicKey: any) => {
   
            // });
          }
        })
        .catch((e: any) => {
          console.log("error, ", e);
        });
    }
  }, []);

  const browserSign = async ({ xdr }: any) => {
    const wc = new WalletClient(provider, "TESTNET");
    const { signed_envelope_xdr }: any = await wc.signTransaction(xdr, false);
    // Submit
    // if (!!signed_envelope_xdr && payload.type === "init") {
    //   payload.submit(
    //     { signed_envelope_xdr },
    //     { method: "post", action: `/challenge/verify?provider=${provider}` }
    //   );
    // }
  };

  return (
    <>
      {provider === "wallet_connect" ? (
        <>
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
        </>
      ) : (
        <Button
          text="Sign"
          onClick={() => browserSign({ xdr })}
          customCss="w-full mt-[40px]"
        />
      )}
    </>
  );
};

export const Challenge: React.FC<ChallengeProps> = ({ content }) => {
  // const { closeModal } = useModal();
  const { public_key, provider } = content as any;

  const fetcher = useFetcher();
  const payload = useFetcher();

  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load(`/challenge/${public_key}`);
    }
  }, [fetcher]);

  // React.useEffect(() => {
  //   console.log('payload', payload)
  //   if (payload.data) {
  //     closeModal();
  //   }
  // }, [payload])

  const { challenge } = fetcher.data ?? {};

  return (
    <>
      <div className="text-h3-semi-bold">Challenge</div>
      <div className="text-p3-medium">
        Complete the following challenge to finish your authentification.
      </div>
      <div className="text-p2-medium">Public Key</div>
      <div
        className="text-caption-bold truncate text-neutral-700 bg-neutral-400 rounded-md"
        style={{ padding: "20px", marginTop: "8px" }}
      >
        {public_key}
      </div>
      {challenge && <Signer provider={provider} xdr={challenge} />}
    </>
  );
};
