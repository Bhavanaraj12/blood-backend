const { express, bcrypt, logger } = require('../../utils');
const chatTable = require("../../models/chatTB");


const savechat = async (request, response) => {
    try {
        const { message, receiver_id, sender_id, prod_id } = request.body
        if (!message || !receiver_id || !sender_id || !prod_id) {
            return response.status(400).json({
                message: "Required fields are null",
                success: false,
                error: true
            })

        }

        await chatTable.create({ message, receiver_id, sender_id, prod_id, read: "N" })
        response.status(200).json({
            message: "success",
            success: true,
            error: false
        })

    }
    catch (error) {
        logger.error(`Internal server error: ${error.message} in savechat api`);
        response.status(500).json({ error: "An error occurred" })
    }
}

const viewChat = async (request, response) => {
    console.log("viewww", request.body)
    try {
        const { user_id, receiver_id } = request.body;
        const chats = await chatTable.find({ $or: [{ receiver_id }, { sender_id: user_id }] })
            .sort({ createdAt: 'asc' });

        if (!chats || chats.length === 0) {
            return response.status(404).json({
                message: "No chats found for the specified user!",
                success: false,
                error: true
            });
        }


        response.status(200).json({
            message: "Chats retrieved successfully",
            success: true,
            error: false,
            data: chats
        });
    } catch (error) {
        logger.error(`Internal server error: ${error.message} in viewChat api`);
        response.status(500).json({ error: "An error occurred" });
    }
};

//full chat between the users
const fullchat = async (request, response) => {
    console.log("fulll", request.body)
    try {
        const { user1, user2, login_id } = request.body

        if (!user1 || !user2) {
            return response.status(400).json({ error: 'Both user IDs are required!' });
        }
        // Fetch chat messages between the two users
        const chats = await chatTable.find({
            $or: [
                { sender_id: user1, receiver_id: user2 },
                { sender_id: user2, receiver_id: user1 }
            ]
        }).sort({ timestamp: 1 }).populate({
            path: 'receiver_id sender_id',
            select: 'name _id'
        }).populate('prod_id')

        // Mark retrieved messages as read if receiver_id matches login_id
        if (login_id && login_id != '') {
            const chatIds = chats.filter(chat => chat.receiver_id._id == login_id).map(chat => chat._id);
            if (chatIds.length > 0) {
                await chatTable.updateMany(
                    { receiver_id: { $in: chatIds } },
                    { $set: { read: 'Y' } }
                );
            }
        }


        response.status(200).json({
            data: chats,
            message: "success",
            success: true,
            error: false
        });


    }
    catch (error) {
        console.log(error)
        logger.error(`Internal server error: ${error.message} in fullchat api`);
        response.status(500).json({ error: "An error occurred" })
    }
}

// const chatlist = async (request, response) => {
//     const user_id = request.body.user_id;

//     try {
//         if (user_id) {
//             // Find all chats where the sender_id is the given user_id, populate the receiver_id field
//             const chats = await chatTable.find({ sender_id: user_id }).sort({ createdAt: -1 }).populate({
//                 path: 'receiver_id',
//                 select: 'name _id' // Select the fields you want to populate
//             });

//             if (chats.length > 0) {
//                 // Create a map to store unique receiver IDs
//                 const uniqueReceivers = new Map();

//                 // Iterate through chats to extract unique receiver IDs
//                 chats.forEach(chat => {
//                     const receiver_id = chat.receiver_id._id;
//                     // Check if receiver_id is not already present in the map
//                     if (!uniqueReceivers.has(receiver_id)) {
//                         const { sender_id, createdAt, message } = chat;
//                         const receiver_name = chat.receiver_id.name;
//                         const receiverid = chat.receiver_id._id;

//                         uniqueReceivers.set(receiver_id, {
//                             sender_id: sender_id,
//                             receiver_id: receiverid,
//                             receiver_name: receiver_name,
//                             message: message,
//                             created_at: createdAt
//                         });
//                     }
//                 });

//                 // Convert map values to array
//                 const formattedChats = Array.from(uniqueReceivers.values());

//                 response.status(200).json({ chats: formattedChats });
//             } else {
//                 response.status(200).json({ chats: [] }); // No chats found
//             }
//         } else {
//             response.status(400).json({ error: "user_id is required" });
//         }
//     } catch (error) {
//         console.error(error);
//         response.status(500).json({ error: "Internal server error" });
//     }
// }

const chatlist = async (request, response) => {
    const user_id = request.body.user_id;

    try {
        if (user_id) {
            // Find all chats where the sender_id or receiver_id is the given user_id, populate both fields
            const chats = await chatTable.find({
                $or: [
                    { sender_id: user_id },
                    { receiver_id: user_id }
                ]
            })
            // .sort({ createdAt: -1 })
            .sort({ _id: -1 })
            .populate({
                path: 'receiver_id sender_id',
                select: 'name _id'
            }).populate('prod_id');
            console.log({ chats })
            if (chats.length > 0) {
                // Map to store the latest message for each sender-receiver pair
                const latestMessages = new Map();

                // Iterate through chats to find the latest message for each sender-receiver pair
                chats.forEach(chat => {
                    const sender_id = chat.sender_id._id;
                    const receiver_id = chat.receiver_id._id;
                    const message = chat.message;
                    const createdAt = chat.createdAt;

                    // Construct a unique key for sender-receiver pair
                    const key = sender_id < receiver_id ? `${sender_id}-${receiver_id}` : `${receiver_id}-${sender_id}`;

                    // Check if the message for this pair is not already in latestMessages or is newer
                    if (!latestMessages.has(key) || latestMessages.get(key).createdAt < createdAt) {
                        latestMessages.set(key, {
                            sender_id: sender_id,
                            sender_name: chat.sender_id.name,
                            receiver_id: receiver_id,
                            prod_id: chat.prod_id,
                            receiver_name: chat.receiver_id.name,
                            message: message,
                            created_at: createdAt
                        });
                    }
                });

                // Convert map values to array
                const formattedChats = Array.from(latestMessages.values());

                response.status(200).json({ chats: formattedChats });
            } else {
                response.status(200).json({ chats: [] }); // No chats found
            }
        } else {
            response.status(400).json({ error: "user_id is required" });
        }
    } catch (error) {
        logger.error(`Internal server error: ${error.message} in chatlist api`);
        response.status(500).json({ error: "Internal server error" });
    }
}

const readmessage = async (request, response) => {
    try {
        const { id } = request.body
        if (id) {
            const update = await chatTable.update(
                { _id: id },
                { $set: { read: 'Y' } }
            );
            if (update.length > 0) {
                response.status(200).json({
                    message: "success",
                    success: true,
                    error: false
                });
            }
        }
    }
    catch (error) {
        logger.error(`Internal server error: ${error.message} in readmessage api`);
        response.status(500).json({ error: "Internal server error" });

    }
}

















module.exports = { savechat, viewChat, fullchat, chatlist, readmessage }