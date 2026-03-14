import React from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';

export const MCPImportButton = ({ profileId, onRefresh }: { profileId: string, onRefresh: () => void }) => {
    const handleImport = async () => {
        const data = window.prompt("Paste the JSON array from your Claude/Indeed search here:");
        if (!data) return;
        try {
            const jobs = JSON.parse(data);
            await axios.post(`${API_BASE}/api/jobs/ingest-mcp`, { profileId, jobs });
            alert("✅ Holistic leads added to Railway!");
            onRefresh();
        } catch (e) {
            alert("❌ Invalid JSON. Ask Claude for the 'Career OS JSON Array'.");
        }
    };

    return (
        <button onClick={handleImport} className="ml-4 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 transition">
            🚀 Import Holistic Data
        </button>
    );
};
