'use strict'

require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const dbConnect = require('./database')
const Task = require('./models/task')
const TaskOrder = require('./models/task-order')
const app = express()

const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors())
app.use(morgan('dev'))
app.use(express.static('build'))

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
    const taskOrderList = await TaskOrder.find({})

    const orderedTasks = taskOrderList[0].order.map((id) => {
      const task = data.find((task) => task._id.toString() === id)
      return task
    })

    return res.json({
      status: 'success',
      results: data.length,
      data: {
        tasks: orderedTasks,
        taskOrder: taskOrderList[0].order,
      },
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
    if (!content) throw new Error('Task content is required')

    let taskOrder
    const data = await Task.create({
      content,
      completed: req.body.completed || false,
      date: new Date(),
    })

    const taskOrderList = await TaskOrder.find({})

    if (taskOrderList.length === 0) {
      taskOrder = new TaskOrder({
        order: [data.id],
      })
      await taskOrder.save()
    } else {
      taskOrder = taskOrderList[0]
      const newOrder = taskOrder.order.concat(data.id)
      taskOrder.order = [...newOrder]
      await taskOrder.save()
    }

    return res.status(201).json({
      status: 'success',
      data: {
        task: data,
        taskOrder: taskOrder.order,
      },
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

app.put('/api/tasks/:id/switch', async (req, res) => {
  try {
    const { sourceIndex, destinationIndex } = req.query
    const taskOrderList = await TaskOrder.find({})
    const taskOrder = taskOrderList[0]

    const taskOrderCopy = [...taskOrder.order]
    const target = taskOrderCopy[sourceIndex]

    taskOrderCopy.splice(sourceIndex, 1)
    taskOrderCopy.splice(destinationIndex, 0, target)

    taskOrder.order = [...taskOrderCopy]
    await taskOrder.save()

    return res.json({
      status: 'success',
      data: {
        taskOrder,
      },
    })
  } catch (err) {
    return logError(res, 500, err.message)
  }
})

app.delete('/api/tasks/', async (req, res) => {
  try {
    const data = await Task.deleteMany({ completed: true })

    const remainingTasks = await Task.find({})
    const remainingTaskIds = remainingTasks.map(({ _id }) => _id.toString())
    const taskOrderList = await TaskOrder.find({})
    const taskOrder = taskOrderList[0]

    const newOrder = taskOrder.order.filter((id) =>
      remainingTaskIds.includes(id)
    )

    taskOrder.order = [...newOrder]
    await taskOrder.save()

    return res.status(201).json({
      status: 'success',
      data: {
        countDeleted: data.deletedCount,
        taskOrder: taskOrder.order,
      },
    })
  } catch (err) {
    return logError(res, 400, err.message)
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const data = await Task.findByIdAndDelete(req.params.id)
    const taskOrderList = await TaskOrder.find({})

    const taskOrder = taskOrderList[0]

    const newOrder = taskOrder.order.filter((id) => id !== req.params.id)

    taskOrder.order = [...newOrder]
    await taskOrder.save()

    res.json({
      status: 'success',
      data,
    })
  } catch (err) {
    return logError(res, 500, err.message)
  }
})

async function run() {
  await dbConnect()
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`))
}

run()

function logError(res, status, message) {
  return res.status(status).json({
    status: 'fail',
    data: message,
  })
}
