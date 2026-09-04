"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavouriteToggle({ id, initial }: { id: number; initial: boolean }) {
    const [fav, setFav] = useState(initial ?? false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function toggle() {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/recipes/${id}/favourite`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ favourite: !fav }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Failed to toggle favourite:", text);
                alert("Failed to update favourite");
                return;
            }

            setFav((p) => !p);
            // refresh server components
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("Unable to update favourite");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={toggle}
            aria-pressed={fav}
            aria-label={fav ? "Unmark favourite" : "Mark favourite"}
            className="favourite-toggle"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
        >
            {fav ? "❤️" : "🤍"}
        </button>
    );
}
