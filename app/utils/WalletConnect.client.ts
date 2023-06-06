import albedo from "@albedo-link/intent";
import {
  getPublicKey as freighterPublicKey,
  signTransaction as signTx,
} from "@stellar/freighter-api";
import { SignClient } from "@walletconnect/sign-client";

type Client = "albedo" | "rabet" | "freighter" | "wallet_connect";
type Network = "TESTNET";

// Wallet Connect
// Every ACTION means print a QR

enum WalletConnectChains {
  PUBLIC = "stellar:pubnet",
  TESTNET = "stellar:testnet",
}

enum WalletConnectMethods {
  SIGN = "stellar_signXDR",
  SIGN_AND_SUBMIT = "stellar_signAndSubmitXDR",
}

class WalletConnect {
  name: Client;
  network: Network;
  client: any;
  approval: any;
  uri: any;

  constructor(name: Client, network: Network) {
    this.name = name;
    this.network = network;
    this.client = null;
    this.approval = null;
    this.uri = null;
  }

  async getPublicKey() {
    const account = await this.getApproval();
    const allNamespaceAccounts = Object.values(account.namespaces)
      .map((namespace: any) => namespace.accounts)
      .flat();

    const publicKey = allNamespaceAccounts[0].replace("stellar:testnet:", "");

    return publicKey
  }

  private async getApproval() {
    return await this.approval();
  }

  async initWalletConnect() {
    try {
      this.client = await SignClient.init({
        projectId: "de5dffb20a999465a31bef12a0defd9b",
        metadata: {
          name: "CommuuniDAO",
          url: "my-auth-dapp.com",
          description: "CommuniDAO is the Stellar Dao Discord Bot",
          icons: [
            "https://cdn.discordapp.com/attachments/1094354605401460896/1094354605887996104/StellarDiscordDaoBot.png",
          ],
        },
      });

      const { uri, approval } = await this.createConnection();

      this.uri = uri;
      this.approval = approval;

      return { uri, approval };
    } catch (error) {
      console.error("Error in WalletConnect init: ", error);
    }
  }
  private async createConnection() {
    const chain =
      this.network === "TESTNET"
        ? WalletConnectChains.TESTNET
        : WalletConnectChains.PUBLIC;

    const { uri, approval } = await this.client.connect({
      requiredNamespaces: {
        stellar: {
          methods: [WalletConnectMethods.SIGN],
          chains: [chain],
          events: [],
        },
      },
    });
    return { uri, approval };
  }
}

export { WalletConnect };
