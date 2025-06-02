import { Categories, Container, Filters, ProductCard, ProductsGroupList, SortPopup, TopBar } from "@/components/shared";
import { Title } from "@/components/shared/title";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (<>
    <Container className="mt-10">
      <Title text="Категории товаров" size="lg" className="font-extrabold"/>
    </Container>

    <TopBar/>

    <Container className="mt-10 bp-14 scroll-smooth">
        <div className="flex gap-[60px]">
          {/* Фильтрация */}
          <div className="">
            <Filters/>
          </div>

          {/* Список товаров */}
          <div className="flex-1">
            <div className="flex flex-col gap-16">
              <ProductsGroupList title="Все" items={[
                { 
                  id: 1,
                  name: "Горошек",
                  imageUrl: "https://ir.ozone.ru/s3/multimedia-1-q/c1000/6935375726.jpg",
                  price: 520,
                  items: [{ price: 550}]
                },
                                { 
                  id: 2,
                  name: "Горошек 2",
                  imageUrl: "https://ir.ozone.ru/s3/multimedia-1-q/c1000/6935375726.jpg",
                  price: 520,
                  items: [{ price: 550}]
                },
                                { 
                  id: 3,
                  name: "Горошек 3",
                  imageUrl: "https://ir.ozone.ru/s3/multimedia-1-q/c1000/6935375726.jpg",
                  price: 520,
                  items: [{ price: 550}]
                },
                                { 
                  id: 4,
                  name: "Горошек 4",
                  imageUrl: "https://ir.ozone.ru/s3/multimedia-1-q/c1000/6935375726.jpg",
                  price: 520,
                  items: [{ price: 550}]
                },
                
              ]} categoryId={1}/>

              <ProductsGroupList title="Мясо" items={[
                { 
                  id: 1,
                  name: "Бекон",
                  imageUrl: "https://i.pinimg.com/originals/99/52/01/995201e1c92ca9eced42364ed8a1892c.png",
                  price: 330,
                  items: [{ price: 330}]
                },
                                { 
                  id: 2,
                  name: "Бекон",
                  imageUrl: "https://i.pinimg.com/originals/99/52/01/995201e1c92ca9eced42364ed8a1892c.png",
                  price: 330,
                  items: [{ price: 330}]
                },
                                { 
                  id: 3,
                  name: "Бекон",
                  imageUrl: "https://i.pinimg.com/originals/99/52/01/995201e1c92ca9eced42364ed8a1892c.png",
                  price: 330,
                  items: [{ price: 330}]
                },
                { 
                  id: 4,
                  name: "Бекон",
                  imageUrl: "https://i.pinimg.com/originals/99/52/01/995201e1c92ca9eced42364ed8a1892c.png",
                  price: 330,
                  items: [{ price: 330}]
                },
                { 
                  id: 5,
                  name: "Бекон",
                  imageUrl: "https://i.pinimg.com/originals/99/52/01/995201e1c92ca9eced42364ed8a1892c.png",
                  price: 330,
                  items: [{ price: 330}]
                },
                { 
                  id: 6,
                  name: "Бекон",
                  imageUrl: "https://i.pinimg.com/originals/99/52/01/995201e1c92ca9eced42364ed8a1892c.png",
                  price: 330,
                  items: [{ price: 330}]
                },

                
              ]} categoryId={2}/>
            </div>

          </div>
        </div>
    </Container>

    <div style={{height: '3000px'}}/>
  </>
  );
}
