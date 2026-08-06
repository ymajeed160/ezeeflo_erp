const { Coupon, CouponUsage, Customer, Company } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');

class CouponService {
  async getAll(companyId, { page = 1, limit = 20, couponType, discountType, isActive, search } = {}) {
    const where = { companyId };
    if (couponType) where.couponType = couponType;
    if (discountType) where.discountType = discountType;
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (search) { where[Op.or] = [{ code: { [Op.like]: `%${search}%` } }]; }

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await Coupon.findAndCountAll({
      where, limit: parseInt(limit) || 20, offset, order: [['createdAt', 'DESC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }

  async getById(id, companyId) {
    const coupon = await Coupon.findOne({ where: { id, companyId } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  /**
   * Generate one or more coupon codes
   */
  async generate(data, companyId) {
    const count = data.count || 1;
    const prefix = data.prefix || 'CPN';
    const coupons = [];

    for (let i = 0; i < count; i++) {
      const code = `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const coupon = await Coupon.create({
        id: uuidv4(), companyId, code,
        couponType: data.couponType || 'single_use',
        discountType: data.discountType || 'percentage',
        discountValue: data.discountValue || 0,
        minPurchase: data.minPurchase || 0,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || -1,
        perCustomerLimit: data.perCustomerLimit || 1,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        campaignId: data.campaignId || null,
        applicableProducts: data.applicableProducts || null,
        applicableCategories: data.applicableCategories || null,
      });
      coupons.push(coupon);
    }

    return coupons;
  }

  async update(id, data, companyId) {
    const coupon = await Coupon.findOne({ where: { id, companyId } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    await coupon.update(data);
    return coupon;
  }

  async delete(id, companyId) {
    const coupon = await Coupon.findOne({ where: { id, companyId } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    if (coupon.usageCount > 0) throw new ValidationError('Cannot delete coupon that has been used');
    await coupon.destroy();
  }

  async toggleStatus(id, companyId) {
    const coupon = await Coupon.findOne({ where: { id, companyId } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return coupon;
  }

  /**
   * Validate a coupon code and return discount details.
   * Does NOT redeem - just validates eligibility.
   */
  async validateCoupon(code, customerId, companyId, { orderAmount = 0 } = {}) {
    const coupon = await Coupon.findOne({ where: { code, companyId } });
    if (!coupon) throw new NotFoundError('Invalid coupon code');
    if (!coupon.isActive) throw new ValidationError('Coupon is inactive');

    const now = new Date();
    if (new Date(coupon.startDate) > now) throw new ValidationError('Coupon not yet active');
    if (new Date(coupon.endDate) < now) throw new ValidationError('Coupon has expired');

    // Usage limit check
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      throw new ValidationError('Coupon usage limit reached');
    }

    // Per-customer limit
    if (customerId && coupon.perCustomerLimit > 0) {
      const customerUsage = await CouponUsage.count({ where: { couponId: coupon.id, customerId } });
      if (customerUsage >= coupon.perCustomerLimit) throw new ValidationError('You have already used this coupon');
    }

    // Min purchase
    if (coupon.minPurchase > 0 && orderAmount < coupon.minPurchase) {
      throw new ValidationError(`Minimum purchase of AED ${coupon.minPurchase} required`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * parseFloat(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discountAmount > parseFloat(coupon.maxDiscount)) {
        discountAmount = parseFloat(coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'fixed_amount') {
      discountAmount = parseFloat(coupon.discountValue);
    } else if (coupon.discountType === 'points') {
      discountAmount = 0; // Points-based handled separately
    }

    return {
      valid: true,
      coupon: { id: coupon.id, code: coupon.code, couponType: coupon.couponType, discountType: coupon.discountType, discountValue: parseFloat(coupon.discountValue) },
      discountAmount: Math.min(discountAmount, orderAmount),
      finalAmount: Math.max(0, orderAmount - discountAmount),
    };
  }

  /**
   * Redeem/use a coupon (record usage)
   */
  async redeemCoupon(code, customerId, companyId, { orderAmount = 0, orderReference } = {}) {
    // Validate first
    const validation = await this.validateCoupon(code, customerId, companyId, { orderAmount });

    const coupon = await Coupon.findOne({ where: { code, companyId } });
    if (!coupon) throw new NotFoundError('Coupon not found');

    // If points-based, award points to customer via PointsEngine
    if (coupon.discountType === 'points') {
      const pointsEngine = require('./PointsEngineService');
      await pointsEngine.earnPoints({
        customerId, companyId,
        points: parseInt(coupon.discountValue),
        source: 'Coupon',
        referenceType: 'coupon', referenceId: coupon.id,
        notes: `Points from coupon: ${coupon.code}`,
      });
      validation.discountAmount = parseInt(coupon.discountValue);
    }

    // Record usage
    await CouponUsage.create({
      id: uuidv4(), couponId: coupon.id, customerId, companyId,
      orderReference, discountApplied: validation.discountAmount,
    });

    // Increment counter
    coupon.usageCount += 1;
    if (coupon.couponType === 'single_use') coupon.isActive = false;
    await coupon.save();

    return { ...validation, redeemed: true };
  }

  async getUsageHistory(companyId, { page = 1, limit = 20, couponId, customerId } = {}) {
    const where = { companyId };
    if (couponId) where.couponId = couponId;
    if (customerId) where.customerId = customerId;

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await CouponUsage.findAndCountAll({
      where,
      include: [
        { model: Coupon, as: 'coupon', attributes: ['id', 'code', 'discountType', 'discountValue'], required: false },
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName'], required: false },
      ],
      limit: parseInt(limit) || 20, offset, order: [['usedAt', 'DESC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }
}

module.exports = new CouponService();
