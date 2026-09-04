export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../../lib/prisma";
import FavouriteToggle from "../components/FavouriteToggle";

export default async function FavoritesPage() {
    const recipes = await (prisma.recipe as any).findMany({ where: { favourite: true }, orderBy: { createdAt: "desc" } });

    return (
        <main className="container">
            <h1>❤️ Favourite Recipes</h1>

            {recipes.length === 0 ? <p>No favourites yet.</p> : null}

            {recipes.map((recipe) => (
                <div key={recipe.id} className="card">
                    {recipe.image ? (
                        <div className = "recipe-house">
                            <img src={recipe.image} alt={recipe.title ?? ""} className = "recipe.image" />
                        </div>
                    ) : null}

                    <div className="card-content">
                        <h2>
                            <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                        </h2>

                        {recipe.description && <p>{recipe.description}</p>}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <FavouriteToggle id={recipe.id} initial={(recipe as any).favourite} />
                        </div>
                    </div>
                </div>
            ))}

            <nav className="nav">
                <Link href="/">🏠</Link>
                <Link href="/filter">🔍</Link>
                <Link href="/add">➕</Link>
                <Link href="/settings">⚙️</Link>
            </nav>
        </main>
    );
}
