'use strict';
/**
 * Mini decimal helper so that services can avoid importing the full decimal.js library.
 * Many existing service files do: const decimal = require('./decimalService');
 */
const Decimal = require('decimal.js');

class DecimalService {
  static multiply(a, b) {
    return new Decimal(a).times(b).toNumber();
  }

  static add(a, b) {
    return new Decimal(a).plus(b).toNumber();
  }

  static subtract(a, b) {
    return new Decimal(a).minus(b).toNumber();
  }

  static divide(a, b) {
    return new Decimal(a).div(b).toNumber();
  }

  static round(value, decimals = 2) {
    return new Decimal(value).toDecimalPlaces(decimals).toNumber();
  }
}

module.exports = DecimalService;