import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  try {
    // Get the wallet address from the URL parameters
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get('wallet_address');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Query the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();
      
    // If we have data, add UTC check-in status
    if (data && data.last_check_in) {
      const lastCheckInUTC = new Date(data.last_check_in);
      const nowUTC = new Date();
      
      // Check if user has already checked in today (UTC)
      data.checked_in_today_utc = (
        lastCheckInUTC.getUTCDate() === nowUTC.getUTCDate() && 
        lastCheckInUTC.getUTCMonth() === nowUTC.getUTCMonth() && 
        lastCheckInUTC.getUTCFullYear() === nowUTC.getUTCFullYear()
      );
      
      // Calculate hours remaining until 24 hours have passed
      const timeDiff = Math.abs(nowUTC.getTime() - lastCheckInUTC.getTime());
      const hoursDiff = timeDiff / (1000 * 3600);
      data.hours_since_last_checkin = hoursDiff;
      
      if (hoursDiff < 24) {
        data.can_checkin = false;
        data.hours_remaining = Math.ceil(24 - hoursDiff);
      } else {
        data.can_checkin = !data.checked_in_today_utc;
      }
    }
      
    if (error) {
      // If user not found, return empty data instead of error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: null });
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Database error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
