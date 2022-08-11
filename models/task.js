const { Schema, model } = require('mongoose')
const database = require('../database')

const taskSchema = new Schema({
  content: String,
  completed: Boolean,
  date: Date,
})

taskSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = model('Task', taskSchema)
