import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1469355",
    key: "4fa6ad3ae3dc76a4c5e8",
    secret: "4ddd9dbb9e43e83ba838",
    cluster: "ap2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = "mongodb+srv://PrateekVerma:Prap1t1k3v1teek@cluster0.wnmma8g.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url);

const db = mongoose.connection;
db.once("open", ()=>{
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change)=> {
        console.log("A Change occured", change);

        if (change.operationType == "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                messages: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});

// ????

// api routes
app.get('/', (req,res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
     Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})


app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

// listen
app.listen(port, () => console.log('Listening on localhost:${port}'));