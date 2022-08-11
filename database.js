const mongoose = require('mongoose')

const URI = process.env.URI

module.exports = async () => {
  try {
    await mongoose.connect(URI)
    console.log('Database connected')
  } catch (err) {
    console.log({
      status: 'fail',
      data: {
        message: err.message,
        cause: 'Connection error',
      },
    })
    process.exit(1)
  }
}
