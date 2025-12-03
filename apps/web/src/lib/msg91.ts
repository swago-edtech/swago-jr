// apps/web/src/lib/msg91.ts

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';

if (!MSG91_AUTH_KEY) {
  console.warn('⚠️ MSG91_AUTH_KEY not found in environment variables');
}

/**
 * Format phone for MSG91 (remove + prefix, keep country code)
 * Input: "+919876543210" → Output: "919876543210"
 */
export function formatPhoneForMSG91(phone: string): string {
  return phone.replace(/^\+/, '');
}

/**
 * Format phone for storage (ensure + prefix)
 * Input: "919876543210" or "+919876543210" → Output: "+919876543210"
 */
export function formatPhoneForStorage(phone: string): string {
  return phone.startsWith('+') ? phone : `+${phone}`;
}

/**
 * Send OTP via MSG91
 * Uses MSG91's default template (no template_id needed)
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  try {
    const formattedPhone = formatPhoneForMSG91(phone);
    
    const response = await fetch(`${MSG91_BASE_URL}/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        mobile: formattedPhone,
      }),
    });

    const data = await response.json();
    
    // 🔥 ADD THIS - More detailed logging
    console.log('📱 MSG91 Response Status:', response.status);
    console.log('📱 MSG91 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.type === 'success') {
      console.log('✅ OTP sent via MSG91 to:', phone);
      return { success: true };
    } else {
      console.error('❌ MSG91 send OTP failed:', data);
      return { success: false, error: data.message || 'Failed to send OTP' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MSG91 API error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}


/**
 * Verify OTP via MSG91
 */
export async function verifyOTP(
  phone: string, 
  otp: string
): Promise<{ success: boolean; error?: string }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  try {
    const formattedPhone = formatPhoneForMSG91(phone);
    
    const url = new URL(`${MSG91_BASE_URL}/otp/verify`);
    url.searchParams.append('mobile', formattedPhone);
    url.searchParams.append('otp', otp);
    url.searchParams.append('authkey', MSG91_AUTH_KEY);

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok && data.type === 'success') {
      console.log('✅ OTP verified via MSG91 for:', phone);
      return { success: true };
    } else {
      console.error('❌ MSG91 verify OTP failed:', data);
      return { success: false, error: data.message || 'Invalid OTP' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MSG91 verify API error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
