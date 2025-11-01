// This is the logic you MUST have in your users.js
import { v } from "convex/values";
import { mutation,query } from "./_generated/server";


export const CreateUser = mutation({
    // Args must include: name, email, picture, uid
    args: { 
        name: v.string(), 
        email: v.string(), 
        picture: v.string(), 
        uid: v.string() 
     }, 
    handler: async (ctx, args) => {
        // ✅ CRITICAL FIX: Use the index for a safe, fast lookup
        const existingUser = await ctx.db
            .query('users')
            .withIndex('by_email', (q) => q.eq('email', args.email))
            .unique(); // unique() returns one doc or null

        if (existingUser) {
            // User exists, update them
            await ctx.db.patch(existingUser._id, { 
                name: args.name,
                picture: args.picture,
                uid: args.uid 
            });
            return existingUser._id;
        } else {
            // User does not exist, insert them
            const userId = await ctx.db.insert('users', {
                name: args.name,
                picture: args.picture,
                email: args.email,
                uid: args.uid
            });
            return userId;
        }
    }
});

export const GetUser=query({
    args:{
        email:v.string()
    },
    handler:async(ctx,args)=>{
        const user=await ctx.db.query('users').withIndex('by_email',(q)=>q.eq('email',args.email)).unique();
        return user;
    }
})