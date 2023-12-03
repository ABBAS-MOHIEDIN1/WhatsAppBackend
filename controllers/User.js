import { db } from "../utils/PrismaClient.js";

const FetchUsers = async(req, res) => {
    try {
        const userId = req.user.userId;
        const usersWithConversations = await db.user.findMany({
            where: {
                OR: [{
                        receivedMessages: {
                            some: {
                                senderId: userId,
                            },
                        },
                    },
                    {
                        sentMessages: {
                            some: {
                                receiverId: userId,
                            },
                        },
                    },
                ],
            },
            include: {
                receivedMessages: {
                    where: {
                        senderId: userId,
                        isDeleted:false
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                    take: 1,
                },
                sentMessages: {
                    where: {
                        receiverId: userId,
                        isDeleted:false

                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                    take: 1,
                },
            },
        });


        const usersWithData = usersWithConversations
        .map((u) => {
            const lastReceivedMessage = u.receivedMessages ? u.receivedMessages[0] : null;
            const lastSentMessage = u.sentMessages ? u.sentMessages[0] : null;
            // Determine the last message based on the timestamp
            const lastMessage = lastReceivedMessage && lastSentMessage ?
                (lastReceivedMessage.timestamp > lastSentMessage.timestamp ? lastReceivedMessage : lastSentMessage) :
                (lastReceivedMessage || lastSentMessage);

    
            return {
                userData: u,
                lastMessage,
                
            };
        })
        .sort((a, b) => {
            // Sort users based on the timestamp of their last message
            const timestampA = a.lastMessage ? new Date(a.lastMessage.timestamp) : 0;
            const timestampB = b.lastMessage ? new Date(b.lastMessage.timestamp) : 0;
            return timestampB - timestampA; // Sort in descending order
        });
    
    return res.status(200).send(usersWithData);
    
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};







async function EditUser(req, res) {
    try {
        const userId = req.user.userId;

        const { UserData } = req.body;
        const { name, image, about } = UserData






        if (!name || !image ) {
            // Handle case when user is not authenticated
            return res.status(200).json({ error: 'Please provide all required information' });

        }

        const updatedUser = await db.user.update({
            where: {
                id: userId, 
            },
            data: {
                name: name,
                image: image,
                about: about,
                lastseen: new Date(), 

            },
        });

   

        return res.status(200).json({ message: "Update" });

    } catch (error) {
        console.log("Edit user", error);
        return res.status(200).json({ message: "error" });

    }
}


async function SearchUser(req, res) {
    try {
        console.log("hit");
        const profile = req.user.userId;
        const query = req.params.query;


        const users = await db.user.findMany({
            where: {
                id: { not: profile },
                OR: [
                    { name: { startsWith: query, mode: "insensitive" } },
                    { phoneNumber: { startsWith: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
                image: true,
                about: true,
            },
        });


        return res.status(200).json({ users });
    } catch (error) {
        console.log("SearchUser Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export { FetchUsers, EditUser, SearchUser }