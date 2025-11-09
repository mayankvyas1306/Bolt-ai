"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
import { useSidebar } from '../ui/sidebar';
import { MessageCircleCode, Loader2 } from 'lucide-react';

const WorkspaceHistory = () => {
    const { userDetail } = useContext(UserDetailContext);
    const { toggleSidebar } = useSidebar();
    const [isLoading, setIsLoading] = useState(true);

    // Use useQuery hook with proper conditional
    const workspaceList = useQuery(
        api.workspace.GetAllWorkspaces,
        userDetail?._id ? { userId: userDetail._id } : "skip"
    );

    useEffect(() => {
        // Update loading state when data changes
        if (workspaceList !== undefined) {
            setIsLoading(false);
        }
    }, [workspaceList]);

    // Debug logging
    useEffect(() => {
        console.log("📊 Workspace History Debug:", {
            userDetail: userDetail,
            userId: userDetail?._id,
            workspaceList: workspaceList,
            isLoading: isLoading
        });
    }, [userDetail, workspaceList, isLoading]);

    // Show loading state
    if (!userDetail) {
        return (
            <div>
                <h2 className='font-medium text-lg'>Your Chats</h2>
                <p className="text-sm text-gray-500 italic mt-3">Please sign in to view your chats</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div>
                <h2 className='font-medium text-lg'>Your Chats</h2>
                <div className="mt-3 flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Loading chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className='font-medium text-lg'>Your Chats</h2>
            <div className="mt-3 space-y-2">
                {workspaceList && workspaceList.length > 0 ? (
                    workspaceList.map((workspace, index) => {
                        // Get first message content safely
                        const firstMessage = workspace?.messages?.[0]?.content || 'Untitled Workspace';
                        const truncatedMessage = firstMessage.length > 50 
                            ? firstMessage.substring(0, 50) + '...' 
                            : firstMessage;

                        return (
                            <Link 
                                href={'/workspace/' + workspace?._id} 
                                key={workspace?._id || index}
                                onClick={toggleSidebar}
                                className="block"
                            >
                                <div className='flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer group'>
                                    <MessageCircleCode className="h-4 w-4 text-gray-400 group-hover:text-white flex-shrink-0" />
                                    <h2 className='text-sm text-gray-400 font-light group-hover:text-white truncate'>
                                        {truncatedMessage}
                                    </h2>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <p className="text-sm text-gray-500 italic">No conversations yet. Start a new chat!</p>
                )}
            </div>
        </div>
    );
};

export default WorkspaceHistory;