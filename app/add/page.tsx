"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function AddRecipe() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [ingredients, setIngredients] = useState("");

    const [instructions, setInstructions] = useState("");

    const [image, setImage] = useState("");

    const [servings, setServings] = useState(4);
    const [samLikes, setSamLikes] = useState(false);
    const [harrietLikes, setHarrietLikes] = useState(false);

    const [saving, setSaving] =
        useState(false);

    const ingredientsRef =
        useRef<HTMLTextAreaElement>(null);

    const instructionsRef =
        useRef<HTMLTextAreaElement>(null);


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

        try {
            setSaving(true);

            const response =
                await fetch("/api/recipes", {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        ingredients,
                        instructions,
                        image,
                        servings,
                    }),
                });

            if (!response.ok) {
                throw new Error(
                    "Failed to save recipe"
                );
            }

            router.push("/");
            router.refresh();
        } catch (error) {
            console.error(error);

            alert(
                "Unable to save recipe"
            );
        } finally {
            setSaving(false);
        }
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
            <h1>Add Recipe</h1>

            <form onSubmit={handleSubmit}>
                <p>
                    <label>Image URL</label>
                    <br />
                    <input
                        type="text"
                        value={image}
                        onChange={(e) =>
                            setImage(
                                e.target.value
                            )
                        }
                    />
                </p>

                {image && (
                    <div className = "recipe-house">
                        <img
                            className = "recipe.image"
                            src={image}
                            alt="Preview"
                            style={{ width: "100%", display: "block", marginBottom: 8 }}
                            onError={(e) => {
                                // hide broken image by clearing src
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    </div>
                )}

                <p>
                    <label>Title</label>
                    <br />
                    <input
                        type="text"
                        value={title}
                        required
                        onChange={(e) =>
                            setTitle(
                                e.target.value
                            )
                        }
                    />
                </p>

                <p>
                    <label>
                        Description
                    </label>
                    <br />
                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                    />
                </p>

                <p>
                    <label>Servings</label>
                    <br />
                    <input
                        type="number"
                        min="1"
                        value={servings}
                        onChange={(e) =>
                            setServings(
                                Number(
                                    e.target.value
                                )
                            )
                        }
                    />
                </p>

                <p>
                    <label>
                        Ingredients
                    </label>
                    <br />
                    <textarea
                        ref={ingredientsRef}
                        value={ingredients}
                        onChange={(e) => {
                            setIngredients(e.target.value);
                            autoGrow(e.target);
                        }}
                        onKeyDown={ingredientKeyDown}
                        rows={1}
                    />
                </p>

                <p>
                    <label>
                        Instructions
                    </label>
                    <br />
                    <textarea
                        ref={instructionsRef}
                        value={instructions}
                        onChange={(e) => {
                            setInstructions(e.target.value);
                            autoGrow(e.target);
                        }}
                        onKeyDown={instructionKeyDown}
                        rows={1}
                    />
                </p>
                <p>
                    <label>
                        <input
                            type="checkbox"
                            checked={samLikes}
                            onChange={(e) => setSamLikes(e.target.checked)}
                        /> Sam likes
                    </label>
                    <br />
                    <label>
                        <input
                            type="checkbox"
                            checked={harrietLikes}
                            onChange={(e) => setHarrietLikes(e.target.checked)}
                        /> Harriet likes
                    </label>
                </p>

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Recipe"}
                </button>
            </form>

            <nav className="nav">
                <Link href="/">🏠</Link>
                <Link href="/filter">🔍</Link>
                <Link href="/add">➕</Link>
                <Link href="/settings">⚙️</Link>
            </nav>
        </main>
    );
}