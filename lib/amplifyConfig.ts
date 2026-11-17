/**
 * Amplify Auth settings for the Exacta Alerts login form.
 * The pool and client IDs aren't secrets: they're meant to be in browser code.
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
      userPoolClientId: process.env.COGNITO_CLIENT_ID ?? '',
      loginWith: { email: true },
      signUpVerificationMethod: 'code' as const,
      userAttributes: { email: { required: true } },
      mfa: { status: 'on' as const, totpEnabled: true, smsEnabled: false },
    },
  },
}