import express from "express";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from "cors";
import routes from './routes/AuthRoutes.js';
import UserRoute from "./routes/Users.js";
import MessageRoute from "./routes/MessageRoutes.js";
import helmet from "helmet";
import morgan from "morgan";
import multer from 'multer';
import path from "path"
import { fileURLToPath } from 'url'; // Import the fileURLToPath function
import { Server } from "socket.io";
import { db } from "./utils/PrismaClient.js";
import { v4 as uuidv4 } from 'uuid';
// import { sendMessage } from "./controllers/MessageController.js" do it again please more.

dotenv.config()


const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
const __filename = fileURLToPath(import.meta.url); // Get the filename
const __dirname = path.dirname(__filename); // Get the directory name
app.use("/imges", express.static(path.join(__dirname, "imges")));
app.use("/reqoreds", express.static(path.join(__dirname, "reqoreds")));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "imges");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
        // req.body.name
    }
});

const storageVoice = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "reqoreds");
    },
    filename: (req, file, cb) => {
        console.log(file.originalname);
        cb(null, file.originalname);
    }
});

const uploadVoice = multer({ storage: storageVoice });


//upload



app.post('/api/uploadVoice', uploadVoice.single("audio"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: '400', message: 'No file uploaded' });
        }



        const newFileName = req.file.originalname;

        return res.status(200).json({ status: '200', message: 'File uploaded!', newFileName });
        } catch (error) {
        console.log(`Error in uploading ${error}`);
        return res.status(500).json({ status: '500', message: 'Internal Server Error' });
    }
});

const uploadIamge = multer({ storage });

app.post('/api/upload', uploadIamge.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: '400', message: 'No file uploaded' });
        }

        return res.status(200).json("File uploaded !");
    } catch (error) {
        console.log(`Error in uploading ${error}`);
        return res.status(500).json({ status: '500', message: 'Internal Server Error' });
    }
});


app.use('/api/auth', routes);
app.use("/api/Users", UserRoute)
app.use("/api/MessageRoute", MessageRoute)
const PORT = 8179;

const server = app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
})


// socket.

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    }
})






//The emit method is used to send messages from the server to the connected clients or from one client to the server.
//The on method is used to listen for events on the client or server side. It allows you to define a callback function that will be executed when a specific event occurs

global.OnlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;

    // emit from the client
    socket.on("add-user", (userid) => {
        OnlineUsers.set(userid, socket.id);
        socket.emit("online", { online: true });
    
    });
    socket.on("check-online", ({ userId }) => {
        const isOnline = OnlineUsers.has(userId);
        socket.emit("online-status", { userId, online: isOnline });
    });

    socket.on("send-meg", async(data) => {
        // here we set the ID of the message, because the socket.
        const sendUserSocket = OnlineUsers.get(data.MessageData.receiverId);
        data.MessageData.id = `${data.MessageData.senderId.slice(0,11)}_${data.MessageData.receiverId.slice(0,11)}_${uuidv4()}`

        if (sendUserSocket) {
            
            socket.to(sendUserSocket).emit('msg-recieve', {
                SendMessageData: data.MessageData 
            });  
        }
        saveMessageToDB(data)
    });
    socket.on("send-Delet",async(data)=>{
        const sendUserSocket = OnlineUsers.get(data.Rec);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('delete-msg', {
                data
            });
        } 
        await SaveDeleteSingleMessage(data.messageID)
    })
    socket.on("disconnect", async() => {
        const userId = [...OnlineUsers.entries()].find(([_, id]) => id === socket.id)?.[0];
        if (userId) {
            OnlineUsers.delete(userId);
            await prisma.user.update({
                where: { id: userId },
                data: { lastseen: new Date() },
            });
            io.emit("user-offline", { userId });
        }
    });
});




async function saveMessageToDB(data){
    try {
        const { receiverId, text, image, senderId,parent,id,Voice} = data.MessageData;
        console.log(data.MessageData);
        const SendMessage = await db.message.create({
            data: {
                id:id,
                text: text,
                image:image,
                Voice,
                sender: {
                    connect: { id: senderId }
                },
                receiver: {
                    connect: { id: receiverId }
                },
                parent:parent.parentID?parent.parentID:null,
                messageStatus: "delivered",
              
            },
            include: { sender: true, receiver: true }
        });
        
        console.log(SendMessage);
        return
    } catch (error) {
        console.log("SENDMESSAGE-POST-SERVER MESSAGE CONTROLLER", error);
   
        return
    }
}



async function SaveDeleteSingleMessage(messageID) {
    try {
        //const userId = req.user.userId;  // we need the sender ID, to insure the message is for him.
        if(!messageID){
            return res.status(200).json({ message: 'IDs is missing' });

        }
      
      
        const updatedMessage = await prisma.message.update({
            where: {
                id: messageID,
                // senderId:userId
            },
            data: {
                isDeleted: true 
            }
        });
        return res.status(200).json({ message: 'Messages deleted successfully' });

    } catch (error) {
        return
    }


}