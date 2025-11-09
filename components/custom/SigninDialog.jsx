// components/custom/SigninDialog.jsx
import React, { useContext, useState } from "react";
import Lookup from "@/data/Lookup";
import { Button } from "../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDetailContext } from "@/context/UserDetailContext";
import axios from "axios";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

const SigninDialog = ({ openDialog, closeDialog }) => {
  const { setUserDetail } = useContext(UserDetailContext);
  const CreateUser = useMutation(api.users.CreateUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("🔐 Google login successful, fetching user info...");
        
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const user = userInfo.data;
        console.log("✅ User info received:", user.email);

        // Create/update user in Convex
        try {
          await CreateUser({
            name: user?.name || "Unknown",
            picture: user?.picture || "",
            email: user?.email,
            uid: user?.sub // Use Google's unique 'sub' ID
          });
          console.log("✅ User created/updated in Convex");
        } catch (convexError) {
          console.error("❌ Convex Mutation Failed:", convexError);
          setError("Failed to save user data. Please try again.");
          setLoading(false);
          return;
        }

        // Save to session
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
          });
          console.log("✅ Session created");
        } catch (sessionError) {
          console.warn("⚠️ Session creation failed:", sessionError);
        }

        // Update context
        setUserDetail(user);
        console.log("✅ User logged in successfully");
        
        // Close dialog
        closeDialog(false);
        setLoading(false);
      } catch (error) {
        console.error("❌ Overall Sign-in Process Failed:", error);
        setError("Sign-in failed. Please try again.");
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("❌ Google Login Error:", errorResponse);
      setError("Google login failed. Please try again.");
      setLoading(false);
    },
  });

  const handleClose = (open) => {
    if (!loading) {
      closeDialog(open);
      setError(null);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{Lookup.SIGNIN_HEADING}</DialogTitle>
          <DialogDescription>{Lookup.SIGNIN_SUBHEADING}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-3">
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <Button 
            className="bg-blue-500 text-white hover:bg-blue-400 mt-3 w-full" 
            onClick={googleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In With Google"
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            {Lookup?.SIGNIn_AGREEMENT_TEXT}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SigninDialog;