import { MongoClient } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient>;

if (!uri) {
    // In CI / build step, prevent build crash if env var is not set during static analysis
    if (process.env.NODE_ENV === "production") {
        clientPromise = new Promise<MongoClient>((_, reject) => {
            reject(new Error("MONGODB_URI is not defined. Please set MONGODB_URI in your environment variables."));
        });
    } else {
        throw new Error("Please add your Mongo URI to .env.local");
    }
} else {
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
}

export default clientPromise;