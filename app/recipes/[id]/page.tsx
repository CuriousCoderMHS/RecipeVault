export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import FavouriteToggle from "../../components/FavouriteToggle";
import ExportToOurGroceries from "../../components/ExportToOurGroceries";
import DeleteButton from "./DeleteButton";

type Props = {
    params: {
        id: string;
    };
};

export default async function RecipePage({ params }: Props) {
    const { id } = await params;

    const recipe = await prisma.recipe.findUnique({
        where: {
            id: Number(id),
        },
    });

    if (!recipe) {
        return (
            <main className="container">
                <h1>Recipe not found</h1>
            </main>
        );
    }

    const samLikes = (recipe as any).samLikes;
    const harrietLikes = (recipe as any).harrietLikes;
    const favourite = (recipe as any).favourite;

    return (
        <main className="container">
            <div className="card">
                {recipe.image && recipe.image.trim() !== "" && (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        style={{ width: "100%", display: "block" }}
                    />
                )}
                <div className="card-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h1 style={{ margin: 0 }}>{recipe.title}</h1>
                        <FavouriteToggle id={recipe.id} initial={favourite} />
                    </div>
                    <p>{recipe.description}</p>
                        <p className="servings">
                        Serves {recipe.servings}
                        {samLikes ? (
                            <Link href="/filter?samLikes=true" title="Show recipes Sam likes" aria-label="Show recipes Sam likes">
                                <span className="like-emoji">👦</span>
                            </Link>
                        ) : null}
                        {harrietLikes ? (
                            <Link href="/filter?harrietLikes=true" title="Show recipes Harriet likes" aria-label="Show recipes Harriet likes">
                                <span className="like-emoji">👧</span>
                            </Link>
                        ) : null}
                        {favourite ? (
                            <Link href="/favorites" title="Show favourite recipes" aria-label="Show favourite recipes">
                                <span className="like-emoji">❤️</span>
                            </Link>
                        ) : null}
                    </p>

                    <h2>Ingredients</h2>

                    <ul>
                        {(recipe.ingredients || "No ingredients supplied")
                            .split("\n")
                            .map((line) => line.replace(/^\s*•\s*/, ""))
                            .filter((line) => line.trim() !== "")
                            .map((ingredient, index) => (
                                <li key={index}>{ingredient}</li>
                            ))}
                    </ul>

                    <h2>Instructions</h2>

                    <ol>
                        {(recipe.instructions || "No instructions supplied")
                            .split("\n")
                            .map((line) => line.replace(/^\s*\d+\.\s*/, ""))
                            .filter((line) => line.trim() !== "")
                            .map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                    </ol>
                </div>
            </div>
            <nav className="nav">
                <Link href="/">🏠</Link>
                <Link href="/filter">🔍</Link>
                <Link href={`/recipes/${recipe.id}/edit`}>📝</Link>
                <ExportToOurGroceries id={recipe.id} />
                <DeleteButton id={recipe.id} />
                <Link href="/settings">⚙️</Link>
            </nav>
        </main>
    );
}