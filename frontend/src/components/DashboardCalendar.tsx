// D:\socialadify\frontend\src\components\DashboardCalendar.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMonthlyPostStatus, CalendarDayStatus } from '@/services/schedulerService';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// --- STATUS COLORS FOR FULL BLOCKS ---
const getDayClasses = (status: 'uploaded' | 'scheduled' | 'failed' | 'completed' | 'none') => {
    
    // Base classes for a consistent, centered cell (h-10 ensures squareness)
    let classes = "w-full h-10 p-2 rounded-lg transition-colors cursor-pointer text-base font-semibold flex items-center justify-center relative";

    switch(status) {
        case 'failed': 
            // Full red block with white text
            classes += ' bg-red-600 text-white shadow-lg shadow-red-600/50 hover:bg-red-500';
            break;
        case 'scheduled': 
        case 'uploaded': // Treating uploaded/scheduled as the same blue block
            classes += ' bg-blue-600 text-white shadow-lg shadow-blue-600/50 hover:bg-blue-500';
            break;
        case 'completed': 
            // Full green block with white text
            classes += ' bg-green-600 text-white shadow-lg shadow-green-600/50 hover:bg-green-500';
            break;
        default: 
            // Default inactive day style
            classes += ' text-slate-400 hover:bg-slate-400/50';
            break;
    }
    return classes;
}


// Helper to generate the day grid for a month (UNCHANGED)
const getCalendarDays = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); 
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }
    return days;
};

// Define consistent colors for the legend
const LEGEND_COLORS = {
    scheduled: 'bg-blue-600',
    failed: 'bg-red-600',
    completed: 'bg-green-600',
};


export default function DashboardCalendar() {
    const { token, isAuthReady } = useAuth();
    
    const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); 
    const [statusData, setStatusData] = useState<Record<string, CalendarDayStatus>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; 
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const days = useMemo(() => getCalendarDays(year, month), [year, month]);
    
    // --- Data Fetching Effect (UNCHANGED) ---
    useEffect(() => {
        const fetchStatus = async () => {
            if (!token || !isAuthReady) return;
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await getMonthlyPostStatus(token, year, month);
                
                const newStatusMap = response.statuses.reduce((acc, curr) => {
                    acc[curr.date] = curr;
                    return acc;
                }, {} as Record<string, CalendarDayStatus>);

                setStatusData(newStatusMap);
            } catch (err) {
                setError("Failed to load post status.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, [token, isAuthReady, year, month]);
    
    // --- Navigation Handlers (UNCHANGED) ---
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    return (
    <div className="p-4 border-b border-slate-700/50 text-center">
                <h2 className="text-2xl font-bold text-white">Post Status Calendar</h2>
        <div className="bg-slate-800/80 rounded-xl shadow-2xl text-slate-900/80 border-slate-300">
           <div className="text-slate-200 p-4 rounded-xl bg-slate-200 shadow-xl ">
            
            {/* Header and Navigation */}
            <div className="flex justify-center items-center mb-6">
                <span className="font-extrabold text-xl text-slate-800/80">{monthName} {year}</span>
                <div className='flex space-x-2'>
                    <ChevronLeftIcon className='w-5 h-5 cursor-pointer text-slate-800 hover:text-orange-400' onClick={handlePrevMonth} />
                    <ChevronRightIcon className='w-5 h-5 cursor-pointer text-slate-800 hover:text-orange-400' onClick={handleNextMonth} />
                </div>
            </div>

            {isLoading && <div className='text-center text-sm text-slate-400 p-4'>Loading status...</div>}
            {error && <div className='text-center text-sm text-red-400 p-4'>{error}</div>}

            {/* Day Labels - Fixed Key Error */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase text-slate-800 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={index}>{day}</div>)}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="h-10"></div>;
                    }
                    
                    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayStatus = statusData[dateKey];
                    const status = dayStatus ? dayStatus.status : 'none';
                    const count = dayStatus?.count || 0; 
                    
                    
                    return (
                        <div key={dateKey} 
                             // Apply the full color block class (perfectly centered)
                             className={getDayClasses(status)}
                             title={dayStatus ? `${count} post(s) - ${status.charAt(0).toUpperCase() + status.slice(1)}` : 'No activity'}
                        >
                            {day}
                             {/* Small white dot for extra visual weight (optional) */}
                            {status !== 'none' && (
                                <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full border border-slate-900 bg-white`}></span>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Legend - Cleaned up to show only 3 statuses (Scheduled, Failed, Completed) */}
            <div className='mt-6 text-xs font bold flex justify-center space-x-16 text-slate-800/80'>
                <div className='flex items-center'>
                    <span className={`w-2.5 h-2.5 ${LEGEND_COLORS.scheduled} rounded-full mr-2`}></span>Scheduled
                </div>
                <div className='flex items-center'>
                    <span className={`w-2.5 h-2.5 ${LEGEND_COLORS.failed} rounded-full mr-2`}></span>Failed
                </div>
                <div className='flex items-center'>
                    <span className={`w-2.5 h-2.5 ${LEGEND_COLORS.completed} rounded-full mr-2`}></span>Completed
                </div>
            </div>
        </div>
        </div>
        </div>
        
    );
}