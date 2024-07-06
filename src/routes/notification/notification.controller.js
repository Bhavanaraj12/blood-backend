const { express, bcrypt, logger, assert, istDate } = require('../../utils');
const UsersTable = require("../../models/usersTB");
const NotificationTable = require("../../models/notificationTB");


const renttimeleftnotification = async (request, response) => {
    try {
        const find = await find();
        // console.log("renttimeenotificationnnn")
        for (let i = 0; i < find.length; i++) {
            const start_date = new Date(find[i]?.start_date);
            const end_date = new Date(find[i]?.end_date);
            const currentDate = new Date(istDate);
            const customer_id = find[i]?.customer_id;

            if (currentDate > start_date && currentDate < end_date) {
                // console.log("inloop")
                const timeDiff = end_date.getTime() - currentDate.getTime();
                const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                const oneDayInMillis = 24 * 60 * 60 * 1000;
                const daysBetween = Math.abs(end_date.getTime() - start_date.getTime());
                // console.log({daysBetween})


                if (daysBetween > oneDayInMillis) {
                    time_left = `${hoursLeft} hours ${minutesLeft} minutes left`
                    if (hoursLeft == 24 && minutesLeft == 0) {
                        const add = await NotificationTable.create({
                            message: `24 hours left`,
                            send_to: customer_id,
                            read: "N",
                            type: "Rent"
                        });
                    }
                    else if (hoursLeft == 1 && minutesLeft == 0) {
                        console.log("hoursleftttoneeeeeee!!!!!!!!!!!!!111")
                        const add = await NotificationTable.create({
                            message: `1 hour left`,
                            send_to: customer_id,
                            read: "N",
                            type: "Rent"
                        });
                    }
                    else if(hoursLeft == 0 && minutesLeft == 0){
                        const add = await NotificationTable.create({
                            message: `Rent finished`,
                            send_to: customer_id,
                            read: "N",
                            type: "Rent"
                        });
                        // const updatedProduct = await ProductsTable.findByIdAndUpdate(
                        //     prod_id,
                        //     { $set: { rent_status: false } }
                        // );
                    }
                } else {
                    time_left = `${hoursLeft} hours ${minutesLeft} minutes left`;

                    if (hoursLeft == 1 && minutesLeft == 0) {
                        console.log("onehourleft")
                        const add = await NotificationTable.create({
                            message: `1 hour left`,
                            send_to: customer_id,
                            read: "N",
                            type: "Rent"
                        });
                    }
                    else if (hoursLeft == 0 && minutesLeft == 0) {
                        console.log("rentfinishedd")
                        const add = await NotificationTable.create({
                            message: `Rent finished`,
                            send_to: customer_id,
                            read: "N",
                            type: "Rent"
                        });
                        // const updatedProduct = await ProductsTable.findByIdAndUpdate(
                        //     prod_id,
                        //     { $set: { rent_status: false } }
                        // );

                    }
                }
            }
        }

    } catch (error) {
        logger.error(`Internal server error: ${error.message} in renttimeleftnotification api`);
        console.error("Error:", error);
    }
};

const rentchangestatus = async (request, response) => {
    try {
        const find = await RentTable.find().populate('prod_id');
      
        if (find.length > 0) {
            for (let i = 0; i < find.length; i++) {
                if (find[i].rent_status !== "finished") {
                   
                    const start_date = new Date(find[i].start_date);
                    const end_date = new Date(find[i].end_date);
                    const currentDate = new Date();

                    let rent_status = "";
                    let time_left = "";
                    const prod_id = find[i].prod_id?._id;
                    // console.log({ prod_id });
                    if (currentDate > start_date && currentDate < end_date) {
                        rent_status = "ongoing";
                        // Calculate time left
                        const timeDiff = end_date.getTime() - currentDate.getTime();
                        const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
                        const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        time_left = `${hoursLeft} hours ${minutesLeft} minutes left`;
                    } else if (currentDate > end_date) {
                        rent_status = "finished";
                        time_left = "Rent finished";
                        // const updatedProduct = await ProductsTable.findByIdAndUpdate(
                        //     prod_id,
                        //     { $set: { rent_status: false } }
                        // );
                    } else {
                        rent_status = "rented";
                        const timeDiff = start_date.getTime() - currentDate.getTime();
                        const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
                        const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        time_left = `${hoursLeft} hours ${minutesLeft} minutes until rent starts`;
                    }

                    await RentTable.findByIdAndUpdate(find[i]._id, { rent_status, time_left });
                }
            }
        }
    } catch (error) {
        console.error(error);
        logger.error(`Internal server error: ${error.message} in rented_data API`);
    }
}

const cus_getnotification = async (request, response) => {
    try {
        const user_id = request.body.user_id
        if (user_id) {
            const get = await NotificationTable.find({ send_to: user_id }).sort({ createdAt: -1 });

            if (get.length > 0) {
                response.status(200).json({
                    data: get,
                    success: true,
                    error: false
                })
            }
            else {
                response.status(404).json({
                    message: "No more notification!",
                    success: false,
                    error: true
                })

            }
        }
    }
    catch (error) {
        logger.error(`Internal server error: ${error.message} in cus_getnotification api`);
        response.status(500).json({ error: "An error occurred" });

    }
}

const readnotification = async (request, response) => {
    console.log("readnottttt")
    try {
        const notification_id = request.body.id
        if (notification_id) {
            const read = await NotificationTable.findByIdAndUpdate({ _id: notification_id },
                { $set: { read: "Y" } },
                { new: true }
            )
            response.status(200).json({
                success: true,
                error: false
            })
        }
    }
    catch (error) {
        logger.error(`Internal server error: ${error.message} in readnotification api`);
        response.status(500).json({ error: "An error occurred" });
    }
}

const deletenotification = async (request, response) => {
    try {
        const notification_id = request.body.notification_id
        if (notification_id) {
            const read = await NotificationTable.findByIdAndDelete({ _id: notification_id },
                { $set: { read: "Y" } },
                { new: true }
            )
            console.log("read", read)
            if (read) {
                response.status(200).json({
                    message: "successfully deleted",
                    success: true,
                    error: false
                })
            }
        }
    }
    catch (error) {
        logger.error(`Internal server error: ${error.message} in deletenotification api`);
        response.status(500).json({ error: "An error occurred" });
    }
}




module.exports = { cus_getnotification, readnotification, renttimeleftnotification, deletenotification, rentchangestatus }