"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportPhoto() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleUpload() {

        if (!file) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/import-photo", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const result = await response.json();

            sessionStorage.setItem(
                "ocr-result",
                JSON.stringify(result)
            );

            setFile(null);

            router.push("/import-photo/review");
        } catch (err: any) {
            alert(err?.message ?? String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="container">
            <h1>📸 Import Recipe</h1>

            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            {file && <p>Selected: {file.name}</p>}

            <button onClick={handleUpload} disabled={!file || loading}>
                {loading ? "Uploading…" : "Import"}
            </button>
        </main>
    );
}