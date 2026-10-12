require('dotenv').config()

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')

let db

const username = encodeURIComponent(process.env.MONGODB_USERNAME)
const password = encodeURIComponent(process.env.MONGODB_PASSWORD)
const cluster = process.env.MONGODB_URI

const url = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority`

const dbName = 'savage-demo'

// Middleware
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static('public'))

// READ - Get all messages
app.get('/', async (req, res) => {
  try {
    const result = await db.collection('messages').find().toArray()

    res.render('index.ejs', { messages: result })
  } catch (error) {
    console.error(error)
    res.status(500).send('Error retrieving messages')
  }
})

// CREATE - Add a message
app.post('/messages', async (req, res) => {
  try {
    await db.collection('messages').insertOne({
      name: req.body.name,
      msg: req.body.msg,
      thumbUp: 0,
      thumbDown: 0
    })

    console.log('Saved to database')
    res.redirect('/')
  } catch (error) {
    console.error(error)
    res.status(500).send('Error saving message')
  }
})

// UPDATE - Like a message
app.put('/messages', async (req, res) => {
  try {
    const result = await db.collection('messages').findOneAndUpdate(
      {
        name: req.body.name,
        msg: req.body.msg
      },
      {
        $set: {
          thumbUp: req.body.thumbUp
        }
      },
      {
        sort: { _id: -1 },
        upsert: true
      }
    )

    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error updating message')
  }
})

// DELETE - Remove a message
app.delete('/messages', async (req, res) => {
  try {
    await db.collection('messages').findOneAndDelete({
      name: req.body.name,
      msg: req.body.msg
    })

    res.send('Message deleted!')
  } catch (error) {
    console.error(error)
    res.status(500).send('Error deleting message')
  }
})

// Connect to MongoDB
MongoClient.connect(url)
  .then(client => {
    db = client.db(dbName)

    console.log('Connected to ' + dbName)

    app.listen(3000, () => {
      console.log('Listening on port 3000')
    })
  })
  .catch(error => console.error(error))