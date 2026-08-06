const { GiftCard, GiftCardTransaction, Customer } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');
const crypto = require('crypto');

class GiftCardService {
  _generateCardNumber() {
    const prefix = 'GC';
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    const checksum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}-${random}${checksum}`;
  }

  _generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async getAll(companyId, { page = 1, limit = 20, status, search, customerId } = {}) {
    const where = { companyId };
    if (status) where.status = status;
    if (customerId) where[Op.or] = [{ purchaserCustomerId: customerId }, { recipientCustomerId: customerId }];
    if (search) { where[Op.or] = [{ cardNumber: { [Op.like]: `%${search}%` } }, { recipientEmail: { [Op.like]: `%${search}%` } }, { recipientPhone: { [Op.like]: `%${search}%` } }]; }

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await GiftCard.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'purchaser', attributes: ['id', 'code', 'firstName', 'lastName'], required: false },
        { model: Customer, as: 'recipient', attributes: ['id', 'code', 'firstName', 'lastName'], required: false },
      ],
      limit: parseInt(limit) || 20, offset, order: [['createdAt', 'DESC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }

  async getById(id, companyId) {
    const card = await GiftCard.findOne({
      where: { id, companyId },
      include: [
        { model: Customer, as: 'purchaser', attributes: ['id', 'code', 'firstName', 'lastName'], required: false },
        { model: Customer, as: 'recipient', attributes: ['id', 'code', 'firstName', 'lastName'], required: false },
        { model: GiftCardTransaction, as: 'transactions', required: false, order: [['createdAt', 'DESC']], limit: 20 },
      ],
    });
    if (!card) throw new NotFoundError('Gift card not found');
    return card;
  }

  /**
   * Purchase/Create a new gift card
   */
  async purchase(data, companyId) {
    const cardNumber = data.cardNumber || this._generateCardNumber();
    const pin = data.pin || this._generatePin();

    // Check uniqueness
    const existing = await GiftCard.findOne({ where: { cardNumber, companyId } });
    if (existing) throw new ConflictError('Card number already exists');

    const initialBalance = parseFloat(data.initialBalance) || 0;
    if (initialBalance <= 0) throw new ValidationError('Initial balance must be positive');

    const card = await GiftCard.create({
      id: uuidv4(), companyId, cardNumber, pin,
      initialBalance, currentBalance: initialBalance,
      currency: data.currency || 'AED',
      status: 'active',
      purchaserCustomerId: data.purchaserCustomerId || null,
      recipientCustomerId: data.recipientCustomerId || null,
      recipientEmail: data.recipientEmail || null,
      recipientPhone: data.recipientPhone || null,
      message: data.message || null,
      startDate: data.startDate || new Date(),
      expiryDate: data.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // Record purchase transaction
    await GiftCardTransaction.create({
      id: uuidv4(), giftCardId: card.id, companyId,
      transactionType: 'purchase', amount: initialBalance,
      balanceBefore: 0, balanceAfter: initialBalance,
      referenceType: 'purchase', notes: 'Gift card purchased',
    });

    return card;
  }

  /**
   * Redeem a gift card (deduct from balance)
   */
  async redeem(cardNumber, amount, companyId, { orderReference, customerId, createdBy } = {}) {
    const card = await GiftCard.findOne({ where: { cardNumber, companyId } });
    if (!card) throw new NotFoundError('Gift card not found');
    if (card.status !== 'active') throw new ValidationError(`Gift card is ${card.status}`);
    if (card.expiryDate && new Date(card.expiryDate) < new Date()) throw new ValidationError('Gift card has expired');

    const redeemAmount = parseFloat(amount);
    if (redeemAmount <= 0) throw new ValidationError('Amount must be positive');
    if (parseFloat(card.currentBalance) < redeemAmount) {
      throw new ValidationError(`Insufficient balance. Available: AED ${parseFloat(card.currentBalance).toFixed(2)}`);
    }

    const balanceBefore = parseFloat(card.currentBalance);
    const balanceAfter = balanceBefore - redeemAmount;

    await GiftCardTransaction.create({
      id: uuidv4(), giftCardId: card.id, companyId,
      transactionType: 'redeem', amount: -redeemAmount,
      balanceBefore, balanceAfter,
      referenceType: orderReference ? 'order' : 'redemption',
      referenceId: orderReference || null,
      notes: `Redeemed AED ${redeemAmount.toFixed(2)}`,
      createdBy,
    });

    card.currentBalance = balanceAfter;
    if (balanceAfter <= 0) {
      card.status = 'redeemed';
      card.redeemedDate = new Date();
    }
    await card.save();

    return { card, redeemedAmount: redeemAmount, remainingBalance: balanceAfter };
  }

  /**
   * Recharge/top-up a gift card
   */
  async recharge(cardNumber, amount, companyId, { notes, createdBy } = {}) {
    const card = await GiftCard.findOne({ where: { cardNumber, companyId } });
    if (!card) throw new NotFoundError('Gift card not found');
    if (!['active', 'redeemed'].includes(card.status)) throw new ValidationError(`Cannot recharge card with status: ${card.status}`);

    const rechargeAmount = parseFloat(amount);
    if (rechargeAmount <= 0) throw new ValidationError('Amount must be positive');

    const balanceBefore = parseFloat(card.currentBalance);
    const balanceAfter = balanceBefore + rechargeAmount;

    await GiftCardTransaction.create({
      id: uuidv4(), giftCardId: card.id, companyId,
      transactionType: 'recharge', amount: rechargeAmount,
      balanceBefore, balanceAfter,
      referenceType: 'recharge', notes: notes || `Recharged AED ${rechargeAmount.toFixed(2)}`,
      createdBy,
    });

    card.currentBalance = balanceAfter;
    card.initialBalance = parseFloat(card.initialBalance) + rechargeAmount;
    if (card.status === 'redeemed') card.status = 'active';
    await card.save();

    return { card, rechargeAmount, newBalance: balanceAfter };
  }

  /**
   * Cancel/suspend a gift card
   */
  async cancel(cardNumber, companyId, { notes, createdBy } = {}) {
    const card = await GiftCard.findOne({ where: { cardNumber, companyId } });
    if (!card) throw new NotFoundError('Gift card not found');
    if (card.status === 'redeemed') throw new ValidationError('Cannot cancel already redeemed card');

    card.status = 'canceled';
    await card.save();

    await GiftCardTransaction.create({
      id: uuidv4(), giftCardId: card.id, companyId,
      transactionType: 'reverse', amount: -parseFloat(card.currentBalance),
      balanceBefore: parseFloat(card.currentBalance), balanceAfter: 0,
      referenceType: 'cancel', notes: notes || 'Gift card canceled',
      createdBy,
    });

    card.currentBalance = 0;
    await card.save();
    return card;
  }

  async getTransactionHistory(cardId, companyId) {
    return await GiftCardTransaction.findAll({
      where: { giftCardId: cardId, companyId },
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new GiftCardService();
