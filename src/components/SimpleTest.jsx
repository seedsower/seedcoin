import React from 'react';

export default function SimpleTest() {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>SeedCoin Test Page</h1>
            <p>If you can see this, React is working correctly.</p>
            <div style={{ 
                background: '#f0f0f0', 
                padding: '10px', 
                margin: '10px 0',
                borderRadius: '5px'
            }}>
                <h2>Frontend Status</h2>
                <ul>
                    <li>✅ React rendering</li>
                    <li>✅ Vite dev server</li>
                    <li>✅ Basic styling</li>
                </ul>
            </div>
        </div>
    );
}
