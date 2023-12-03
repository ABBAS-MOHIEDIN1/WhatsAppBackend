import { db } from "../utils/PrismaClient.js";



// fetch the emsssage nad then update the message status, to read.
async function FetchMessages(req, res) {
    const receiver = req.params.id;
    const userId = req.user.userId;

    if (!receiver) {
        return res.status(400).json({ error: 'Please provide all required information' });
    }

    try {
        const messages = await db.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: receiver },
                    { senderId: receiver, receiverId: userId },
                ],
            },
            orderBy: {
                timestamp: 'asc',
            },
            take: 50, // temp, implment fetch on scroll.
        });

        const receiverPerson = await db.user.findUnique({
            where: { id: receiver },
        });
        if (messages.length === 0) {
            return res.status(200).json({ error: 'No current Chats.',receiverPerson });
        }

        const unreadMessages = [];

        for (const [index, message] of messages.entries()) {
            if (message.messageStatus !== "read" && message.senderId === receiver) {
                messages[index].messageStatus = "read";
                unreadMessages.push(message.id);
            }

            if (message.parent) {
                const parentMessage = await db.message.findUnique({
                    where: {
                        id: message.parent,
                    },
                    orderBy: {
                        id: "asc",
                    },
                });

                messages[index].parent = parentMessage;
                unreadMessages.push(message.id);
            }
        }

        await db.message.updateMany({
            where: {
                id: { in: unreadMessages },
            },
            data: {
                messageStatus: "read",
            },
        });

    
        return res.status(200).json({ messages, receiverPerson });
    } catch (error) {
        console.log(`Error in FetchMessages function: ${error}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}



// sned messsage 
async function sendMessage(req, res) {

    try {
        const userId = req.user.userId;
        const { SendMessageData } = req.body
        const { to, text, img } = SendMessageData

        




        const SendMessage = await db.message.create({
            data: {
                text: text,
                sender: { connect: { id: userId } },
                receiver: {
                    connect: { id: to }
                },
                messageStatus: "delivered",
            },
            include: { sender: true, receiver: true }
        })


        return res.status(200).json(SendMessage);






    } catch (error) {
        console.log("SENDMESSAGE-POST-SERVER MESSAGE CONTROLLER", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}






// later: make the delete from one side not both.
async function DeleteMessages(req,res){
    try {
        const CurrentUser = req.user.userId;
        const to = req.params.id
        if(!to){
            return res.status(200).json({ message: 'ID is missing' });

        }
        await prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: CurrentUser, receiverId: to },
                    { senderId: to, receiverId: CurrentUser }
                ]
            }
        });
       return res.status(200).json({ message: 'Messages deleted successfully' });

    } catch (error) {
        console.log(error);
        return
    }
}
export { FetchMessages, sendMessage,DeleteMessages }