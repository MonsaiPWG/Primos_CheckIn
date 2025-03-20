import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the service role key for full database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get('wallet_address');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Query all NFTs registered for this wallet address
    const { data: nfts, error: nftsError } = await supabaseAdmin
      .from('nfts')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase());
      
    if (nftsError) {
      return NextResponse.json(
        { error: nftsError.message },
        { status: 500 }
      );
    }
    
    // Calculate total bonus points
    const totalBonusPoints = nfts?.reduce((sum, nft) => sum + (nft.bonus_points || 0), 0) || 0;
    
    return NextResponse.json({
      count: nfts?.length || 0,
      nfts: nfts || [],
      totalBonusPoints,
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
