"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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