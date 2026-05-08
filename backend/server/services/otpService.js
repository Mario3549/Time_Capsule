const crypto = require('crypto');
const databaseService = require('./directDatabaseService');

class OTPService {
  constructor() {
    // No longer using in-memory storage
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with expiry (2 minutes)
  async storeOTP(email, otp) {
    try {
      const otpRecord = await databaseService.createOTP(email, otp);
      return { success: true, otp, message: 'OTP stored successfully' };
    } catch (error) {
      console.error('Error storing OTP:', error);
      return { success: false, message: 'Failed to store OTP' };
    }
  }

  // Verify OTP
  async verifyOTP(email, inputOTP) {
    try {
      // Check attempts first
      const attemptInfo = await databaseService.getOTPAttempts(email);
      if (attemptInfo && attemptInfo.attempts >= attemptInfo.maxAttempts) {
        return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
      }

      // Verify OTP
      const otpRecord = await databaseService.verifyOTP(email, inputOTP);
      
      if (!otpRecord) {
        // Increment attempts
        await databaseService.incrementOTPAttempts(email);
        return { success: false, message: 'Invalid or expired OTP' };
      }

      // Mark OTP as used
      await databaseService.markOTPAsUsed(otpRecord.id);
      
      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  // Resend OTP
  async resendOTP(email) {
    try {
      // Generate new OTP
      const newOTP = this.generateOTP();
      const result = await this.storeOTP(email, newOTP);
      
      if (result.success) {
        return { success: true, otp: newOTP, message: 'New OTP generated' };
      } else {
        return { success: false, message: 'Failed to generate new OTP' };
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      return { success: false, message: 'Failed to resend OTP' };
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    try {
      const deletedCount = await databaseService.cleanupExpiredOTPs();
      console.log(`🧹 Cleaned up ${deletedCount} expired OTPs`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
      return 0;
    }
  }

  // Get OTP info (for debugging)
  async getOTPInfo(email) {
    try {
      const attemptInfo = await databaseService.getOTPAttempts(email);
      if (!attemptInfo) return null;
      
      return {
        email,
        attempts: attemptInfo.attempts,
        maxAttempts: attemptInfo.maxAttempts,
        expiresIn: 120 // 2 minutes in seconds
      };
    } catch (error) {
      console.error('Error getting OTP info:', error);
      return null;
    }
  }
}

module.exports = new OTPService();
