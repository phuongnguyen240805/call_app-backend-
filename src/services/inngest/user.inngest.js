import { Inngest } from "inngest";
import User from "../../models/User.js";

export const inngest = new Inngest({ id: "video_call_app" });

// Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        try {
            const {
                id,
                first_name,
                last_name,
                email_addresses,
                image_url,
            } = event.data;
            const userData = {
                _id: id,
                email: email_addresses[0].email_address,
                name: first_name + ' ' + last_name,
                image: image_url
            };
            await User.create(userData);
        } catch (error) {
            console.error("Error creating user:", error.message);
        }
    },
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        try {
            const { id } = event.data;
            await User.findByIdAndDelete(id);
        } catch (error) {
            console.error("Error deleting user:", error.message);
        }
    },
);

// Inngest function to update user from database by id
const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        try {
            const {
                id,
                first_name,
                last_name,
                email_addresses,
                image_url,
            } = event.data;
            const userData = {
                _id: id,
                email: email_addresses[0].email_address,
                name: first_name + ' ' + last_name,
                image: image_url
            };
            await User.findByIdAndUpdate(id, userData);
        } catch (error) {
            console.error("Error updating user:", error.message);
        }
    },
);

export {
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
};