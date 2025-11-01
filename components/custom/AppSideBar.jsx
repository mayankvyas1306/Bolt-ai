import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import Image from 'next/image'
import { Button } from '../ui/button'
 import { MessageCircleCode } from 'lucide-react'
import WorkspaceHistory from './WorkspaceHistory'
import SideBarFooter from './SideBarFooter'

const AppSideBar = () => {
  return (
    
       <Sidebar>
      <SidebarHeader className="p-5">
        <Image src={"/logo.png"} alt='Logo' width={30} height={30} />
        <Button className="mt-5"><MessageCircleCode/>Start New Chat</Button>

        </SidebarHeader>
      <SidebarContent className="p-5">
        <SidebarGroup >
            <WorkspaceHistory/>
        </SidebarGroup >
        {/* <sidebarGroup/> */}
      </SidebarContent>
      <SidebarFooter>
            <SideBarFooter></SideBarFooter>
        </SidebarFooter>
    </Sidebar>
    
  )
}

export default AppSideBar
