# Code Citations

## License: unknown
https://github.com/KhanZiaul/All-Server-Site/tree/c7214ab2e6c51d08a85f63d2b0fc6e161daa9943/aircnc/index.js

```
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").
```


## License: unknown
https://github.com/fredara/mern_login_register/tree/b9a324916f763c36abed2dbc5ffd4c9940318e7c/server/src/database.js

```
,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment
```


## License: unknown
https://github.com/Salvatore-dev/Digitazon-html-salvatore/tree/260d148a30b56184d7667d448d2b3d45ff77606e/random/progetto-finale/lato-server/src/mongoDB.mjs

```
function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error
```


## License: unknown
https://github.com/Zoharos/elementor-node/tree/522900dd90d7b016228d410978b1bf93b81afed7/backend/src/Atlas/index.js

```
;

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch
```


## License: unknown
https://github.com/lezver/Node.JS/tree/218d67932cbe7830d77454b10a7a5bab364a88f6/module3/part1/mondodb/index.js

```
{
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error(
```

