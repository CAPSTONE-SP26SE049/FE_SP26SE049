import apiClient from './apiClient'

/**
 * Update the user's profile information.
 * @param {Object} profileData - User profile details (fullName, phoneNumber, avatarUrl)
 * @returns {Promise<Object>} API Response
 */
export const updateProfileAPI = async (profileData) => {
    return apiClient.put('/users/me', profileData)
}

/**
 * Change the user's password.
 * @param {Object} passwordData - { oldPassword, newPassword }
 * @returns {Promise<Object>} API Response
 */
export const changePasswordAPI = async (passwordData) => {
    return apiClient.put('/users/password', passwordData)
}
