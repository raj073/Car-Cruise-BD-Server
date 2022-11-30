const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rcsgtvg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoriesCollection = client
      .db("carCruiseBD")
      .collection("carCategories");
    const productsCollection = client
      .db("carCruiseBD")
      .collection("carProducts");
    const bookingsCollection = client
      .db("carCruiseBD")
      .collection("carBookings");
    const usersCollection = client.db("carCruiseBD").collection("users");
    const paymentsCollection = client.db("carCruiseBD").collection("payments");
    const wishlistCollection = client.db("carCruiseBD").collection("wishlist");

    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    });

    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { categoryId: id };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "Admin" });
    });

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "Seller" });
    });

    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "Buyer" });
    });

    //Get All Seller
    app.get("/users/allseller", async (req, res) => {
      const query = { role: "Seller" };
      const seller = await usersCollection.find(query).toArray();
      res.send(seller);
    });

    //Get All Buyer
    app.get("/users/allbuyer", async (req, res) => {
      const query = { role: "Buyer" };
      const buyer = await usersCollection.find(query).toArray();
      res.send(buyer);
    });

    // Get All Order by query email address
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const orders = await bookingsCollection.find(query).toArray();
      res.send(orders);
    });

    //Id Wise Order Load from pay button click
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await bookingsCollection.findOne(query);
      res.send(order);
    });

    // Get All Wishlist by query email address
    app.get("/wishlist-products", async (req, res) => {
      const email = req.query.email;
      console.log('--', email);
      const query = { wishlistEmail: email, wishlist: "yes" };
      const wishlist = await productsCollection.find(query).toArray();
      res.send(wishlist);
    });

    // Get All Wishlist by Object Id to make Payment
    app.get("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const wishlist = await productsCollection.findOne(query);
      res.send(wishlist);
    });

    // Get Car Categories API
    app.get("/addProductCategories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection
        .find(query)
        .project({ categoryId: 1, name: 1 })
        .toArray();
      res.send(result);
    });

    //Seller Get Product
    app.get("/products", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: req.query.email };
      const doctors = await productsCollection.find(query).toArray();
      res.send(doctors);
    });

    //Add Product API
    app.post("/addProducts", async (req, res) => {
      const products = req.body;
      console.log(products);
      const result = await productsCollection.insertOne(products);
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      const result = await bookingsCollection.insertOne(bookings);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const users = req.body;
      console.log(users);

      //If users exists with same email address
      const query = { email: users.email };
      const alreadyLoggedIn = await usersCollection.find(query).toArray();
      if (alreadyLoggedIn.length) {
        const message = `Already Registered with Email ${users.email}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    //Product Delete API
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });

    //Seller Delete API
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    //Make Advertise Button and Update Table
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          advertisement: "yes",
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    //Add to Wishlist Button click and update product table
    app.put("/wishlists", async (req, res) => {
      const id = req.query.id;
      const email = req.query.email;
      console.log(id, email);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          wishlist: "yes",
          wishlistEmail: email
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    app.get("/advertisement/products", async (req, res) => {
      const query = { advertisement: "yes" };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // Stripe Create Payment Intent My Booking
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Stripe Create Payment Intent My Wishlist
    app.post("/wishlist-create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.resalePrice;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Payment update api My Booking
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    // Payment update api My Wishlist
    app.post("/wishlist-payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      console.log(id, filter, updatedDoc);
      const updatedResult = await productsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Car Cruise BD Server is Running");
});

app.listen(port, () => {
  console.log(`Car Cruise BD Server is Running on ${port}`);
});
