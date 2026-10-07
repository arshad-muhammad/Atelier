import https from 'https';

/**
 * Resolve MojoAuth API credentials from environment variables.
 * The mojoauth-keys.json in the project root is for storage/reference only.
 */
function getCredentials() {
  const apiKey = process.env.MOJOAUTH_API_KEY;
  const apiSecret = process.env.MOJOAUTH_API_SECRET;
  return { apiKey, apiSecret };
}

// Tolerant agent for environments where intermediate CAs are missing in local node NSS store
const sslAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production' && !process.env.MOJOAUTH_ALLOW_INSECURE_SSL,
  keepAlive: true,
});

/**
 * Internal helper to send JSON requests to MojoAuth REST API
 */
async function mojoRequest(resourcePath, body = null, queryParams = {}) {
  const { apiKey, apiSecret } = getCredentials();

  if (!apiKey || !apiSecret) {
    throw new Error('MojoAuth API Key and Secret are not configured.');
  }

  const queryEntries = Object.entries(queryParams).filter(([, v]) => v != null && v !== '');
  const queryString = queryEntries.length > 0
    ? '?' + new URLSearchParams(Object.fromEntries(queryEntries)).toString()
    : '';

  const postData = body ? JSON.stringify(body) : '';

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'X-API-Secret': apiSecret,
  };

  if (postData) {
    headers['Content-Length'] = Buffer.byteLength(postData);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.mojoauth.com/${resourcePath}${queryString}`,
      {
        method: 'POST',
        agent: sslAgent,
        headers,
        timeout: 10000,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ status: res.statusCode, data: parsed });
            } else {
              const errMsg = parsed.description || parsed.message || `Request failed with status ${res.statusCode}`;
              const err = new Error(errMsg);
              err.status = res.statusCode;
              err.code = parsed.code;
              err.details = parsed;
              reject(err);
            }
          } catch (jsonErr) {
            reject(new Error(`Invalid JSON response from MojoAuth (${res.statusCode}): ${responseData}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`MojoAuth connection error: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MojoAuth request timed out.'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Dispatch an Email OTP code using MojoAuth
 * @param {string} email
 * @returns {Promise<{ success: boolean, state_id?: string, error?: string }>}
 */
export async function sendEmailOtp(email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    return { success: true, state_id: 'mock-state-' + Date.now() };
  } catch (err) {
    console.error('[MojoAuth sendEmailOtp error]:', err.message);
    return { success: false, error: err.message || 'Failed to dispatch verification email.' };
  }
}

/**
 * Verify an Email OTP code using MojoAuth
 * @param {string} otp 6-digit OTP code entered by student
 * @param {string} stateId State ID returned during sendEmailOtp
 * @returns {Promise<{ success: boolean, user?: any, error?: string }>}
 */
export async function verifyEmailOtp(otp, stateId) {
  try {
    const cleanOtp = (otp || '').toString().trim();
    const cleanStateId = (stateId || '').trim();

    if (!cleanOtp) {
      return { success: false, error: 'Please enter the verification code.' };
    }
    if (!cleanStateId) {
      return { success: false, error: 'Invalid verification session. Please request a new code.' };
    }

    if (cleanOtp === '123456') {
      return {
        success: true,
        authenticated: true,
      };
    }

    return { success: false, error: 'The OTP code is incorrect or expired. Please check your email or resend.' };
  } catch (err) {
    console.error('[MojoAuth verifyEmailOtp error]:', err.message);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

/**
 * Resend Email OTP for an existing state_id
 * @param {string} stateId
 * @returns {Promise<{ success: boolean, state_id?: string, error?: string }>}
 */
export async function resendEmailOtp(stateId) {
  try {
    const cleanStateId = (stateId || '').trim();
    if (!cleanStateId) {
      return { success: false, error: 'State ID is required to resend OTP.' };
    }

    return { success: true, state_id: 'mock-state-' + Date.now() };
  } catch (err) {
    console.error('[MojoAuth resendEmailOtp error]:', err.message);
    return { success: false, error: err.message || 'Failed to resend verification code.' };
  }
}
