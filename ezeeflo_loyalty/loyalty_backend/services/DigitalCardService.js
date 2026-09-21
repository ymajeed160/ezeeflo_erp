const { LoyaltyAccount, Customer, MembershipTier, Company } = require('../models');
const { NotFoundError } = require('../utils/appError');
const crypto = require('crypto');

/**
 * Digital Membership Card Generator
 * Produces card data with QR codes, barcodes, and Apple/Google Wallet ready formats
 */
class DigitalCardService {
  /**
   * Generate a full digital membership card for a customer
   */
  async generateCard(customerId, companyId) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth'] },
        { model: MembershipTier, as: 'membership', attributes: ['id', 'name', 'code', 'color', 'icon', 'pointMultiplier'] },
      ],
    });

    if (!account) throw new NotFoundError('No loyalty account found for this customer');

    const company = await Company.findByPk(companyId, {
      attributes: ['id', 'name', 'code', 'logo', 'email', 'phone', 'website'],
    });

    const memberId = account.accountNumber;
    const qrData = JSON.stringify({
      type: 'membership',
      memberId,
      customerId,
      companyId,
      tier: account.membership?.code || 'standard',
      issuedAt: new Date().toISOString(),
    });

    // Generate a unique card token for validation
    const cardToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${memberId}-${customerId}-${companyId}`)
      .digest('hex').slice(0, 16);

    return {
      cardId: cardToken,
      memberId,
      memberSince: account.enrolledDate,
      tier: account.membership ? {
        name: account.membership.name,
        code: account.membership.code,
        color: account.membership.color,
        icon: account.membership.icon,
        pointMultiplier: parseFloat(account.membership.pointMultiplier),
      } : { name: 'Standard', code: 'standard', color: '#6B7280' },

      customer: {
        name: `${account.customer?.firstName || ''} ${account.customer?.lastName || ''}`.trim(),
        code: account.customer?.code,
        email: account.customer?.email,
        phone: account.customer?.phone,
      },

      company: company ? {
        name: company.name,
        code: company.code,
        logo: company.logo,
        website: company.website,
      } : null,

      // QR Code data (to be rendered as QR on frontend)
      qrData,
      qrType: 'membership_v1',

      // Barcode format (Code 128)
      barcodeData: memberId,
      barcodeType: 'CODE128',

      // Points summary
      points: {
        available: account.availablePoints,
        pending: account.pendingPoints,
        lifetime: account.lifetimeEarned,
        expiringIn30Days: 0,
      },

      // Apple Wallet pass structure
      appleWalletReady: true,
      appleWalletPass: {
        formatVersion: 1,
        passTypeIdentifier: `pass.com.${(company?.code || 'ezeeflo').toLowerCase()}.loyalty`,
        serialNumber: memberId,
        teamIdentifier: 'EZEELOYALTY',
        organizationName: company?.name || 'EzeeFlo Loyalty',
        description: `${account.membership?.name || 'Standard'} Membership`,
        logoText: company?.name || 'EzeeFlo',
        foregroundColor: account.membership?.color || '#4F46E5',
        backgroundColor: '#FFFFFF',
        barcode: {
          message: memberId,
          format: 'PKBarcodeFormatCode128',
          messageEncoding: 'iso-8859-1',
        },
        locations: [],
      },

      // Google Wallet pass structure
      googleWalletReady: true,
      googleWalletPass: {
        iss: `https://api.${(company?.code || 'ezeeflo').toLowerCase()}.com`,
        sub: memberId,
        typ: 'savetowallet',
        origins: [],
        payload: {
          genericClasses: [{
            id: `class-${companyId}`,
            issuerName: company?.name || 'EzeeFlo Loyalty',
            programLogo: { sourceUri: { uri: company?.logo || '' } },
          }],
          genericObjects: [{
            id: memberId,
            classId: `class-${companyId}`,
            cardTitle: account.membership?.name || 'Member',
            heroImage: { sourceUri: { uri: company?.logo || '' } },
            textModulesData: [
              { id: 'points', header: 'Available Points', body: `${account.availablePoints}` },
              { id: 'member', header: 'Member Since', body: account.enrolledDate || '-' },
            ],
            barcode: { type: 'QR_CODE', value: qrData },
          }],
        },
      },

      generatedAt: new Date().toISOString(),
      expiresAt: null, // No expiry for membership card
    };
  }

  /**
   * Batch generate cards for all active members
   */
  async batchGenerateCards(companyId, { limit = 100 } = {}) {
    const accounts = await LoyaltyAccount.findAll({
      where: { companyId, isActive: true },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName'] },
        { model: MembershipTier, as: 'membership', attributes: ['id', 'name', 'code', 'color'] },
      ],
      limit,
      order: [['availablePoints', 'DESC']],
    });

    return accounts.map(account => ({
      memberId: account.accountNumber,
      customerName: `${account.customer?.firstName || ''} ${account.customer?.lastName || ''}`.trim(),
      tier: account.membership?.name || 'Standard',
      points: account.availablePoints,
      enrolledDate: account.enrolledDate,
    }));
  }
}

module.exports = new DigitalCardService();
