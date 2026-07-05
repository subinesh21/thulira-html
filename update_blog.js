const fs = require('fs');
let content = fs.readFileSync('src/pages/blog.html', 'utf8');

const newMain = `<main>
  <section class="section is__tinted">
    <div class="w-layout-blockcontainer container w-container">
      <div class="hero-content" style="padding-top: 6rem; padding-bottom: 4rem;">
        <h1 class="h2">Thulira Insights</h1>
        <p class="max__500" style="margin-top: 1rem; color: rgba(255, 255, 255, 0.7); font-size: 1.1rem; line-height: 1.6;">Discover sustainable living, eco-friendly materials, and how everyday choices can make a positive impact on our planet.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="w-layout-blockcontainer container w-container">
      <div style="display: grid; gap: 4rem; grid-template-columns: 1fr;">
        
        <!-- Blog Post 1 -->
        <article style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 3rem; transition: background 0.3s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.04)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.02)'">
          <h2 class="h2" style="margin-bottom: 1.5rem; font-size: 2.2rem;">Coffee to Cocktails: Eco-Friendly Drinkware for Every Occasion</h2>
          <div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 2.5rem; font-size: 0.95rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">By Thulira &bull; Sustainable Living</div>
          
          <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">The shift to reusable water bottles is a prime example of climate action in everyday life. But sustainability doesn't have to stop at hydration&mdash;it can extend to every beverage you enjoy, from your morning coffee to evening cocktails.</p>
          
          <h3 class="h4" style="margin-top: 2.5rem; margin-bottom: 1rem; color: #fff;">A Circular Economy Approach</h3>
          <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">At Thulira, our drinkware, tableware, and storage solutions are carefully chosen for their durability, sustainable material sourcing, and minimal end-of-life impact. We embrace the circular economy, ensuring that what we consume leaves the smallest footprint possible.</p>

          <h3 class="h4" style="margin-top: 2.5rem; margin-bottom: 1rem; color: #fff;">Innovative Biomaterials &amp; Upcycled Glassware</h3>
          <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">We highlight the use of biomaterials like bamboo fibre, rice husks, and repurposed coffee grounds. These resources are highly renewable and often biodegradable. In addition, upcycling old wine bottles, jam jars, or discarded beer bottles into unique tumblers for cocktails or mocktails is a brilliant way to reduce waste and add rustic charm to your collection.</p>
          
          <h3 class="h4" style="margin-top: 2.5rem; margin-bottom: 1rem; color: #fff;">Perfect for Parties and Gifting</h3>
          <p style="color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">Looking for the perfect eco-friendly setup for your next gathering? Consider bamboo or coconut shell cups for rustic outdoor parties, paired with reusable stainless steel ice cubes. For corporate or personal gifting, personalized engravable stainless steel bottles and starter kits combining drinkware with sustainable living guides make thoughtful and impactful presents.</p>
        </article>

        <!-- Blog Post 2 -->
        <article style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 3rem; transition: background 0.3s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.04)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.02)'">
          <h2 class="h2" style="margin-bottom: 1.5rem; font-size: 2.2rem;">Eco-Friendly Drinkware: A Better Choice for You and the Planet</h2>
          <div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 2.5rem; font-size: 0.95rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">By Thulira &bull; Product Spotlight</div>
          
          <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">Choosing the right drinkware is about more than just aesthetics; it's about making a positive environmental and social impact. Our eco-friendly drinkware is handcrafted in India using a waste-free manufacturing process, upcycled from renewable and recovered resources under strict circular economy principles.</p>

          <h3 class="h4" style="margin-top: 2.5rem; margin-bottom: 1rem; color: #fff;">Empowering Communities</h3>
          <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">Our drinkware is made using rice husk, coffee husk, and bamboo fibres. This unique approach not only reduces agricultural waste but also actively supports rural employment and adds value for farmers. We are proud of the significant involvement of women across the ownership and operations of our manufacturing partners.</p>
          
          <h3 class="h4" style="margin-top: 2.5rem; margin-bottom: 1rem; color: #fff;">Featured Product: The Thulira Majestic Mug</h3>
          <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">Meet the Thulira Majestic Mug, your new favorite daily companion. Made from a premium blend of repurposed coffee husk, bamboo, and rice husk, it is lightweight, impact-resistant, and holds up to 375ml. It is 100% food-contact safe, dishwasher safe, and microwave safe. Available in 9 vibrant colors, it's designed to fit seamlessly into any lifestyle.</p>
          
          <h3 class="h4" style="margin-top: 2.5rem; margin-bottom: 1rem; color: #fff;">Understanding Durability</h3>
          <p style="color: rgba(255, 255, 255, 0.85); line-height: 1.7; font-size: 1.05rem;">Unlike fragile ceramic or easily scratched melamine, our biocomposite mugs (made of natural fibers and food-safe binders like polypropylene) do not break under normal everyday use. While they can break under extreme impact due to the natural fibers, their resilience and eco-friendly nature make them a superior choice for the conscious consumer.</p>
        </article>

      </div>
    </div>
  </section>
</main>`;

content = content.replace(/<main>[\s\S]*?<\/main>/, newMain);
fs.writeFileSync('src/pages/blog.html', content);
console.log('Blog page updated successfully!');
