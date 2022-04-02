require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
/* import Routes */
const authRouter = require('./routes/auth')
const privateRouter = require('./routes/private');

const URL = process.env.MONGODB_URL;
const PORT = process.env.PORT || 3001;
/* Connect to DB */
mongoose.connect(URL,{useNewUrlParser:true,useUnifiedTopology:true})
const connection = mongoose.connection;
connection.on('open',() => console.log("MongoDB Connected"));

const app = express();
/* Middleware */
app.use(cors());
app.use(express.json());

app.use('/api/auth',authRouter);
app.use('/api/private',privateRouter)

app.get('/',(req,res) => {
    res.send('LoginSystem - Server is up and Running')
})
const server = app.listen(PORT,() => console.log(`Server running on port ...${PORT}`));

process.on('unhandledRejection',(err) => {
    console.log(err);
    server.close(()=>process.exit(1));
})