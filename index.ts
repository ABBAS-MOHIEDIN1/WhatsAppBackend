import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors"
import https from "https"
import fs from "fs"
import reateLimit from "express-rate-limit"
import cookie_parser from "cookie-parser"
import multer from "multer"
import path from "path"

// import routes
import userRoutes from "./routes/auth"
import Posts from "./routes/Posts"






//utils
const PORT = process.env.PORT || 8000;
const app: Application = express();



// middelware
app.use("/images",express.static(path.join(__dirname,'public/images')))
app.use(bodyParser.json());
app.use(cookie_parser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin:["http://localhost:3000"],
  credentials:true // to exchange the Cookie
}))


const storge:any = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,"public/images")
  },
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
    // req.body.name
  }

})
const upload:any = multer(storge)
app.post('/api/v1/upload',upload.single("file"),(req,res)=>{
  try {
      return res.status(200).json("File uploaded !")
  } catch (error) {
    console.log(`Error in uploading ${error}`);
    
  }
})

// later
// const limiter = reateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
// });
//app.use(limiter);

// routes

// if we vist:http://localhost:8000/api/v1/login we will see it
app.use('/api/v1/auth',userRoutes)
app.use("/api/v1/posts",Posts)
app.get("/", (req: Request, res: Response) => {
  res.send("HI is working..");
});
app.listen(PORT,()=>{
  console.log(`API work at ${PORT}`);
  
})



