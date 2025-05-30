'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useConnectorStore } from '@/hooks/useConnectorStore';
import ContractInteraction from '@/components/ContractInteraction';
import RoninWallet from '@/components/wallet-connectors/ronin-wallet/RoninWallet';
import Navigation from '@/components/Navigation';
import NFTDisplay from '@/components/NFTDisplay/NFTDisplay';
import RewardsPanel from '@/components/RewardsPanel/RewardsPanel';
import LeaderboardDisplay from '@/components/LeaderboardDisplay/LiderboardDisplay';
import HowRewardsWorks from '@/components/NFTDisplay/HowRewardsWorks';
import { RONIN_CHAIN_IDS } from '@/utils/contract';

export default function Home() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [networkName, setNetworkName] = useState<string>('Not Connected');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const { account, connector, isConnected } = useConnectorStore();
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [userDataRefresh, setUserDataRefresh] = useState<number>(0);
  const [nftCalculationInProgress, setNftCalculationInProgress] = useState<boolean>(false);

  // Effect para verificar si ya hay una conexión activa en el store
  useEffect(() => {
    // Si hay una conexión activa y una cuenta en el store, pero no tenemos provider local
    if (isConnected && account && !provider && connector) {
      const initializeProvider = async () => {
        try {
          console.log('Mining Page: Restaurando provider desde el store');
          const providerInstance = await connector.getProvider();
          
          if (providerInstance) {
            const ethersProvider = new ethers.providers.Web3Provider(providerInstance as any);
            
            // Configurar el estado local con el provider restaurado
            setProvider(ethersProvider);
            
            // Obtener info de la red
            const network = await ethersProvider.getNetwork();
            setNetworkName(getNetworkName(network.chainId));
            
            // Establecer la dirección de usuario desde el account del store
            setUserAddress(account);
          }
        } catch (err) {
          console.error('Error al restaurar provider en Mining Page:', err);
        }
      };
      
      initializeProvider();
    }
  }, [isConnected, account, provider, connector]);

  // Función para obtener el nombre de la red
  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case RONIN_CHAIN_IDS.MAINNET:
        return 'Ronin Mainnet';
      case RONIN_CHAIN_IDS.TESTNET:
        return 'Ronin Saigon Testnet';
      default:
        return `Unknown Network (${chainId})`;
    }
  };

  // Memoizamos las funciones para evitar recreaciones innecesarias
  // Función para conectar wallet
  const handleConnect = useCallback(async (newProvider: ethers.providers.Web3Provider) => {
    setProvider(newProvider);
    
    // Obtener info de la red
    try {
      const network = await newProvider.getNetwork();
      setNetworkName(getNetworkName(network.chainId));
      
      // Obtener dirección del usuario
      const accounts = await newProvider.listAccounts();
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
      }
    } catch (err) {
      console.error("Error getting network info:", err);
      setNetworkName('Unknown Network');
    }
  }, []);

  // Función para desconectar wallet
  const handleDisconnect = useCallback(() => {
    setProvider(null);
    setNetworkName('Not Connected');
    setUserAddress(null);
    setTotalPoints(0);
  }, []);

  // Memoizamos la función para actualizar datos
  const handleDataRefresh = useCallback(() => {
    setUserDataRefresh(prev => prev + 1);
  }, []);

  // Cargar datos del usuario usando la API en lugar de acceso directo a Supabase
  useEffect(() => {
    let isMounted = true;
    
    if (!userAddress) return;
    
    const loadUserData = async () => {
      try {
        const response = await fetch(`/api/user-data?wallet_address=${userAddress.toLowerCase()}`);
        if (!isMounted) return;
        
        const result = await response.json();
        
        if (result.error) {
          console.error('Error loading user data:', result.error);
          return;
        }
        
        if (result.data && isMounted) {
          setTotalPoints(result.data.total_points || 0);
        } else if (isMounted) {
          setTotalPoints(0);
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error in user data fetch:', err);
        if (err instanceof Error) {
          console.error('Error details:', err.message);
        } else {
          console.error('Unexpected error format:', JSON.stringify(err));
        }
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [userAddress, userDataRefresh]);

  return (
    <div className="min-h-screen relative" style={{
      backgroundImage: "url('/images/fondomina_primos.jpeg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed"
    }}>
      {/* Capa de blur por encima del fondo */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          zIndex: 0
        }}
      />
      
      {/* Contenido principal (encima de la capa de blur) */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <header className="bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            {/* Top section with title and hamburger menu */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src="/images/primos_logo.png" 
                  alt="Primos Logo" 
                  style={{ width: '40px', height: 'auto' }}
                  className="mr-3"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase">
                    Primos Daily Check-in
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Earn rewards with daily check-ins
                  </p>
                </div>
              </div>
              
              {/* Navigation visible on desktop, hamburger on mobile */}
              <div className="flex items-center">
                <div className="hidden md:block mr-4">
                  <Navigation />
                </div>
                <div className="md:hidden">
                  <Navigation />
                </div>
                <div className="hidden md:block">
                  <RoninWallet onConnect={handleConnect} onDisconnect={handleDisconnect} />
                </div>
              </div>
            </div>
            
            {/* Bottom section for wallet buttons on mobile */}
            <div className="md:hidden mt-4 w-full">
              <RoninWallet onConnect={handleConnect} onDisconnect={handleDisconnect} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {provider ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <ContractInteraction 
                    provider={provider} 
                    userAddress={userAddress}
                    onCheckInSuccess={handleDataRefresh}
                    nftCalculationInProgress={nftCalculationInProgress}
                    refreshTrigger={userDataRefresh} // Add refreshTrigger prop
                  />
                  
                  <NFTDisplay 
                    provider={provider} 
                    userAddress={userAddress}
                    refreshTrigger={userDataRefresh}
                    onLoadingStateChange={setNftCalculationInProgress}
                  />
                </div>
                
                <div>
                  <RewardsPanel 
                    userAddress={userAddress} 
                    totalPoints={totalPoints}
                    onRewardClaimed={handleDataRefresh} 
                    provider={provider}
                  />
                </div>
                
                {/* Nuevo componente de leaderboard */}
                <div className="md:col-span-3 mt-6">
                  <LeaderboardDisplay />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Logo de Primos */}
                <div className="w-64 mx-auto">
                  <img 
                    src="/images/logo_primos_inicio.png" 
                    alt="Primos Logo" 
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Mensaje de bienvenida (en inglés como solicitado) */}
                <h2 className="text-2xl font-bold text-white text-center">
                  Connect your Ronin Wallet and start earning rewards
                </h2>
                
                {/* Video con preview */}
                <div className="w-full max-w-3xl mx-auto">
                  <video 
                    src="/videos/primos_o.webm" 
                    autoPlay
                    loop
                    controls
                    muted
                    playsInline
                    className="w-full rounded-lg"
                    poster="/images/frame_primo.png"
                  />
                </div>
                
                {/* Componente How Rewards Works con texto en blanco */}
                <div className="w-full max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-md p-6 text-white">
                  <HowRewardsWorks />
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-gray-800 shadow mt-12">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center">
              <img 
                src="/images/logo_pimos_footer.png" 
                alt="Primos Logo" 
                style={{ width: '80px', height: 'auto' }}
                className="mb-2"
              />
              <p className="text-center text-sm text-gray-400">
                PRIMOS Daily Check-in App - {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
