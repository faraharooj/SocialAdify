     // D:\socialadify\frontend\src\app\simpletest\page.tsx
     'use client';

     import React from 'react';

     export default function SimpleTestPage() {
       console.log("SimpleTestPage rendering!");
       return (
         <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#e6f7ff' }}>
           <h1>Simple Test Page</h1>
           <p>If you can see this, basic App Router functionality is working for new routes.</p>
           <p>Current time: {new Date().toLocaleTimeString()}</p>
         </div>
       );
     }
     