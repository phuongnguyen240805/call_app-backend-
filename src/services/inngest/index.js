import { syncUserUpdation, syncUserCreation, syncUserDeletion } from "./user.inngest.js";
import { inngest } from "./inngestClient.js";

export { inngest };

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
]