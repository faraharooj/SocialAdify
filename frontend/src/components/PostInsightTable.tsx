'use client';

import React from 'react';
// We import the 'PostInsight' type we defined in our service.
import { PostInsight }from '@/services/socialInsightsService';
import { format } from 'date-fns';

// --- Icons for the table ---
const ReachIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372m-1.74-1.121a5.25 5.25 0 01-1.172-1.651M12 10.5h.008v.008H12v-.008z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const ImpressionsIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EngagementIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.5-2.5m2.5 2.5l-2.5 2.5M15.042 21.672L13.684 16.6m0 0l-2.5-2.5m2.5 2.5l-2.5 2.5M15.042 21.672L13.684 16.6m0 0l-2.5-2.5m2.5 2.5l-2.5 2.5M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const LikeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.832 0 1.5.668 1.5 1.5v3.75m0 0v3.75m0-3.75h-1.5m1.5 0h.008v.008h-.008v-.008zm0 0c.002 0 .004 0 .006 0m0 0c.002 0 .004 0 .006 0m0 0c.002 0 .004 0 .006 0m-2.25-4.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h.008v.008H8.25v-.008zM4.875 15c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 19.875v-3.75c0-.621.504-1.125 1.125-1.125h.75zM8.25 15h2.25M8.25 18h2.25M12 15h3.75M12 18h3.75M16.5 15h2.25M16.5 18h2.25M19.125 8.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-.75M19.125 8.25A2.25 2.25 0 0016.875 6H12M19.125 8.25v.008h.008v-.008H19.125zM12 6a2.25 2.25 0 00-2.25 2.25v3.75c0 .621.504 1.125 1.125 1.125h.75m0-3.75A2.25 2.25 0 009.75 6H8.25A2.25 2.25 0 006 8.25v3.75c0 .621.504 1.125 1.125 1.125h.75m0-3.75h.008v.008H8.25v-.008z" />
    </svg>
);

// Helper function to format large numbers
const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
};

// Main component
interface PostInsightsTableProps {
    posts: PostInsight[];
}

export default function PostInsightsTable({ posts }: PostInsightsTableProps) {
    if (!posts || posts.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-slate-400">No posts found for the selected date range.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto relative">
            <table className="w-full min-w-[640px] text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">
                            Post
                        </th>
                        <th scope="col" className="px-6 py-3 text-center">
                            Reach
                        </th>
                        <th scope="col" className="px-6 py-3 text-center">
                            Impressions
                        </th>
                        <th scope="col" className="px-6 py-3 text-center">
                            Engagement
                        </th>
                        <th scope="col" className="px-6 py-3 text-center">
                            Reactions
                        </th>
                        <th scope="col" className="px-6 py-3 rounded-r-lg text-center">
                            Comments
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map((post) => (
                        <tr key={post.post_id} className="bg-slate-800/60 border-b border-slate-700 hover:bg-slate-700/60 transition-colors">
                            <td scope="row" className="px-6 py-4 max-w-sm">
                                <p className="font-medium text-slate-100 truncate mb-1" title={post.message}>
                                    {post.message ? `${post.message.substring(0, 100)}...` : '(No Text Content)'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {format(new Date(post.created_time), 'MMM dd, yyyy - hh:mm a')}
                                </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-indigo-300">
                                    <ReachIcon className="w-4 h-4" />
                                    <span className="font-semibold">{formatNumber(post.reach)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-cyan-300">
                                    <ImpressionsIcon className="w-4 h-4" />
                                    <span className="font-semibold">{formatNumber(post.impressions)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-green-300">
                                    <EngagementIcon className="w-4 h-4" />
                                    <span className="font-semibold">{formatNumber(post.engagement)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-pink-300">
                                    <LikeIcon className="w-4 h-4" />
                                    <span className="font-semibold">{formatNumber(post.reactions.total)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-slate-200">{formatNumber(post.comments)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}