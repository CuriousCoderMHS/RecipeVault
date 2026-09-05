"use client";

import { useState } from "react";

export default function ExportToOurGroceries({ id }: { id: number }) {
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/recipes/${id}/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const text = await res.text();
            let json: any = null;
            try {
                json = JSON.parse(text);
            } catch {
                // not JSON (could be HTML error page) - keep text
            }

            if (!res.ok) {
                console.error("Export failed", json ?? text);
                const msg = json?.error || json?.detail || text || "Export failed";
                alert(String(msg));
            } else {
                const successMsg = json?.message || (typeof text === 'string' && text.trim() !== '' ? text : "Exported to OurGroceries");
                alert(String(successMsg));
            }
        } catch (err) {
            console.error(err);
            alert("Export failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            title="Export to OurGroceries"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
        >
            {/* simple cart icon */}
            {loading ? "..." : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M7 4h-2l-1 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 6h2l3.6 7.59a2 2 0 0 0 1.8 1.41H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="20" r="1" fill="currentColor" />
                    <circle cx="18" cy="20" r="1" fill="currentColor" />
                </svg>
            )}
        </button>
    );
}
