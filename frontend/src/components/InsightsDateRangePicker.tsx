// D:\socialadify\frontend\src\components\InsightsDataRangePicker.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, SelectSingleEventHandler } from 'react-day-picker';
import { format, isBefore, isAfter, subDays, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

// --- Icons ---
const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zM9.75 15h.008v.008H9.75v-.008zM9.75 12h.008v.008H9.75v-.008zM15 15h.008v.008H15v-.008zM15 12h.008v.008H15v-.008zM17.25 15h.008v.008H17.25v-.008zM17.25 12h.008v.008H17.25v-.008z" />
    </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

interface Props {
    range: DateRange | undefined;
    onRangeChange: (range: DateRange | undefined) => void;
}

export default function InsightsDateRangePicker({ range, onRangeChange }: Props) {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    
    const startRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);

    // Close popovers when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (startRef.current && !startRef.current.contains(target)) {
                setIsStartOpen(false);
            }
            if (endRef.current && !endRef.current.contains(target)) {
                setIsEndOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle Start Date Selection
    const handleStartSelect: SelectSingleEventHandler = (day) => {
        if (!day) return; 
        
        // Reset the range if starting fresh or just updating start
        let newRange: DateRange = { from: day, to: range?.to };

        // Validation: If new start is after current end, clear the end date
        // We also check the 5-day constraint here
        if (range?.to) {
            const maxDist = Math.abs(day.getTime() - range.to.getTime()) / (1000 * 60 * 60 * 24);
            if (isAfter(day, range.to) || maxDist > 4) {
                newRange.to = undefined;
            }
        }
        
        onRangeChange(newRange);
        setIsStartOpen(false);
        
        // Auto-open end date if we don't have one yet
        if (!newRange.to) {
             setTimeout(() => setIsEndOpen(true), 150);
        }
    };

    // Handle End Date Selection
    const handleEndSelect: SelectSingleEventHandler = (day) => {
        if (!day) return;
        
        let newRange: DateRange = { from: range?.from, to: day };
        
        // Smart Swap: If user picks a date BEFORE the start date, swap them
        // This allows "backward" selection (picking Nov 27 then Nov 23)
        if (range?.from && isBefore(day, range.from)) {
             newRange = { from: day, to: range.from };
        }
        
        onRangeChange(newRange);
        setIsEndOpen(false);
    };

    // Disable Logic for START Date
    const isStartDisabled = (day: Date) => {
        return isAfter(day, new Date()); // Can't pick future dates
    };

    // Disable Logic for END Date
    const isEndDisabled = (day: Date) => {
        if (!range?.from) return true; // Must pick start first
        if (isAfter(day, new Date())) return true; // Future
        
        // 5-Day Max Limit Logic (Bi-directional)
        // Allow picking 4 days before OR 4 days after the start date
        const minDate = subDays(range.from, 4);
        const maxDate = addDays(range.from, 4);

        return isBefore(day, minDate) || isAfter(day, maxDate);
    };

    return (
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {/* --- STYLES --- */}
            <style jsx global>{`
                .dark-datepicker {
                    --rdp-cell-size: 36px;
                    --rdp-caption-font-size: 1rem;
                    --rdp-accent-color: rgb(79 70 229);
                    --rdp-background-color: rgb(100 116 139 / 0.2);
                    --rdp-color: rgb(226 232 240);
                    --rdp-accent-color-dark: var(--rdp-accent-color);
                    background-color: rgb(15 23 42); /* slate-900 */
                    padding: 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid rgb(51 65 85); /* slate-700 */
                }
                .dark-datepicker .rdp-caption_label { color: rgb(241 245 249); font-weight: 600; }
                .dark-datepicker .rdp-nav_button { color: rgb(148 163 184); }
                .dark-datepicker .rdp-nav_button:hover { color: rgb(241 245 249); background-color: rgb(51 65 85); }
                .dark-datepicker .rdp-head_cell { color: rgb(148 163 184); font-size: 0.8rem; font-weight: 500; }
                .dark-datepicker .rdp-day { color: rgb(203 213 225); }
                .dark-datepicker .rdp-day_today { font-weight: 700; color: rgb(234 179 8); }
                
                /* Selected & Hover States */
                .dark-datepicker .rdp-day:hover:not(.rdp-day_disabled) { background-color: rgb(51 65 85); cursor: pointer; }
                .dark-datepicker .rdp-day_selected:not(.rdp-day_disabled) { background-color: var(--rdp-accent-color); color: white; }
                
                /* Disabled State */
                .dark-datepicker .rdp-day_disabled { opacity: 0.25; cursor: not-allowed; color: rgb(100 116 139); }
            `}</style>

            {/* --- Start Date Input --- */}
            <div className="relative w-full sm:w-auto" ref={startRef}>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 ml-1 font-semibold">Start Date</label>
                <button
                    onClick={() => { setIsStartOpen(!isStartOpen); setIsEndOpen(false); }}
                    className={`flex w-full sm:w-44 items-center justify-between px-3 py-2.5 bg-slate-800 border rounded-lg text-sm transition-all ${
                        isStartOpen ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700'
                    }`}
                >
                    <span className={range?.from ? "text-slate-200 font-medium" : "text-slate-500"}>
                        {range?.from ? format(range.from, "MMM dd, yyyy") : "Select Start"}
                    </span>
                    <CalendarIcon className={`w-4 h-4 ${range?.from ? "text-indigo-400" : "text-slate-500"}`} />
                </button>

                {isStartOpen && (
                    <div className="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                        <DayPicker
                            mode="single"
                            selected={range?.from}
                            onSelect={handleStartSelect}
                            disabled={isStartDisabled}
                            required
                            className="dark-datepicker shadow-xl"
                            showOutsideDays
                        />
                    </div>
                )}
            </div>

            {/* --- Separator --- */}
            <div className="hidden sm:flex h-10 items-center justify-center text-slate-600 pt-5">
                <ArrowRightIcon className="w-4 h-4" />
            </div>

            {/* --- End Date Input --- */}
            <div className="relative w-full sm:w-auto" ref={endRef}>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 ml-1 font-semibold">End Date</label>
                <button
                    onClick={() => { setIsEndOpen(!isEndOpen); setIsStartOpen(false); }}
                    disabled={!range?.from}
                    className={`flex w-full sm:w-44 items-center justify-between px-3 py-2.5 bg-slate-800 border rounded-lg text-sm transition-all ${
                        isEndOpen ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700'
                    } ${!range?.from ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className={range?.to ? "text-slate-200 font-medium" : "text-slate-500"}>
                        {range?.to ? format(range.to, "MMM dd, yyyy") : "Select End"}
                    </span>
                    <CalendarIcon className={`w-4 h-4 ${range?.to ? "text-indigo-400" : "text-slate-500"}`} />
                </button>

                {isEndOpen && (
                    <div className="absolute top-fulal right-0 z-50 mt-2 shadow-2xl">
                        <DayPicker
                            mode="single"
                            selected={range?.to}
                            onSelect={handleEndSelect}
                            disabled={isEndDisabled}
                            required
                            defaultMonth={range?.from || new Date()}
                            className="dark-datepicker shadow-xl"
                            showOutsideDays
                            footer={
                                <p className="text-[10px] text-slate-400 mt-2 text-center border-t border-slate-700 pt-2">
                                    Max 5 days from start date
                                </p>
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}