"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({
    id,
}: {
    id: number;
}) {
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Delete recipe?")) {
            return;
        }

        await fetch(`/api/recipes/${id}`, {
            method: "DELETE",
        });

        router.push("/");
    }

    return (
        <button onClick={handleDelete}>
            🗑️
        </button>
    );
}