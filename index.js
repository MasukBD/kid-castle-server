const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sc5cufk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const CustomerCollection = client.db('kidCastleDB').collection('CustomerSays');
        const NewsCollection = client.db('kidCastleDB').collection('NewsAndEvents');
        const ProductCollection = client.db('kidCastleDB').collection('Products');

        app.get('/customerSays', async (req, res) => {
            const cursor = CustomerCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/news&events', async (req, res) => {
            const cursor = NewsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/products', async (req, res) => {
            let query = {};
            const sort = req.query?.sort;
            const search = req.query?.search;

            const options = {
                sort: { "price": sort == 'true' ? 1 : -1 }
            }
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            if (req.query?.search) {
                query = { category: { $regex: search, $options: 'i' } }
            }
            if (req.query?.page && req.query?.limit) {
                const page = parseInt(req.query.page);
                const limit = parseInt(req.query.limit);
                const skip = (page - 1) * limit;
                const cursor = ProductCollection.find(query, options).skip(skip).limit(limit);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                const cursor = ProductCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
        });


        app.get('/productCount', async (req, res) => {
            const result = await ProductCollection.estimatedDocumentCount();
            res.send({ numberOfProduct: result })
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ProductCollection.findOne(query);
            res.send(result);
        });

        app.put('/products/:id', async (req, res) => {
            const updatedInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedData = {
                $set: {
                    productName: updatedInfo.productName,
                    sellerName: updatedInfo.sellerName,
                    img: updatedInfo.img,
                    email: updatedInfo.email,
                    category: updatedInfo.category,
                    productQuantiy: updatedInfo.productQuantiy,
                    price: updatedInfo.price,
                    ratings: updatedInfo.ratings,
                    description: updatedInfo.description
                },
            };
            const result = await ProductCollection.updateOne(filter, updatedData, options);
            res.send(result);

        })

        app.post('/products', async (req, res) => {
            const singleProduct = req.body;
            const result = await ProductCollection.insertOne(singleProduct);
            res.send(result);
        });

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ProductCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Kid Castle Toy Shop Server is running');
})

app.listen(port, () => {
    console.log(`Kid castle sever is running on port ${port}`);
})