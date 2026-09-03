"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";

interface Recipe {
    id: number;
    title: string;
    description: string | null;
    ingredients: string | null;
    instructions: string | null;
    image: string | null;
    servings: number | null;
}

export default function EditRecipeForm({
    recipe,
}: {
    recipe: Recipe;
}) {
    const router = useRouter();

    const [title, setTitle] = useState(recipe.title);
    const [description, setDescription] = useState(recipe.description ?? "");
    const [ingredients, setIngredients] = useState(recipe.ingredients ?? "");
    const [instructions, setInstructions] = useState(recipe.instructions ?? "");
    const [image, setImage] = useState(
        recipe.image ?? ""
    );
    const [servings, setServings] = useState(
        recipe.servings ?? 4
    );
    const ingredientsRef = useRef<HTMLTextAreaElement>(null);
    const instructionsRef = useRef<HTMLTextAreaElement>(null);

    // ensure textareas resize to fit existing content on mount and when values change
    useEffect(() => {
        if (ingredientsRef.current) {
            autoGrow(ingredientsRef.current);
        }
    }, [ingredients]);

    useEffect(() => {
        if (instructionsRef.current) {
            autoGrow(instructionsRef.current);
        }
    }, [instructions]);

    function cleanForStorage(text: string) {
        return text
            .split("\n")
            .map((line) =>
                line
                    .replace(/^\s*•\s*/, "")
                    .replace(/^\s*\d+\.\s*/, "")
                    .trim()
            )
            .filter((l) => l !== "")
            .join("\n");
    }

    function formatForEditingIngredients(text: string | null) {
        if (!text) return "• ";

        return text
            .split("\n")
            .map((line) => `• ${line}`)
            .join("\n");
    }

    function formatForEditingInstructions(text: string | null) {
        if (!text) return "1. ";

        return text
            .split("\n")
            .map((line, idx) => `${idx + 1}. ${line}`)
            .join("\n");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const response = await fetch(`/api/recipes/${recipe.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description,
                ingredients: cleanForStorage(ingredients),
                instructions: cleanForStorage(instructions),
                image,
                servings,
            }),
        });

        if (!response.ok) {
            alert("Failed to update recipe");
            return;
        }

        router.push(`/recipes/${recipe.id}`);
        router.refresh();
    }

    function ingredientKeyDown(
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) {
        if (e.key === "Enter") {
            e.preventDefault();

            setIngredients(
                (prev) => prev + "\n• "
            );
        }
    }

    function instructionKeyDown(
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) {
        if (e.key === "Enter") {
            e.preventDefault();

            const count =
                instructions
                    .split("\n")
                    .filter(
                        (line) =>
                            line.trim() !== ""
                    ).length + 1;

            setInstructions(
                (prev) =>
                    prev + `\n${count}. `
            );
        }
    }

    function autoGrow(
        textarea: HTMLTextAreaElement
    ) {
        textarea.style.height = "auto";
        textarea.style.height =
            textarea.scrollHeight + "px";
    }

    return (
        <main className="container">
            <h1>Edit Recipe</h1>

            <form onSubmit={handleSubmit}>
                <p>
                    <label>Image URL</label>
                    <br />
                    <input
                        value={image}
                        onChange={(e) =>
                            setImage(e.target.value)
                        }
                    />
                </p>

                <p>
                    <label>Title</label>
                    <br />
                    <input
                        value={title}
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                    />
                </p>

                <p>
                    <label>Description</label>
                    <br />
                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                    />
                </p>

                <p>
                    <label>Servings</label>
                    <br />
                    <input
                        type="number"
                        value={servings}
                        onChange={(e) =>
                            setServings(
                                Number(e.target.value)
                            )
                        }
                    />
                </p>

                <p>
                    <label>Ingredients</label>
                    <br />
                    <textarea
                        ref={ingredientsRef}
                        rows={8}
                        value={ingredients}
                        onChange={(e) => {
                            setIngredients(e.target.value);
                            autoGrow(e.target);
                        }}
                        onKeyDown={ingredientKeyDown}
                    />
                </p>

                <p>
                    <label>Instructions</label>
                    <br />
                    <textarea
                        ref={instructionsRef}
                        rows={10}
                        value={instructions}
                        onChange={(e) => {
                            setInstructions(e.target.value);
                            autoGrow(e.target);
                        }}
                        onKeyDown={instructionKeyDown}
                    />
                </p>

                <div className="form-buttons">
                    <button type="submit">Save Changes</button>

                    <Link href={`/recipes/${recipe.id}`} className="cancel-button">
                        Cancel
                    </Link>
                </div>
            </form>
        </main>
    );
}