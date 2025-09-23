import { syncUserUpdation, syncUserCreation, syncUserDeletion } from "./user.inngest.js";
import { inngest } from "./user.inngest.js";

export { inngest }

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
]