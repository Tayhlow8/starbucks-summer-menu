import SummerPhysics from "@/components/SummerPhysics";
import SiteHeader from "@/components/SiteHeader";
import StickyGallery from "@/components/StickyGallery";
import overlayImg from "@/assets/3d effect overlay.png";

const menuItems = [
  {
    title: "New Tropical Butterfly Lemonade Refresher",
    text: "A burst of summer. Layers of guava and passionfruit flavors shaken with lemonade and ice. With popping mango-pineapple flavored pearls and a splash of vibrant color infusion.",
    action: "Order now",
    tag: "vegan",
    image: "/assets/menu/butterfly%20default.png",
    hover: "/assets/menu/butterfly%20lemonade%20drink%20hover.png",
  },
  {
    title: "New Butterfly Drink",
    text: "A tropical vacation in every sip. A blend of pineapple and passionfruit flavors shaken with creamy coconutmilk and ice.",
    action: "Start an order",
    tag: "vegan",
    image: "/assets/menu/pineapple%20default.png",
    hover: "/assets/menu/pineapple%20hover.png",
  },
  {
    title: "New Horchata Frappuccino Blended Beverage",
    text: "A cool summer escape. Cinnamon, vanilla and toasted rice notes blended with coffee, creamy milk and ice.",
    action: "Pick this",
    tag: "contains milk*",
    image: "/assets/menu/new%20orchatta%20default.png",
    hover: "/assets/menu/new%20horchatta%20hover.png",
  },
  {
    title: "Iced Horchata Shaken Espresso",
    text: "Subtly sweet Starbucks Blonde Espresso Roast meets cinnamon, vanilla and toasted rice notes, shaken with ice and topped with oatmilk.",
    action: "Get this one",
    tag: "contains oatmilk*",
    image: "/assets/menu/iced%20horchatta%20default.png",
    hover: "/assets/menu/iced%20horchatta%20hover.png",
  },
  {
    title: "Mango Dragonfruit Energy Refresher",
    text: "Uplifting and tropical. Mango and dragonfruit flavors shaken with ice and real dragonfruit pieces.",
    action: "Try this",
    tag: "vegan",
    image: "/assets/menu/dragon%20fruit%20default.png",
    hover: "/assets/menu/dragon%20fruit%20hover.png",
  },
  {
    title: "Toasted Coconut Cream Cold Brew",
    text: "Smooth Starbucks Cold Brew layered with toasted coconut cream cold foam and finished with coconut flakes.",
    action: "Pick this",
    tag: "contains dairy*",
    image: "/assets/menu/coconut%20default.png",
    hover: "/assets/menu/coconut%20hover.png",
  },
  {
    title: "Strawberry Acai Energy Refresher",
    text: "Sweet strawberry and acai flavors boosted with extra caffeine and B vitamins, hand-shaken with ice.",
    action: "Order now",
    tag: "vegan",
    image: "/assets/menu/berrys%20defaut.png",
    hover: "/assets/menu/berrys%20hover.png",
  },
  {
    title: "Iced Brown Sugar Oatmilk Shaken Espresso",
    text: "Starbucks Blonde Espresso Roast combined with brown sugar and cinnamon, shaken with ice and oatmilk.",
    action: "Get this one",
    tag: "contains oatmilk*",
    image: "/assets/menu/cinnammon%20default.png",
    hover: "/assets/menu/cinnammon%20hover.png",
  },
  {
    title: "Jalapeno Chicken Pocket",
    text: "Toasted chile lavash flatbread stuffed with diced chicken, charred poblanos and jalapeno cream cheese.",
    action: "Flavour this",
    tag: "contains lactose*",
    image: "/assets/menu/food1.png",
    hover: "/assets/menu/food1.png",
  },
  {
    title: "Tomato & Mozzarella on Focaccia",
    text: "Roasted tomatoes, mozzarella, spinach and basil pesto stacked on toasted focaccia bread.",
    action: "Pick this",
    tag: "contains lactose*",
    image: "/assets/menu/food2.png",
    hover: "/assets/menu/food2.png",
  },
  {
    title: "Unicorn Cake Pop",
    text: "Creamy vanilla confetti cake dipped in white-chocolaty icing and finished with a whimsical design.",
    action: "Place order",
    tag: "contains eggs",
    image: "/assets/menu/lollipop%20hover.png",
    hover: "/assets/menu/lollipop%20hover.png",
  },
];

