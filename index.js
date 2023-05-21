const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3500;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ky76see.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const toyCarsCollection = client.db("carZoneDB").collection("toyCars");

    // get all cars
    app.get("/cars", async (req, res) => {
      const result = await toyCarsCollection.find().limit(20).toArray();
      res.send(result);
    });

    // get cars by category
    app.get("/categories/:cat", async (req, res) => {
      const targetCategory = req.params.cat.split("-").join(" ");
      const result = await toyCarsCollection
        .find({ subcategory: targetCategory })
        .toArray();
      res.send(result);
    });

    // get a single car for details
    app.get("/cars/:id", async (req, res) => {
      const result = await toyCarsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // get all toy car for a single user by email
    app.get("/my-toys", async (req, res) => {
      const result = await toyCarsCollection
        .find({ sellerEmail: req.query.email })
        .toArray();
      res.send(result);
    });

    // search
    const result = await toyCarsCollection.createIndex(
      { name: 1 },
      { name: "toyCarsName" }
    );

    app.get("/search/:text", async (req, res) => {
      const result = await toyCarsCollection
        .find({ name: { $regex: req.params.text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    // sort by price
    app.get("/sort-car/:text", async (req, res) => {
      let sortTo;
      if (req.params.text === "low") {
        sortTo = 1;
      } else {
        sortTo = -1;
      }
      const result = await toyCarsCollection
        .find({sellerEmail: req.query.email})
        .sort({ price: sortTo })
        .toArray();
      res.send(result);
    });

    // load gallery image
    app.get("/gallery-images", async (req, res) => {
      const result = await toyCarsCollection
        .find({}, { projection: { pictureUrl: 1 } })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // post a toy car
    app.post("/cars", async (req, res) => {
      const body = req.body;
      const result = await toyCarsCollection.insertOne(body);
      res.send(result);
    });

    // update a car information
    app.patch("/cars/:id", async (req, res) => {
      const updateDoc = {
        $set: {
          price: req.body.price,
          quantity: req.body.quantity,
          description: req.body.description,
        },
      };
      const result = await toyCarsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        updateDoc
      );
      res.send(result);
    });

    // delete a toy
    app.delete("/cars/:id", async (req, res) => {
      const result = await toyCarsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toy Car Zone server is running");
});

app.listen(port, () => {
  console.log(`Toy Car Zone server is running on ${port}`);
});
