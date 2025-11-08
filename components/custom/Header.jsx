// components/custom/Header.jsx
"use client";
import React, { useContext } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import Colors from "@/data/Colors";
import { UserDetailContext } from "@/context/UserDetailContext";
import { usePathname } from "next/navigation";
import { useSidebar } from "../ui/sidebar";
import { ActionContext } from "@/context/ActionContext";
import { Download, Rocket } from "lucide-react";
import Link from "next/link";

const Header = () => {
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  // NOTE: ActionContext exposes `actions` and `setActions` per your Provider
  const { actions, setActions } = useContext(ActionContext);
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const onActionBtn = (actn) => {
    // Call the function that actually exists (setActions)
    if (typeof setActions === "function") {
      setActions({
        actionType: actn,
        timeStamp: Date.now(),
      });
    } else {
      console.warn("setActions is not a function", setActions);
    }
  };

  return (
    <div className="p-4 flex justify-between items-center">
      <Link href={"/"}>
        <Image src={"/logo.png"} alt="logo" width={40} height={40} />
      </Link>

      {!userDetail?.name ? (
        <div className="flex gap-5">
          <Button variant="ghost">Sign In</Button>
          <Button
            className="text-white"
            style={{
              backgroundColor: Colors.BLUE,
            }}
          >
            Get Started
          </Button>
        </div>
      ) : (
        <div className="flex gap-5 items-center">
          {pathname?.includes("/workspace/") && (
            <>
              <Button variant="ghost" onClick={() => onActionBtn("export")}>
                <Download /> Export
              </Button>
              <Button
                onClick={() => onActionBtn("deploy")}
                className="text-white"
                style={{
                  backgroundColor: Colors.BLUE,
                }}
              >
                <Rocket /> Deploy
              </Button>
            </>
          )}
          {userDetail && (
            <Image
              onClick={toggleSidebar}
              src={userDetail?.picture}
              alt="userImage"
              width={40}
              height={40}
              className="rounded-full cursor-pointer object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Header;
