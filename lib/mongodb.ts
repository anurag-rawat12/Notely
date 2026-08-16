import { MongoClient } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
    throw new Error("Please add your Mongo URI to .env.local");
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In dev, use a global variable so the connection is reused across hot reloads
    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production, no need for a global var — module is only loaded once
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;