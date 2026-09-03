"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
    const [url, setUrl] = useState("");

    const router = useRouter();
    const [importing, setImporting] = useState(false);

    async function importRecipe() {
        if (!url) return alert('Please paste a URL to import');
        setImporting(true);
        const response = await fetch(
            "/api/import",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error(text);
            alert(text);
            setImporting(false);
            return;
        }

        const result = await response.json();

        alert(`Imported: ${result.title}`);

        router.push("/");
        router.refresh();
    }

    return (
        <main className="container">
            <h1>Import Recipe</h1>

            <input
                value={url}
                placeholder="Paste recipe URL"
                onChange={(e) =>
                    setUrl(e.target.value)
                }
            />

            <button onClick={importRecipe} disabled={importing}>
                {importing ? "Importing..." : "Import"}
            </button>
        </main>
    );
}