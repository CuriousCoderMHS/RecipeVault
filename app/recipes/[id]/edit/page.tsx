import { prisma } from "../../../../lib/prisma";
import EditRecipeForm from "./recipe-form";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditPage({
    params,
}: Props) {
    const { id } = await params;

    const recipe =
        await prisma.recipe.findUnique({
            where: {
                id: Number(id),
            },
        });

    if (!recipe) {
        return <h1>Recipe not found</h1>;
    }

    return (
        <EditRecipeForm recipe={recipe} />
    );
}