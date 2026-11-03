# Resending the verification email

When someone signs in with an unverified email, Auth0 denies the login and sends the browser back with `access_denied`. The app never learns who they were, so it cannot ask Auth0 to resend. Instead the Auth0 post-login Action sends a fresh email each time a blocked person tries again (at most one every five minutes). The "Send me a new verification email" button in `Login.tsx` just starts a new sign-in.

## Auth0 setup (once)

1. Applications, create a Machine to Machine application. Authorize it for the Auth0 Management API with the `update:users` scope (this covers sending the verification job and writing app metadata).
2. Actions, Library, open the post-login Action that denies unverified users (the one that returns `Please verify your email address before logging in.`), or create one and add it to the Login flow.
3. In the Action's Dependencies add `auth0` (a 4.x version).
4. In its Secrets add `DOMAIN` (the tenant domain, for example `your-tenant.us.auth0.com`), `CLIENT_ID` and `CLIENT_SECRET` of the machine-to-machine app. Never put these in the repo or in chat.
5. Replace the code with the one below, deploy, and add it to the Login flow if it is not there already.

```js
const { ManagementClient } = require('auth0');

const COOLDOWN_MS = 5 * 60 * 1000;
const REASON = 'Please verify your email address before logging in.';

exports.onExecutePostLogin = async (event, api) => {
  if (event.user.email_verified) return;

  const lastSent = Number(event.user.app_metadata?.verification_email_sent_at || 0);
  if (Date.now() - lastSent > COOLDOWN_MS) {
    try {
      const management = new ManagementClient({
        domain: event.secrets.DOMAIN,
        clientId: event.secrets.CLIENT_ID,
        clientSecret: event.secrets.CLIENT_SECRET,
      });
      await management.jobs.verifyEmail({ user_id: event.user.user_id });
      await management.users.update(
        { id: event.user.user_id },
        { app_metadata: { verification_email_sent_at: Date.now() } },
      );
    } catch (error) {
      console.log('Could not resend verification email', error.message);
    }
  }

  api.access.deny(REASON);
};
```

The metadata is written with the Management API rather than `api.user.setAppMetadata`, because changes made through `api` may be discarded when the Action denies access.

## Checking it

Sign in with an unverified test account twice within five minutes: one email arrives. Wait five minutes and try again: a second one arrives. The denial message must stay exactly the text above, since `Login.tsx` matches on "verify your email".
