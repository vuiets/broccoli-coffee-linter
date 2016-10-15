'use strict';

var CoffeeBeanChecker = require('../lib');

var errorAndNoOptions = CoffeeBeanChecker('fixtures');

module.exports = errorAndNoOptions;
