import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, http } from "viem"; // Asegúrate de que Chain, createClient, fallback, http estén importados
import { hardhat } from "viem/chains"; // Asegúrate de importar hardhat
import { createConfig } from "wagmi"; // Asegúrate de importar createConfig

// Define tu cadena personalizada para Camp Network Testnet (basecamp)
// Datos de la testnet proporcionados anteriormente:
// Network Name: basecamp
// RPC Endpoint: https://rpc-campnetwork.xyz
// Chain ID: 123420001114
// Currency Symbol: CAMP
// Block Explorer URL: https://basecamp.cloud.blockscout.com/
const campNetworkTestnet = {
  id: 123420001114, // Chain ID real de Camp Network Testnet
  name: "Camp Network Testnet", // Nombre descriptivo para mostrar en la UI (¡importante!)
  nativeCurrency: { name: "CAMP", symbol: "CAMP", decimals: 18 }, // Información de la moneda nativa
  rpcUrls: {
    default: { http: ["https://rpc-campnetwork.xyz"] }, // URL RPC real
    public: { http: ["https://rpc-campnetwork.xyz"] }, // A menudo es bueno añadir también public
  },
  blockExplorers: {
    default: {
      name: "Camp Network Testnet",
      url: "https://basecamp.cloud.blockscout.com/",
    }, // URL del explorador real
  },
  // Opcional: Añade una faucet si existe
  // faucets: ["URL_DE_LA_FAUCET_DE_CAMP_NETWORK"],
} as const satisfies Chain; // Usamos 'as const satisfies Chain' para tipado correcto y validación

// Define la lista de cadenas soportadas para tu MVP
// Incluimos Hardhat (para desarrollo local) y Camp Network Testnet
export const enabledChains = [
  hardhat, // Hardhat local (Chain ID 31337)
  campNetworkTestnet, // Tu cadena de Camp Network Testnet
] as const; // Usamos 'as const' para tipado inmutable

// Configura wagmi con las cadenas y el transport
export const wagmiConfig = createConfig({
  chains: enabledChains, // Usa la lista de cadenas que definiste
  connectors: wagmiConnectors, // Usa los conectores definidos en wagmiConnectors.ts
  ssr: true, // Habilitar Server-Side Rendering si tu app lo usa
   client({ chain }) {
     // Configuración del cliente viem para cada cadena
     return createClient({
       chain,
       transport: http(), // Usar transporte HTTP por defecto, wagmi/viem manejará los rpcUrls definidos en la cadena
       ...(chain.id !== hardhat.id // Si no es Hardhat local
         ? {
             // Puedes añadir configuraciones específicas para testnets/mainnets aquí
             // pollingInterval: scaffoldConfig.pollingInterval, // Si usas scaffoldConfig para esto
           }
         : {}),
     });
   },
});
