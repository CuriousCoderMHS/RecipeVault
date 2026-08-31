"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReviewPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] =
        useState("");

    const [category, setCategory] =
        useState("");

    const [cuisine, setCuisine] =
        useState("");

    const [servings, setServings] =
        useState(4);

    const [imagePrompt, setImagePrompt] =
        useState("");

    const [ingredients, setIngredients] =
        useState("");

    const [instructions, setInstructions] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        const stored =
            sessionStorage.getItem(
                "ocr-result"
            );

        if (!stored) {
            router.push("/import-photo");
            return;
        }

        const data = JSON.parse(stored);

        setTitle(data.title || "");
        setDescription(
            data.description || ""
        );

        setCategory(
            data.category || ""
        );

        setCuisine(
            data.cuisine || ""
        );

        setServings(
            Number(data.servings) || 4
        );

        setImagePrompt(
            data.imagePrompt || ""
        );

        setIngredients(
            data.ingredients || ""
        );

        setInstructions(
            data.instructions || ""
        );
    }, [router]);

    async function handleSave(
        e: React.FormEvent
    ) {
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
                        category,
                        cuisine,
                        servings,
                        imagePrompt,
                        ingredients,
                        instructions,
                        image: null,
                    }),
                });

            if (!response.ok) {
                throw new Error(
                    "Failed to save recipe"
                );
            }

            const recipe =
                await response.json();

            /* fetch(
                "/api/generate-image",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        recipeId: recipe.id,
                    }),
                }
            ); */

            sessionStorage.removeItem("ocr-result");

            router.push("/");
            router.refresh();
        } catch (error) {
            console.error(error);

            alert(
                "Failed to save recipe"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="container">
            <h1>Review Imported Recipe</h1>

            <form onSubmit={handleSave}>
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
                        rows={3}
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                    />
                </p>

                <p>
                    <label>Category</label>
                    <br />
                    <input
                        value={category}
                        onChange={(e) =>
                            setCategory(
                                e.target.value
                            )
                        }
                    />
                </p>

                <p>
                    <label>Cuisine</label>
                    <br />
                    <input
                        value={cuisine}
                        onChange={(e) =>
                            setCuisine(
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
                        Image Prompt
                    </label>
                    <br />
                    <textarea
                        rows={5}
                        value={imagePrompt}
                        onChange={(e) =>
                            setImagePrompt(
                                e.target.value
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
                        rows={10}
                        value={ingredients}
                        onChange={(e) =>
                            setIngredients(
                                e.target.value
                            )
                        }
                    />
                </p>

                <p>
                    <label>
                        Instructions
                    </label>
                    <br />
                    <textarea
                        rows={12}
                        value={instructions}
                        onChange={(e) =>
                            setInstructions(
                                e.target.value
                            )
                        }
                    />
                </p>

                <div className="form-buttons">
                    <button
                        type="submit"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Recipe"}
                    </button>

                    <Link
                        href="/import-photo"
                        className="cancel-button"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </main>
    );
}