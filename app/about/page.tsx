import { Container } from '@/components/shared'
import { Title } from '@/components/shared/title'

export default function AboutPage() {
  return (
    <Container className="px-4 py-10 sm:px-6 lg:px-0">
      <div className="max-w-3xl">
        <Title text="О компании" size="lg" className="font-extrabold" />
        <p className="mt-4 text-gray-600">
          Лидер Продукт поставляет продукты для дома и бизнеса. Здесь появится информация о компании,
          условиях работы, качестве продукции и географии доставки.
        </p>
      </div>
    </Container>
  )
}
