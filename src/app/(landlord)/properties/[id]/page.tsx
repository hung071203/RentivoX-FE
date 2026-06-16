interface Props {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div>
      <h1 className="text-2xl font-semibold">Chi tiết dãy nhà trọ</h1>
      <p className="text-muted-foreground text-sm mt-1">ID: {id}</p>
    </div>
  )
}
