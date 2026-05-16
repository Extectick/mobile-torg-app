export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <p>Product {id}</p>
    )
}
