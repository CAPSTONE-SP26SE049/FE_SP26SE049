import apiClient from './apiClient'

/**
 * Register a new user account.
 * @param {Object} userData - User registration details (email, password, fullName, phone, region)
 * @returns {Promise<Object>} API Response
 */
export const registerAPI = async (userData) => {
    return apiClient.post('/auth/register', userData)
}

/**
 * Verify a user's email using the provided OTP.
 * @param {string} email - The user's email address
 * @param {string} code - The 6-digit verification code
 * @returns {Promise<Object>} API Response
 */
export const verifyEmailAPI = async (email, code) => {
    return apiClient.post('/auth/verify-email', { email, code })
}

/**
 * Resend the email verification OTP.
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} API Response
 */
export const resendVerificationAPI = async (email) => {
    return apiClient.post('/auth/resend-verification', { email })
}

/**
 * Authenticate a user and receive access/refresh tokens.
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<Object>} API Response containing tokens and user data
 */
export const loginAPI = async (email, password) => {
    return apiClient.post('/auth/login', { email, password })
}

/**
 * Request a password reset OTP.
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} API Response
 */
export const forgotPasswordAPI = async (email) => {
    return apiClient.post('/auth/forgot-password', { email })
}

/**
 * Reset the user's password using the OTP.
 * @param {string} email - The user's email address
 * @param {string} resetCode - The 6-digit reset code
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} API Response
 */
export const resetPasswordAPI = async (email, resetCode, newPassword) => {
    return apiClient.post('/auth/reset-password', { email, resetCode, newPassword })
}

/**
 * Refresh the authentication token.
 * @param {string} refreshToken - The current refresh token
 * @returns {Promise<Object>} API Response containing new tokens
 */
export const refreshAPI = async (refreshToken) => {
    return apiClient.post('/auth/refresh', { refreshToken })
}

/**
 * Logout the user by invalidating the refresh token.
 * @param {string} refreshToken - The current refresh token
 * @returns {Promise<Object>} API Response
 */
export const logoutAPI = async (refreshToken) => {
    return apiClient.post('/auth/logout', { refreshToken })
}

/**
 * Social Login - Login with Google or Facebook OAuth2
 * @param {string} provider - 'GOOGLE' or 'FACEBOOK'
 * @param {string} token - ID Token (Google) or Access Token (Facebook)
 * @returns {Promise<Object>} API Response containing tokens and user data
 */
export const socialLoginAPI = async (provider, token) => {
    return apiClient.post('/auth/social-login', { provider, token })
}

/**
 * Get current user's profile information.
 * Required Authentication Header: Bearer token (Handled by apiClient interceptor)
 * @returns {Promise<Object>} API Response containing user profile
 */
export const getMeAPI = async () => {
    return apiClient.get('/users/me')
}
