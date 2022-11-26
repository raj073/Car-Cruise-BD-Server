const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rcsgtvg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){

    try{

        const categoriesCollection = client.db("carCruiseBD").collection("carCategories");
        const productsCollection = client.db("carCruiseBD").collection("carProducts");
        const bookingsCollection = client.db("carCruiseBD").collection("carBookings");
        const usersCollection = client.db("carCruiseBD").collection("users");
        

        app.get('/categories', async (req, res) =>{
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        app.get('/category/:id', async (req, res) =>{
            const id = req.params.id;
            const query = { categoryId: id };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'Admin'});
        });

        app.get('/users/seller/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'Seller'});
        });

        app.get('/users/buyer/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isBuyer: user?.role === 'Buyer'});
        });

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const orders = await bookingsCollection.find(query).toArray();
            res.send(orders);
        })

        app.post('/bookings', async(req, res) => {
            const bookings = req.body;
            const result = await bookingsCollection.insertOne(bookings);
            res.send(result);
        });

        app.post('/users', async(req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.send(result);
        });



    }

    finally{

    }

}

run().catch(console.log);


app.get('/', async(req, res) => {
    res.send("Car Cruise BD Server is Running");
});

app.listen(port, () => {
    console.log(`Car Cruise BD Server is Running on ${port}`);
});