export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../lib/prisma";

export default async function Home() {
    const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: "desc" } });

    return (
        <main className="container">
            <h1>🍳 RecipeVault</h1>

            <form action="/filter" method="get">
                <input name="keywords" className="search" type="text" placeholder="Search recipes..." />
            </form>

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

                        <small className="servings">
                            Serves {recipe.servings ?? "N/A"}
                            {(recipe as any).samLikes ? (
                                <Link href={`/filter?samLikes=true`} title="Show recipes Sam likes" aria-label="Show recipes Sam likes">
                                    <span className="like-emoji">👦</span>
                                </Link>
                            ) : null}
                            {(recipe as any).harrietLikes ? (
                                <Link href={`/filter?harrietLikes=true`} title="Show recipes Harriet likes" aria-label="Show recipes Harriet likes">
                                    <span className="like-emoji">👧</span>
                                </Link>
                            ) : null}
                        </small>
                    </div>
                </div>
            ))}

            <nav className="nav">
                <Link href="/">🏠</Link>
                <Link href="/filter">🔍</Link>
                <Link href="/add">➕</Link>
                <Link href="/import">🌍</Link>
                <Link href="/import-photo">📸</Link>
                <Link href="/favorites">❤️</Link>
                <Link href="/settings">⚙️</Link>
            </nav>
        </main>
    );
}