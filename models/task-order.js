const mongoose = require('mongoose')

const taskOrderSchema = new mongoose.Schema({
  order: Array,
})

module.exports = mongoose.model('Task-Order', taskOrderSchema)
