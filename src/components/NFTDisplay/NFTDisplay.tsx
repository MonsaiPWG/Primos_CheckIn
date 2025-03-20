'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { fetchUserNFTs, calculateNFTPoints, PRIMOS_NFT_CONTRACT } from '@/services/nftService';
import { supabase } from '@/utils/supabase';
import HowRewardsWorks from './HowRewardsWorks';

interface NFTDisplayProps {
  provider: ethers.providers.Web3Provider | null;
  userAddress: string | null;
  refreshTrigger?: number; // New prop to trigger updates
}

const NFTDisplay: React.FC<NFTDisplayProps> = ({ provider, userAddress, refreshTrigger }) => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncingNFTs, setSyncingNFTs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  
  useEffect(() => {
    if (!provider || !userAddress) return;
    
    console.log("NFTDisplay useEffect triggered, refreshTrigger:", refreshTrigger);
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load NFTs (this includes synchronization with the blockchain)
        setSyncingNFTs(true);
        const result = await fetchUserNFTs(provider, userAddress);
        const { success, nfts: userNfts } = result;
        const nftsError = 'error' in result ? result.error : null;
        setSyncingNFTs(false);
        
        if (!success) {
          if (nftsError && typeof nftsError === 'object' && 'message' in nftsError) {
            throw new Error(String(nftsError.message));
          } else {
            throw new Error('Failed to fetch NFTs');
          }
        }
        
        // Get NFTs already used today by ANY wallet
        const today = new Date().toISOString().split('T')[0];
        console.log("Checking nft_usage_tracking for date:", today);
        const { data: usedNfts, error: usedError } = await supabase
          .from('nft_usage_tracking')
          .select('token_id, contract_address')
          .eq('usage_date', today);
        // Note: We no longer filter by wallet_address
        
        console.log("Used NFTs found:", usedNfts?.length || 0);
        
        if (usedError) throw usedError;
        
        // Create a set of used NFTs
        const usedNftSet = new Set();
        usedNfts?.forEach(nft => {
          const key = `${nft.token_id}-${nft.contract_address}`;
          usedNftSet.add(key);
          console.log("Adding used NFT to set:", key);
        });
        
        // Mark NFTs as used
        const nftsWithUsageStatus = userNfts ? userNfts.map(nft => {
          const key = `${nft.tokenId}-${PRIMOS_NFT_CONTRACT.toLowerCase()}`;
          const isUsedToday = usedNftSet.has(key);
          console.log(`NFT ID:${nft.tokenId}, Key:${key}, IsUsed:${isUsedToday}`);
          return { ...nft, isUsedToday };
        }) : [];
        
        setNfts(nftsWithUsageStatus);
        
        // Load user information using the API instead of direct Supabase access
        console.log('Fetching user data from API...');
        const userDataResponse = await fetch(`/api/user-data?wallet_address=${userAddress.toLowerCase()}`);
        const userDataResult = await userDataResponse.json();
        
        if (userDataResult.error) {
          throw new Error(userDataResult.error);
        }
        
        const userData = userDataResult.data;
        
        if (userData) {
          setStreak(userData.current_streak || 0);
          setTotalPoints(userData.total_points || 0);
          
          // Calculate multiplier
          let mult = 1.0;
          if (userData.current_streak >= 29) mult = 3.0;
          else if (userData.current_streak >= 22) mult = 2.5;
          else if (userData.current_streak >= 15) mult = 2.0;
          else if (userData.current_streak >= 8) mult = 1.5;
          
          setMultiplier(mult);
        } else {
          console.log('No user data found');
          setStreak(0);
          setTotalPoints(0);
          setMultiplier(1.0);
        }
        
        // Calculate NFT points
        const { totalPoints: nftPoints } = await calculateNFTPoints(userAddress);
        setPoints(nftPoints);
        
      } catch (err: any) {
        console.error('Error loading NFT data:', err);
        if (err instanceof Error) {
          setError(err.message || 'An error occurred while loading NFT data');
        } else {
          // Handle cases where err might be an empty object or something else
          console.error('Unexpected error format:', JSON.stringify(err));
          setError('An unknown error occurred while loading NFT data. Check console for details.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [provider, userAddress, refreshTrigger]);
  
  // Calculate potential daily points
  const dailyPointsPotential = points * multiplier;
  
  if (!provider || !userAddress) {
    return <div className="p-6 bg-gray-100 rounded-lg">Connect your wallet to view NFTs</div>;
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mt-8 text-white">
      
      <h2 className="text-2xl font-bold mb-4 uppercase">Bonus rewards</h2> 
      {loading && <div className="text-center py-4">Loading your bonus rewards...</div>}
      
      {syncingNFTs && (
        <div className="bg-blue-100 text-blue-700 p-4 rounded-md mb-4">
          <p className="font-semibold">Synchronizing NFTs with blockchain...</p>
          <p className="text-sm">This ensures your bonus points are up to date if you've recently transferred NFTs.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
        
      <div className="flex flex-col gap-4 mb-6">
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-gray-700 p-4 rounded-md">
      <div className="flex items-center">
        <img 
          src="/images/bonus_primos.png" 
          alt="Primos Bonus" 
          className="h-12 w-12 mr-3" 
        />
        <div>
          <h3 className="font-bold text-lg text-white">Total Primos Bonus</h3>
          <p className="text-2xl font-bold text-white">+{points}</p>
        </div>
      </div>
    </div>
    <div className="bg-gray-700 p-4 rounded-md">
      <div className="flex items-center">
        <img 
          src="/images/bous_multiplier.png" 
          alt="Multiplier Bonus" 
          className="h-12 w-12 mr-3" 
        />
        <div>
          <h3 className="font-bold text-lg text-white">Streak Multiplier Bonus</h3>
          <p className="text-2xl font-bold text-white">x{multiplier}</p>
        </div>
      </div>
    </div>
  </div>
  
</div>
      
<h3 className="text-xl font-bold mt-6 mb-4 uppercase">Your Primos</h3>
      
      {nfts.length === 0 && !loading ? (
        <div className="text-center py-4 bg-gray-700 rounded-md">
          <p>No Primos found in your wallet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft, index) => (
            <div key={index} className="rounded-lg overflow-hidden bg-gray-700">
              {nft.metadata?.image && (
                <div className="flex items-center justify-center relative">
                  <img 
                    src={nft.metadata.image} 
                    alt={nft.metadata.name || `NFT #${nft.tokenId}`}
                    className={`max-h-full max-w-full object-contain ${nft.isUsedToday ? 'opacity-50' : ''}`}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-nft.png'; // Fallback image
                    }}
                  />
                  {nft.isUsedToday && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                        Used Today
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 text-white">
                <h4 className="font-bold">{nft.metadata?.name || `NFT #${nft.tokenId}`}</h4>
                <p className="text-sm text-gray-300">Rarity: {nft.rarity || 'Unknown'}</p>
                <p className="text-sm text-gray-300">Bonus: +{nft.bonusPoints}</p>
                {nft.isUsedToday ? (
                  <p className="text-xs text-red-400 mt-1">Available tomorrow</p>
                ) : (
                  <p className="text-xs text-green-400 mt-1">Available now</p>
                )}
                {nft.isFullSet && (
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-700 text-white text-xs font-semibold rounded">
                    Full Set
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <HowRewardsWorks />
    </div>
  );
};

export default NFTDisplay;
