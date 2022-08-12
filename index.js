'use strict'

require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const dbConnect = require('./database')
const Task = require('./models/task')
const app = express()

const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

app.get('/info', async (req, res) => {
  try {
    const data = await Task.find({})
    return res.json({
      status: 'success',
      date: new Date(),
      data: {
        results: data.length,
      },
    })
  } catch (err) {
    logError(res, 500, 'Internal Server Error')
  }
})

app.get('/api/tasks', async (req, res) => {
  try {
    const data = await Task.find({})
    return res.json({
      status: 'success',
      results: data.length,
      data,
    })
  } catch (err) {
    return logError(res, 500, 'Internal server errorx')
  }
})

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const data = await Task.findById(req.params.id)
    res.json({
      status: 'success',
      data,
    })
  } catch (err) {
    if (err.name === 'CastError')
      return logError(res, 400, 'Cast to ObjectID faileed, invalid string')

    return logError(res, 500, 'Internal server error')
  }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const content = req.body.content?.trim()
    if (!content) throw new Error('body needed broh')

    const data = await Task.create({
      content,
      completed: req.body.completed || false,
      date: new Date(),
    })

    return res.status(201).json({
      status: 'success',
      data,
    })
  } catch (err) {
    return logError(res, 400, err.message)
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) return logError(res, 404, 'Task not found')

    task.completed = !task.completed
    const data = await task.save()

    return res.status(201).json({
      status: 'success',
      data,
    })
  } catch (err) {
    if (err.name === 'CastError')
      return logError(res, 400, 'Cast to ObjectID faileed, invalid string')

    return logError(res, 500, 'Internal server error')
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const data = await Task.findByIdAndDelete(req.params.id)
    res.send('broh')
  } catch (err) {
    return logError(res, 500, 'Internal server error')
  }
})

async function run() {
  await dbConnect()
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`))
}

run()

// Function for logging errors

function logError(res, status, message) {
  return res.status(status).json({
    status: 'fail',
    data: message,
  })
}
