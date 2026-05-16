import { Container } from '@/components/shared'
import { Title } from '@/components/shared/title'

export default function VacanciesPage() {
  return (
    <Container className="px-4 py-10 sm:px-6 lg:px-0">
      <div className="max-w-3xl">
        <Title text="Вакансии" size="lg" className="font-extrabold" />
        <p className="mt-4 text-gray-600">
          В этом разделе будут опубликованы актуальные вакансии, требования к кандидатам и контакты
          для отклика.
        </p>
      </div>
    </Container>
  )
}