const featureBullets = [
  {
    label: "New tropical flavors",
    image: "/assets/svg/pineapple-bullet.svg",
  },
  {
    label: "Cold brews & shaken espresso",
    image: "/assets/svg/cold-brew-bullet.svg",
  },
  {
    label: "New options to pair",
    image: "/assets/svg/bites-bullet.svg",
  },
  {
    label: "Limited seasonal edition",
    image: "/assets/svg/limited-edd-bullet.svg",
  },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section id="top" className="hero-section">
        <SummerPhysics />

        <h1>Summer</h1>
        <img
          className="hero-overlay"
          src={overlayImg.src}
          alt=""
        />
        <div className="hero-copy">
          <p className="hero-kicker">Starts here!</p>
          <p>
            New options to enjoy summer your way: vibrant refreshers, creamy
            iced coffees, and flavors made for the hottest days.
          </p>
        </div>
        <ul className="hero-list" aria-label="Summer menu highlights">
          {featureBullets.map((item) => (
            <li key={item.label}>
              <img className="hero-icon" src={item.image} alt="" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <StickyGallery />

      <section id="menu" className="menu-section">
        <div className="menu-shell">
          <h2>A good day<br />starts with Coffee</h2>
          <img
            className="menu-person"
            src="/assets/figma/menu-person.png"
            alt="Guest enjoying a Starbucks iced drink"
          />
          <div className="menu-grid">
            {menuItems.map((item) => (
              <article className="menu-card" key={item.title}>
                <div className="menu-image">
                  <img
                    className="default-image"
                    src={item.image}
                    alt={item.title}
                  />
                  <img className="hover-image" src={item.hover} alt="" />
                </div>
                <div className="menu-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <div className="menu-card-actions">
                    <a href="#pickup">{item.action}</a>
                    <span>{item.tag}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pickup" className="pickup-section">
        <div className="pickup-grid">
          <h2>Order & Pick Up</h2>

          <div className="pickup-drink-col">
            <img
              className="pickup-drink"
              src="/assets/figma/pickup-drink.png"
              alt="Butterfly summer drink with boba"
            />
          </div>

          <ul className="pickup-links">
            <li>
              <a
                href="https://www.starbucks.com/rewards/mobile-apps/"
                target="_blank"
                rel="noreferrer"
              >
                Order on the App
              </a>
            </li>
            <li>
              <a
                href="https://www.starbucks.com/menu"
                target="_blank"
                rel="noreferrer"
              >
                Order on Web
              </a>
            </li>
            <li>
              <a
                href="https://www.starbucks.com/ways-to-order/delivery/"
                target="_blank"
                rel="noreferrer"
              >
                Delivery
              </a>
            </li>
            <li>
              <a
                href="https://www.starbucks.com/ways-to-order/"
                target="_blank"
                rel="noreferrer"
              >
                Order and Pick Up Options
              </a>
            </li>
            <li>
              <a
                href="https://athome.starbucks.com/"
                target="_blank"
                rel="noreferrer"
              >
                Explore coffee for Home
              </a>
            </li>
          </ul>

          <img
            className="pickup-store"
            src="/assets/figma/pickup-store.png"
            alt="Starbucks pickup moment outside a store"
          />
          <img
            className="pickup-store-mobile"
            src="/assets/menu/mobile%20device%20image.png"
            alt="Order on your mobile device"
          />
        </div>
      </section>

      <footer className="site-footer">
        <div className="social-row" aria-label="Social links">
          <span>Spotify</span>
          <span>Facebook</span>
          <span>Pinterest</span>
          <span>Instagram</span>
          <span>YouTube</span>
        </div>
        <p>Privacy Notice</p>
        <p>Terms of Use</p>
        <p>Do Not Share My Personal Information</p>
        <p>Accessibility</p>
        <small>© 2026 Starbucks Coffee Company. All rights reserved.</small>
      </footer>
    </main>
  );
}
