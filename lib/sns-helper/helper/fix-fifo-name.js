'use strict';

module.exports = (name, fifoTopic) => (fifoTopic ? `${name}.fifo` : name);
