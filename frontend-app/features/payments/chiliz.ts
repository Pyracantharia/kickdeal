import { BrowserProvider, parseEther } from 'ethers'

export type ChilizPlanType = 'PRO' | 'ENTERPRISE'

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

const CHILIZ_EXPLORER_URL = 'https://testnet.chiliscan.com/'
const DEFAULT_CHAIN_ID = 88882
const DEFAULT_RPC_URL = 'https://spicy-rpc.chiliz.com/'
const DEFAULT_CHZ_EUR_RATE = 200

export const CHILIZ_AMOUNTS: Record<ChilizPlanType, string> = {
  PRO: '1',
  ENTERPRISE: '2',
}

export function getChilizPaymentConfig() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHILIZ_CHAIN_ID ?? DEFAULT_CHAIN_ID)

  return {
    chainId,
    chainIdHex: `0x${chainId.toString(16)}`,
    rpcUrl: process.env.NEXT_PUBLIC_CHILIZ_RPC_URL ?? DEFAULT_RPC_URL,
    receiverAddress: process.env.NEXT_PUBLIC_CHILIZ_RECEIVER_ADDRESS ?? '',
    chzEurRate: Number(process.env.NEXT_PUBLIC_CHZ_EUR_RATE ?? DEFAULT_CHZ_EUR_RATE),
  }
}

export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export async function payWithChiliz(
  planType: ChilizPlanType,
  onTransactionHash?: (txHash: string) => void,
): Promise<string> {
  if (!hasMetaMask() || !window.ethereum) {
    throw new Error('MetaMask est nécessaire pour payer en CHZ.')
  }

  const config = getChilizPaymentConfig()

  if (!/^0x[a-fA-F0-9]{40}$/.test(config.receiverAddress)) {
    throw new Error('Adresse receveur KickDeal invalide ou manquante.')
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' })
  await ensureChilizNetwork(window.ethereum)

  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const transaction = await signer.sendTransaction({
    to: config.receiverAddress,
    value: parseEther(CHILIZ_AMOUNTS[planType]),
  })

  onTransactionHash?.(transaction.hash)

  const receipt = await transaction.wait(1)

  if (!receipt || receipt.status !== 1) {
    throw new Error('La transaction CHZ a échoué ou n’a pas été confirmée.')
  }

  return transaction.hash
}

async function ensureChilizNetwork(ethereum: EthereumProvider): Promise<void> {
  const config = getChilizPaymentConfig()
  const currentChainId = await ethereum.request({ method: 'eth_chainId' })

  if (currentChainId === config.chainIdHex) {
    return
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: config.chainIdHex }],
    })
  } catch (error) {
    const switchError = error as { code?: number }

    if (switchError.code !== 4902) {
      throw new Error('Veuillez passer sur Chiliz Spicy Testnet dans MetaMask.')
    }

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: config.chainIdHex,
          chainName: 'Chiliz Spicy Testnet',
          nativeCurrency: {
            name: 'Chiliz',
            symbol: 'CHZ',
            decimals: 18,
          },
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [CHILIZ_EXPLORER_URL],
        },
      ],
    })
  }
}