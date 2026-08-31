import Link from "next/link";
import { prisma } from "../../../lib/prisma";
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
                    <h1>{recipe.title}</h1>
                    <p>{recipe.description}</p>
                    <p>Servings: {recipe.servings}</p>

                    <h2>Ingredients</h2>

                    <ul>
                        {(recipe.ingredients || "No ingredients supplied")
                            .split("\n")
                            .filter((line) => line.trim() !== "")
                            .map((ingredient, index) => (
                                <li key={index}>{ingredient}</li>
                            ))}
                    </ul>

                    <h2>Instructions</h2>

                    <ol>
                        {(recipe.instructions || "No instructions supplied")
                            .split("\n")
                            .filter((line) => line.trim() !== "")
                            .map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                    </ol>
                </div>
            </div>
            <nav className="nav">
                <Link href="/">🏠</Link>
                <Link href={`/recipes/${recipe.id}/edit`}>📝</Link>
                <DeleteButton id={recipe.id} />
                <Link href="/settings">⚙️</Link>
            </nav>
        </main>
    );
}