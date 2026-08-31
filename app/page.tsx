export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../lib/prisma";

export default async function Home() {
    const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: "desc" } });

    return (
        <main className="container">
            <h1>🍳 RecipeVault</h1>

            <input className="search" type="text" placeholder="Search recipes..." />

            {recipes.map((recipe) => (
                <div key={recipe.id} className="card">
                    {recipe.image && recipe.image.trim() !== "" ? (
                        <div className = "recipe-house" >
                            <img
                                src={recipe.image}
                                alt={recipe.title ?? ""}
                                className = "recipe.image"
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: 200,
                                backgroundColor: "#f3f3f3",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#666",
                                borderRadius: 8,
                            }}
                        >
                            Generating image...
                        </div>
                    )}

                    <div className="card-content">
                        <h2>
                            <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                        </h2>

                        {recipe.description && <p>{recipe.description}</p>}

                        <small>Serves {recipe.servings ?? "N/A"}</small>
                    </div>
                </div>
            ))}

            <nav className="nav">
                <Link href="/">🏠</Link>
                <Link href="/search">🔍</Link>
                <Link href="/add">➕</Link>
                <Link href="/import">🌍</Link>
                <Link href="/import-photo">📸</Link>
                <Link href="/favorites">❤️</Link>
                <Link href="/settings">⚙️</Link>
            </nav>
        </main>
    );
}