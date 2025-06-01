import { Categories, Container, Filters, SortPopup, TopBar } from "@/components/shared";
import { Title } from "@/components/shared/title";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (<>
    <Container className="mt-10">
      <Title text="Категории товаров" size="lg" className="font-extrabold"/>
    </Container>

    <TopBar/>

    <Container className="mt-10 bp-14">
        <div className="flex gap-[60px]">
          {/* Фильтрация */}
          <div className="">
            <Filters/>
          </div>

          {/* Список товаров */}
          <div className="flex-1">
            <div className="flex flex-col gap-16">
              Список товаров
            </div>

          </div>
        </div>
    </Container>

    <div style={{height: '3000px'}}/>
  </>
  );
}
