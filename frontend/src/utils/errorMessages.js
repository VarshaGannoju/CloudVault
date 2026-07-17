/**
 * Maps a raw Axios/backend error into a short, user-friendly message
 * suitable for a toast notification.
 *
 * This does NOT change any backend behavior — it only interprets the
 * HTTP status code + message that the existing API already returns.
 *
 * Note: CloudVault's /auth/login endpoint intentionally returns the same
 * generic "Invalid credentials" message (401) whether the email doesn't
 * exist or the password is wrong. That's a deliberate security practice
 * (it prevents attackers from figuring out which emails are registered),
 * so we surface a single combined message for that case rather than
 * guessing which one it was.
 */
export function getLoginErrorMessage(error) {
  // No response at all -> network / server unreachable
  if (!error?.response) {
    return '⚠ Unable to connect to the server.';
  }

  const { status, data } = error.response;
  const rawMessage = data?.message || '';
  const lowerMessage = rawMessage.toLowerCase();

  switch (status) {
    case 400:
      // express-validator failures are bundled into one "Validation failed: ..." string
      if (lowerMessage.includes('email')) {
        return '⚠ Please enter a valid email address.';
      }
      if (lowerMessage.includes('password')) {
        return '⚠ Please enter a valid password.';
      }
      return '⚠ Please check your input and try again.';

    case 401:
      return '❌ Incorrect email or password. Please try again.';

    case 403:
      // Reserved for a future "inactive account" check on the backend.
      if (lowerMessage.includes('inactive') || lowerMessage.includes('disabled') || lowerMessage.includes('suspended')) {
        return '⚠ Your account is inactive.';
      }
      return '⚠ You do not have permission to do that.';

    case 404:
      return '❌ No account found with this email.';

    case 429:
      return '⚠ Too many attempts. Please try again in a few minutes.';

    case 500:
    case 502:
    case 503:
      return '⚠ Unable to connect to the server.';

    default:
      return '⚠ Something went wrong. Please try again later.';
  }
}
