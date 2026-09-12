"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        console.log('🔄 Connecting to MongoDB Atlas...');
        const conn = await mongoose_1.default.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 60000,
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            w: 'majority',
        });
        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🌐 Host: ${conn.connection.host}`);
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
        });
        return conn;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        console.log('💡 Please check:');
        console.log('   1. Your MongoDB Atlas cluster is active');
        console.log('   2. Your IP is whitelisted in Atlas Network Access');
        console.log('   3. Your username/password are correct');
        console.log('   4. The database name "inventory" exists');
        process.exit(1);
    }
};
exports.connectDB = connectDB;
