import { createPublicClient, http, Hex, privateKeyToAccount } from "viem";
import { sepolia } from "viem/chains";
import { createPimlicoClient, createSmartAccountClient, toSafeSmartAccount, entryPoint07Address } from "permissionless";

const apiKey = process.env.PIMLICO_API_KEY!;
if (!apiKey) throw new Error("Missing PIMLICO_API_KEY");

const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://rpc.ankr.com/eth_sepolia")
});

export async function deriveSafeForPrivateKey(privkey: Hex) {
  const account = await toSafeSmartAccount({
    client: publicClient,
    owners: [privateKeyToAccount(privkey)],
    entryPoint: { address: entryPoint07Address, version: "0.7" },
    version: "1.4.1"
  });
  return account;
}

export function makeSmartAccountClient(account: Awaited<ReturnType<typeof deriveSafeForPrivateKey>>) {
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: { address: entryPoint07Address, version: "0.7" }
  });

  return createSmartAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast
    }
  });
}
