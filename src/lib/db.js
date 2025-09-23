import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('DB connected'));
        await mongoose.connect(`${process.env.MONGO_URI}/Video_Call_App`);
    } catch (error) {
        console.log('Connect error: ', error.message);
    }
};

export default connectDB;