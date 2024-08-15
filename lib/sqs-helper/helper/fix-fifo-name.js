'use strict';

module.exports = (name, fifoQueue) => (fifoQueue ? `${name}.fifo` : name);
