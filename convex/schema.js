// This is the required schema structure
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users:defineTable({
        name:v.string(),
        email:v.string(),
        picture:v.string(),
        uid:v.string()
    })
    // ✅ CRITICAL FIX: The index must be here
    .index("by_email", ["email"]),
    workspace:defineTable({
        messages:v.any(),//JSON object
        fileData:v.optional(v.any()),//file data can be optional
        user:v.id('users')

    })
});