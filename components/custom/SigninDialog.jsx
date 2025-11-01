import React from "react";
import Lookup from "@/data/Lookup";
import { Button } from "../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useContext } from "react";
import axios from "axios";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from 'uuid';

const SigninDialog = ({ openDialog, closeDialog }) => {
  const { setUserDetail } = useContext(UserDetailContext);
  const CreateUser = useMutation(api.users.CreateUser);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const user = userInfo.data;
        
        // 1. --- SAFE CONVEX CALL (WRAPPED IN TRY/CATCH) ---
        try {
            await CreateUser({
                name: user?.name,
                picture: user?.picture,
                email: user?.email,
                // WARNING: uid:uuidv4() will change every time. 
                // Consider letting Convex assign the uid if you don't need a specific external ID.
                uid: user?.sub // Use Google's unique 'sub' ID instead of generating a random one
            });
            console.log("User successfully created/updated in Convex.");
        } catch (convexError) {
            console.error("Convex Mutation Failed:", convexError);
            // We proceed, but the database didn't get the user.
        }
        
        // 2. --- LOCAL STORAGE (Ensures execution even if Convex failed) ---
        // ✅ Corrected typo and ensured execution
        if (typeof window !== 'undefined') {
            // Save the Google user data object
            localStorage.setItem('user', JSON.stringify(user)); 
            console.log("User stored in localStorage.");
        }

        // 3. --- UI UPDATE ---
        setUserDetail(userInfo?.data);
        closeDialog(false);

      } catch (error) {
        console.error("Overall Sign-in Process Failed:", error);
      }
    },
    onError: (errorResponse) => console.log("Google Login Error:", errorResponse),
  });

  return (
    <Dialog open={openDialog} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{Lookup.SIGNIN_HEADING}</DialogTitle>
          <DialogDescription>{Lookup.SIGNIN_SUBHEADING}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-3">
          {/* <h2 className="font-bold text-2xl text-center text-white">
            {Lookup.SIGNIN_HEADING}
          </h2>
          <p className="mt-2 text-center ">{Lookup.SIGNIN_SUBHEADING}</p> */}
          <Button className="bg-blue-500 text-white hover:bg-blue-400 mt-3" onClick={googleLogin}>
            Sign In With Google
          </Button>
          <p>{Lookup?.SIGNIn_AGREEMENT_TEXT} </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SigninDialog;
