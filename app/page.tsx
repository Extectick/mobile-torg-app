import { CatalogView, Container } from '@/components/shared'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  return (
    <Container className="mt-3 scroll-smooth px-4 pb-14 sm:mt-4 sm:px-6 lg:mt-(--page-catalog-top) lg:px-6 xl:px-8 2xl:px-10">
      <Suspense fallback={null}>
        <CatalogView />
      </Suspense>
    </Container>
  )
}
