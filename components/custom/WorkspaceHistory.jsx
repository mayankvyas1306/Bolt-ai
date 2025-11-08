"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import React, { useContext } from 'react';
import { useSidebar } from '../ui/sidebar';
import { MessageCircleCode } from 'lucide-react';

const WorkspaceHistory = () => {
    const { userDetail } = useContext(UserDetailContext);
    const { toggleSidebar } = useSidebar();

    // Use useQuery hook instead of manual convex.query
    const workspaceList = useQuery(
        api.workspace.GetAllWorkspaces,
        userDetail?._id ? { userId: userDetail._id } : "skip"
    );

    return (
        <div>
            <h2 className='font-medium text-lg'>Your Chats</h2>
            <div className="mt-3 space-y-2">
                {workspaceList && workspaceList.length > 0 ? (
                    workspaceList.map((workspace, index) => (
                        <Link 
                            href={'/workspace/' + workspace?._id} 
                            key={index}
                            onClick={toggleSidebar}
                            className="block"
                        >
                            <div className='flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer group'>
                                <MessageCircleCode className="h-4 w-4 text-gray-400 group-hover:text-white" />
                                <h2 className='text-sm text-gray-400 font-light group-hover:text-white truncate'>
                                    {workspace?.messages[0]?.content}
                                </h2>
                            </div>
                        </Link>
                    ))
                ) : workspaceList === undefined ? (
                    <p className="text-sm text-gray-500 italic">Loading...</p>
                ) : (
                    <p className="text-sm text-gray-500 italic">No conversations yet</p>
                )}
            </div>
        </div>
    );
};

export default WorkspaceHistory;