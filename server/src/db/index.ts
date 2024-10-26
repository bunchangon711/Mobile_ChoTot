import { connect } from "mongoose";

const uri = "mongodb+srv://minhprojectmobile:15102003@mobileproject.kk6e8.mongodb.net/?retryWrites=true&w=majority&appName=MobileProject";
// const uri = 'mongodb://127.0.0.1:27017/smart-cycle-market'

connect(uri)
  .then(() => {
    console.log("db connected successfully.");
  })
  .catch((err) => {
    console.log("db connection error: ", err.message);
  });
