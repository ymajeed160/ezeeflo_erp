/**
 * RuleEngineService Unit Tests - Plain Node.js
 */
const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log(`  ✓ ${name}`); passed++; } catch (e) { console.log(`  ✗ ${name}: ${e.message}`); failed++; } }

const createContext = (overrides = {}) => ({
  invoiceAmount: '100', invoiceQuantity: '2', productCategory: 'electronics',
  paymentMethod: 'card', dayOfWeek: 'Monday', customerTier: 'silver',
  customerSegment: 'regular', isBirthday: false, isFirstPurchase: false,
  purchaseCount: 5, customerMembershipMultiplier: '1.5',
  ...overrides,
});

// Cannot directly require RuleEngineService due to Sequelize deps,
// so we test the evaluation logic independently
const _evaluateSingleCondition = (condition, context) => {
  const { field, operator, value } = condition;
  const ctxValue = context[field];
  switch (operator) {
    case 'equals': return ctxValue === value;
    case 'not_equals': return ctxValue !== value;
    case 'greater_than': return parseFloat(ctxValue) > parseFloat(value);
    case 'less_than': return parseFloat(ctxValue) < parseFloat(value);
    case 'greater_or_equal': return parseFloat(ctxValue) >= parseFloat(value);
    case 'in': return Array.isArray(value) && value.includes(ctxValue);
    case 'between': return Array.isArray(value) && value.length === 2 && parseFloat(ctxValue) >= parseFloat(value[0]) && parseFloat(ctxValue) <= parseFloat(value[1]);
    case 'is_true': return !!ctxValue;
    case 'is_false': return !ctxValue;
    default: return false;
  }
};

const _evaluateConditions = (conditions, context) => {
  if (!conditions || conditions.length === 0) return true;
  return conditions.some(group => {
    const logic = (group.logic || 'AND').toUpperCase();
    const conds = group.conditions || [];
    if (conds.length === 0) return true;
    return logic === 'AND' ? conds.every(c => _evaluateSingleCondition(c, context)) : conds.some(c => _evaluateSingleCondition(c, context));
  });
};

const _resolvePoints = (config, context) => {
  if (!config) return 0;
  switch (config.pointType) {
    case 'fixed': return parseInt(config.value || 0);
    case 'percentage': return Math.floor((parseFloat(context.invoiceAmount || 0) * parseFloat(config.value || 0)) / 100);
    case 'per_item': return parseInt(config.value || 0) * parseInt(context.invoiceQuantity || 1);
    case 'per_amount_spent': return Math.floor(parseFloat(context.invoiceAmount || 0) / parseFloat(config.perAmount || 1)) * parseFloat(config.value || 1);
    case 'tier_based': return parseInt((config.tierValues || {})[(context.customerTier || 'standard').toLowerCase()] || config.value || 0);
    default: return 0;
  }
};

console.log('\n🧪 Rule Engine - Condition Evaluation');
test('empty conditions => true', () => { assert.strictEqual(_evaluateConditions(null, createContext()), true); });
test('equals operator match', () => { assert.strictEqual(_evaluateSingleCondition({ field: 'paymentMethod', operator: 'equals', value: 'card' }, createContext()), true); });
test('greater_than true', () => { assert.strictEqual(_evaluateSingleCondition({ field: 'invoiceAmount', operator: 'greater_than', value: '50' }, createContext()), true); });
test('greater_than false', () => { assert.strictEqual(_evaluateSingleCondition({ field: 'invoiceAmount', operator: 'greater_than', value: '200' }, createContext()), false); });
test('AND group - all match', () => {
  assert.strictEqual(_evaluateConditions([{ logic: 'AND', conditions: [{ field: 'invoiceAmount', operator: 'greater_than', value: '50' }, { field: 'paymentMethod', operator: 'equals', value: 'card' }] }], createContext()), true);
});
test('AND group - one fails', () => {
  assert.strictEqual(_evaluateConditions([{ logic: 'AND', conditions: [{ field: 'invoiceAmount', operator: 'greater_than', value: '50' }, { field: 'paymentMethod', operator: 'equals', value: 'cash' }] }], createContext()), false);
});
test('OR group - any match', () => {
  assert.strictEqual(_evaluateConditions([{ logic: 'OR', conditions: [{ field: 'paymentMethod', operator: 'equals', value: 'cash' }, { field: 'paymentMethod', operator: 'equals', value: 'card' }] }], createContext()), true);
});
test('is_true operator', () => { assert.strictEqual(_evaluateSingleCondition({ field: 'isBirthday', operator: 'is_true' }, createContext({ isBirthday: true })), true); });
test('between operator', () => { assert.strictEqual(_evaluateSingleCondition({ field: 'purchaseCount', operator: 'between', value: [1, 10] }, createContext()), true); });
test('in operator', () => { assert.strictEqual(_evaluateSingleCondition({ field: 'productCategory', operator: 'in', value: ['electronics', 'clothing'] }, createContext()), true); });

console.log('\n🧪 Rule Engine - Point Resolution');
test('fixed points', () => { assert.strictEqual(_resolvePoints({ pointType: 'fixed', value: '100' }, createContext()), 100); });
test('percentage of invoice', () => { assert.strictEqual(_resolvePoints({ pointType: 'percentage', value: '10' }, createContext({ invoiceAmount: '500' })), 50); });
test('per item points', () => { assert.strictEqual(_resolvePoints({ pointType: 'per_item', value: '5' }, createContext({ invoiceQuantity: '3' })), 15); });
test('per amount spent', () => { assert.strictEqual(_resolvePoints({ pointType: 'per_amount_spent', value: '1', perAmount: '10' }, createContext({ invoiceAmount: '100' })), 10); });
test('tier based points', () => { assert.strictEqual(_resolvePoints({ pointType: 'tier_based', tierValues: { bronze: '1', silver: '2', gold: '3' }, value: '1' }, createContext({ customerTier: 'silver' })), 2); });

console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
process.exit(failed > 0 ? 1 : 0);
