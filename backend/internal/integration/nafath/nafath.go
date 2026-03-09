// Package nafath provides a client for the Elm Nafath National Authentication
// System (https://nafath.api.elm.sa). It supports both the real async MFA API
// (V2.0.2) and a deterministic mock mode for testing and development.
//
// Real Nafath flow (async):
//  1. StartVerification → display random number to user
//  2. User confirms in Nafath mobile app (60s for Login, 180s for other services)
//  3. CheckStatus (poll) or receive callback JWT with Person data
//
// Mock mode (synchronous):
//   - VerifyIdentity returns deterministic data based on the national ID
//   - UseMock=true (or no config) enables mock mode for all methods
package nafath
