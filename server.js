const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')

let db;

const url = "mongodb+srv://demo:demo@cluster0-q2ojb.mongodb.net/test?retryWrites=true";
const dbName = "demo";

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static('public'))

async function connectDB() {
  try {
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to \`\${dbName}\`!`);
    
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

connectDB();

app.get('/', async (req, res) => {
  try {
    const result = await db.collection('messages').find().toArray();
    res.render('index.ejs', { messages: result });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching messages");
  }
});

app.post('/messages', async (req, res) => {
  try {
    await db.collection('messages').insertOne({ 
      name: req.body.name, 
      msg: req.body.msg, 
      thumbUp: 0, 
      thumbDown: 0 
    });
    console.log('saved to database');
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.put('/messages', async (req, res) => {
  try {
    const result = await db.collection('messages').findOneAndUpdate(
      { name: req.body.name, msg: req.body.msg }, 
      { $set: { thumbUp: req.body.thumbUp } }, 
      { sort: { _id: -1 }, upsert: true }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/messages', async (req, res) => {
  try {
    await db.collection('messages').findOneAndDelete({ 
      name: req.body.name, 
      msg: req.body.msg 
    });
    res.send('Message deleted!');
  } catch (err) {
    res.status(500).send(err);
  }
});
