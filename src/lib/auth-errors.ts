import type { AuthError } from '@supabase/supabase-js';

export type SignupErrorKey =
  | 'failed'
  | 'emailTaken'
  | 'redirectNotAllowed'
  | 'weakPassword'
  | 'rateLimit'
  | 'emailDisabled';

export function getSignupErrorKey(error: AuthError): SignupErrorKey {
  const msg = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? '';

  if (
    msg.includes('already registered') ||
    msg.includes('already been registered') ||
    code === 'user_already_exists'
  ) {
    return 'emailTaken';
  }

  if (
    msg.includes('redirect') ||
    msg.includes('redirect_to') ||
    code === 'redirect_uri_mismatch'
  ) {
    return 'redirectNotAllowed';
  }

  if (msg.includes('password')) {
    return 'weakPassword';
  }

  if (msg.includes('rate limit') || code === 'over_email_send_rate_limit') {
    return 'rateLimit';
  }

  if (
    msg.includes('signups not allowed') ||
    msg.includes('email signups are disabled')
  ) {
    return 'emailDisabled';
  }

  return 'failed';
}
