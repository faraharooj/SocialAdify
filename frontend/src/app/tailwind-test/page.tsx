// D:\socialadify\frontend\app\tailwind-test\page.tsx
'use client'; // If you want to add client-side interactions later, otherwise optional for simple display

import React from 'react';

export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <header className="mb-8 p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-blue-600">Tailwind CSS Test Page</h1>
        <p className="text-gray-700 mt-2">If Tailwind is working, this page will be styled!</p>
      </header>

      <main className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Card 1: Basic Styling */}
        <div className="bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-purple-700 mb-3">Basic Styling</h2>
          <p className="text-gray-600 mb-2">This card should have a white background, padding, rounded corners, and a shadow.</p>
          <button className="mt-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition-colors">
            Styled Button
          </button>
        </div>

        {/* Card 2: Flexbox and Sizing */}
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold text-teal-700 mb-3">Flexbox & Sizing</h2>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              1
            </div>
            <div className="w-20 h-20 bg-yellow-400 rounded-lg flex items-center justify-center text-gray-800 font-bold shadow-md">
              2
            </div>
            <div className="w-24 h-24 bg-indigo-400 rounded-sm flex items-center justify-center text-white font-bold shadow-md">
              3
            </div>
          </div>
        </div>

        {/* Card 3: Responsive Design */}
        <div className="bg-white p-6 rounded-xl shadow-xl md:col-span-2"> {/* Spans 2 columns on md screens and up */}
          <h2 className="text-2xl font-semibold text-pink-700 mb-3">Responsive Test</h2>
          <p className="text-gray-600">
            This section should span two columns on medium screens and wider.
            The text color below should change based on screen size:
          </p>
          <p className="mt-2 text-sm text-blue-500 sm:text-base sm:text-green-500 md:text-lg md:text-red-500 lg:text-xl lg:text-purple-500">
            My color changes! (Blue on xs, Green on sm, Red on md, Purple on lg)
          </p>
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Tailwind Test. All rights reserved (not really).</p>
      </footer>
    </div>
  );
}
