import { Container } from '@/components/shared'
import { Title } from '@/components/shared/title'

export default function ContactsPage() {
  return (
    <Container className="px-4 py-10 sm:px-6 lg:px-0">
      <div className="max-w-3xl">
        <Title text="Контакты" size="lg" className="font-extrabold" />
        <p className="mt-4 text-gray-600">
          Здесь будут размещены телефон, адрес, режим работы и форма связи для покупателей и партнеров.
        </p>
      </div>
    </Container>
  )
}
