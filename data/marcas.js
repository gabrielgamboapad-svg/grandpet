// Contenido de marcas tomado de grandpet.com (páginas de cada marca y catálogo corporativo).
// Cada línea enlaza a la tienda con `handle` (producto) y usa `img` local o, si no hay, la foto del producto.
window.MARCAS = [
  {
    slug: "natural-gourmet", name: "Natural Gourmet", store: "Natural Gourmet", logo: "logo-natural-gourmet", pet: "Perro y gato",
    tagline: "0% granos, sin sabores, colores ni conservadores artificiales.",
    intro: [
      "Antes de que existieran las dietas tradicionales basadas en granos, los perros se alimentaban de la naturaleza. GrandPET Natural Gourmet® provee una dieta rica en carne y diversos nutrientes de la misma manera como la naturaleza los proporciona, contribuyendo a una salud total y mayor longevidad.",
      "Es un alimento 0% granos, formulado principalmente con carne, frutos del bosque, vegetales y grasas de alta calidad, basado en la alimentación de su antecesor, el lobo, pero adaptado a la necesidad del perro como animal de compañía; sin colorantes ni químicos potenciadores de sabor.",
      "Utilizamos camote, un ingrediente libre de gluten que mejora la textura de la croqueta, evita la formación de heces pastosas y promueve la salud digestiva por su alto contenido en fibra.",
    ],
    groups: [
      { title: "Alimento seco", lines: [
        { name: "Natural Gourmet Baby", desc: "Alimento seco para perro cachorro, todas las razas.", img: "ng-baby", handle: "grandpet-natural-gourmet-baby" },
        { name: "Natural Gourmet Baby Cordero", desc: "Alimento seco para perro cachorro, todas las razas.", img: "ng-baby-cordero", handle: "natural-gourmet-baby®-alimento-natural-piel-y-pelo-saludables-para-cachorro-receta-cordero-y-salmon" },
        { name: "Natural Gourmet Petit", desc: "Alimento seco para perro adulto raza pequeña.", img: "ng-petit", handle: "grandpet-natural-gourmet-petit" },
        { name: "Natural Gourmet Grand", desc: "Alimento seco para perro adulto raza mediana y grande.", img: "ng-grand", handle: "natural-gourmet-grand" },
        { name: "Natural Gourmet Cordero", desc: "Alimento seco para perro adulto raza mediana y grande.", img: "ng-cordero", handle: "grandpet-natural-gourmet-piel-y-pelo-saludables-para-perro-adulto-receta-cordero-y-salmon" },
        { name: "Natural Gourmet Feline", desc: "Alimento seco natural para gatos de todas las etapas.", img: "ng-feline", handle: "grandpet-natural-gourmet-feline" },
      ] },
      { title: "Alimento húmedo", lines: [
        { name: "Carne y Frutos del Bosque", desc: "Alimento húmedo para perro.", img: "ng-humedo-carne", handle: "pouche-frutos-del-bosque" },
        { name: "Pescado a las Finas Hierbas", desc: "Alimento húmedo para gato.", img: "ng-humedo-pescado", handle: "pouche-pescado-a-las-finas-hierbas" },
      ] },
      { title: "Cachorros recién nacidos", lines: [
        { name: "Sustituto de Leche para Cachorro", desc: "Para sus primeros días.", img: "ng-leche", handle: "grandpet-natural-gourmet-sustituto-de-leche-para-cachorro" },
        { name: "Papilla para Cachorro", desc: "Para la transición a alimento sólido.", img: "ng-papilla", handle: "grandpet-natural-gourmet-papilla-para-cachorros" },
      ] },
      { title: "Premios y complementos", lines: [
        { name: "Premios naturales deshidratados", desc: "Real Treats: patas de pollo, tráquea, tímpano, pulmón y más.", img: "ng-premios", handle: "grandpet-natural-gourmet®-premio-patas-de-pollo-natural" },
        { name: "Aderezo para perro", desc: "Para consentir sus croquetas.", handle: "aderezo-grandpet-natural-gourmet-tocino-ahumado" },
      ] },
    ],
  },
  {
    slug: "back-2-nature", name: "Back 2 Nature", store: "Back 2 Nature", logo: "logo-back-2-nature", pet: "Perro y gato",
    tagline: "Alimento holístico, libre de granos y gluten.",
    intro: [
      "GrandPET Back to Nature® es un alimento holístico, libre de granos y gluten, elaborado con ingredientes de la más alta calidad: la mejor opción para brindar una nutrición natural y especializada de acuerdo a sus necesidades.",
      "Nuestras recetas están elaboradas con proteínas de alto valor biológico, como cordero, salmón, cerdo, pavo y pescado, que aportan nutrientes, mejoran la digestión y la salud en general; libres de saborizantes, aromas, colorantes artificiales, conservadores y químicos, regresando a lo natural.",
    ],
    groups: [
      { title: "Alimento seco para perro", lines: [
        { name: "Small Breed Puppy®", recipe: "Receta Cerdo, Pavo & Pescado", desc: "Alimento holístico seco para cachorro de raza pequeña.", sizes: "2 y 6 kilos", img: "b2n-puppy-sb", handle: "back-2-nature-cachorro-raza-pequena",
          benefits: ["Ácidos grasos para piel y pelo saludables.", "Enriquecido con probióticos que mejoran la salud intestinal.", "Fuente de calcio y fósforo necesarios para la formación de huesos.", "Contiene DHA que estimula el funcionamiento cerebral."] },
        { name: "Medium & Large Breed Puppy®", recipe: "Receta Cerdo, Pavo & Pescado", desc: "Alimento holístico seco para cachorro de raza mediana y grande.", sizes: "6 y 15 kilos", img: "b2n-puppy-mlb", handle: "back-2-nature-cachorro-raza-mediana-y-grande",
          benefits: ["Balance de proteínas, minerales y glicinatos que protegen el sistema inmune.", "Enriquecido con probióticos que mejoran la salud intestinal.", "Vitamina D como fijador de calcio para el desarrollo de huesos.", "Contiene DHA que estimula el funcionamiento cerebral."] },
        { name: "Small Breed Adult®", recipe: "Receta Cerdo, Pavo & Pescado", desc: "Alimento holístico seco para perro adulto raza pequeña.", sizes: "2 y 6 kilos", img: "b2n-adult-sb", handle: "back-2-nature-adulto-razas-pequenas",
          benefits: ["Ácidos grasos que ayudan a mantener piel y pelo saludables.", "Óxido de manganeso que favorece el mantenimiento de huesos y cartílagos.", "Probióticos que mejoran la salud intestinal y previenen diarreas.", "Vitaminas y minerales que protegen el sistema inmune."] },
        { name: "Medium & Large Breed Adult®", recipe: "Receta Cerdo, Pavo & Pescado", desc: "Alimento holístico seco para perro adulto raza mediana y grande.", img: "b2n-adult-mlb", handle: "back-2-nature-adulto-raza-mediana-y-grande",
          benefits: ["Pavo, pescado y cerdo que aportan proteínas y minerales para un metabolismo saludable.", "Óxido de zinc que fortalece las articulaciones.", "Probióticos que mejoran la salud intestinal."] },
        { name: "Healthy Skin & Coat Adult®", recipe: "Receta Cordero & Salmón Hidrolizado", desc: "Alimento holístico seco para perro adulto de todas las razas.", sizes: "2 y 6 kilos", img: "b2n-hsa", handle: "back-2-nature-adulto-piel-y-pelo-saludable",
          benefits: ["Cordero, hidrolizado de salmón y pavo que previenen las alergias en piel.", "Aceite de pescado, fuente de omegas 3, 6 y 9.", "L-lisina para sintetizar la queratina del pelo.", "Vitamina B3 que mejora la apariencia de piel y pelo."] },
        { name: "Fullness Life®", recipe: "Receta Pavo, Pescado & Cerdo", desc: "Alimento holístico seco para perro adulto de todas las razas, mayores a 7 años.", sizes: "2 kilos", img: "b2n-fl", handle: "back-2-nature-adulto-vida-plena",
          benefits: ["Proteínas de alta digestibilidad que ayudan a mantener su masa corporal.", "Harina de salmón que aporta colágeno para articulaciones, cartílagos y ligamentos.", "Semillas de cártamo y girasol, fuente de antioxidantes.", "Fórmula libre de granos que favorece la digestión en el perro maduro."] },
        { name: "Adult Perfect Control®", recipe: "Receta Pavo, Pescado & Cerdo", desc: "Alimento holístico seco para perro adulto de todas las razas.", sizes: "2 kilos", img: "b2n-cp", handle: "back-to-nature-adulto-perfect-control",
          benefits: ["Fórmula baja en calorías para control de peso.", "Proteínas de alta digestibilidad con efecto saciogénico.", "L-Carnitina que ayuda a usar las grasas como fuente de energía.", "Bajos niveles de carbohidratos."] },
      ] },
      { title: "Para gato", lines: [
        { name: "Feline Kitten", recipe: "Receta de Rana, Pavo y Salmón", desc: "Alimento seco para gatito.", handle: "back-2-nature-feline-kitten" },
        { name: "Feline Indoor", recipe: "Receta de Rana, Pavo y Salmón", desc: "Alimento seco para gato de interior.", handle: "back-2-nature-feline-indoor" },
      ] },
      { title: "Húmedo y premios naturales", lines: [
        { name: "Receta de Pavo", desc: "Alimento húmedo completo y balanceado para perro adulto.", handle: "back-2-nature-receta-de-pavo-1" },
        { name: "Receta de Cordero", desc: "Alimento húmedo completo y balanceado para perro adulto.", handle: "back-2-nature-receta-de-cordero" },
        { name: "Corazón de Res", desc: "Premio natural deshidratado. Masticar ayuda a la higiene dental y previene la formación de sarro.", handle: "back-2-nature-all-natural-treats-premios" },
      ] },
    ],
  },
  {
    slug: "carne-fresca", name: "Carne Fresca", store: "Carne Fresca", logo: "logo-carne-fresca", pet: "Perro",
    tagline: "Con carne que no ha sido congelada.",
    intro: [
      "GrandPET Carne Fresca® contiene carne que no ha sido congelada, lo que proporciona a tu perro proteínas de alto valor biológico y de alta digestibilidad que cubren sus requerimientos nutricionales con menor cantidad de alimento. Enriquecido con hierbas funcionales que mejoran su digestión y estabilidad gastrointestinal y metabólica.",
      "Está formulado con menos de 30% de carbohidratos, cuando otros contienen 40% o más, y con una combinación de granos saludable (arroz y avena) que ayuda a mejorar la calidad de vida de tu mascota.",
    ],
    groups: [
      { title: "Alimento seco", lines: [
        { name: "Carne Fresca Puppy Care®", desc: "Alimento seco para perros cachorros. Comprometidos con su inmunidad y desarrollo.", sizes: "2, 4 y 15 kilos", img: "cf-puppy", handle: "grandpet-carne-fresca-puppy-care",
          benefits: ["Bacilos para una excelente digestión.", "Fortalece su sistema inmune.", "Ayuda al desarrollo del sistema óseo."] },
        { name: "Carne Fresca Minis®", desc: "Alimento seco para perros adultos de raza pequeña, con un metabolismo más acelerado.", sizes: "2, 4 y 15 kilos", img: "cf-minis", handle: "grandpet-carne-fresca-minis",
          benefits: ["Previene obesidad.", "Refuerzo anti-estrés (cromo, selenio y vitamina E).", "Mayor concentración de nutrientes para un metabolismo más exigente."] },
        { name: "Carne Fresca Force®", desc: "Alimento seco para perros adultos de razas medianas y grandes, atletas con mayor exigencia física.", sizes: "4, 7 y 20 kilos", img: "cf-force", handle: "grandpet-carne-fresca-force",
          benefits: ["Mejor oxigenación celular.", "Refuerza su sistema inmune y nervioso.", "Glucosamina para sus articulaciones."] },
      ] },
      { title: "Alimento húmedo", lines: [
        { name: "Receta Pavo y Pollo", desc: "Sobre de alimento húmedo para perro.", handle: "pouche-carne-fresca-pavo-pollo" },
        { name: "Receta Ternera y Cordero", desc: "Sobre de alimento húmedo para perro.", handle: "pouche-carne-fresca-ternera-cordero" },
        { name: "Receta Salmón y Atún", desc: "Sobre de alimento húmedo para gato.", handle: "pouche-carne-fresca-salmon-atun" },
      ] },
    ],
  },
  {
    slug: "magno", name: "Magno", store: "Magno", logo: "", pet: "Perro",
    tagline: "Formulado según los perfiles nutricionales de AAFCO.",
    intro: [
      "GrandPET MAGNO® contiene carne que no ha sido congelada, lo que proporciona a tu perro proteínas de alto valor biológico y de alta digestibilidad que cubren sus requerimientos nutricionales con menor cantidad de alimento. Enriquecido con hierbas funcionales que mejoran su digestión y estabilidad gastrointestinal y metabólica.",
    ],
    groups: [
      { title: "Alimento seco", lines: [
        { name: "MAGNO® Cachorro", recipe: "Receta de pavo y calabaza", desc: "Formulado para cumplir con los niveles nutricionales de los perfiles de nutrientes para perros cachorros de AAFCO.", handle: "magno-alimento-perro-cachorro" },
        { name: "MAGNO® Adulto Raza Pequeña", recipe: "Receta de pollo e higo", desc: "Formulado para cumplir con los perfiles de nutrientes para perros adultos de raza pequeña de AAFCO.", handle: "magno-adulto-raza-pequena" },
        { name: "MAGNO® Adulto Raza Mediana y Grande", recipe: "Receta de cordero y zanahoria", desc: "Alimento seco para perros adultos de razas medianas y grandes.", handle: "magno-adulto-raza-mediana-y-grande" },
        { name: "MAGNO® Adulto Senior", recipe: "Receta de salmón y espárrago", desc: "Alimento seco para perros adultos mayores.", handle: "magno-senior-alimento-perro-adulto" },
      ] },
    ],
  },
  {
    slug: "noble", name: "Noble", store: "Noble", logo: "logo-noble", pet: "Perro",
    tagline: "Con amor del bueno.",
    intro: [
      "El amor más sincero es el de un perrito. Su nobleza, gracia y ternura hacen que se roben nuestro corazón; por eso, una forma de corresponder a ese amor sin límites está en cuidar lo que comen.",
      "GrandPET NOBLE® es un alimento premium cuyos principales beneficios se obtienen de la combinación perfecta de ingredientes, que proveen a tu mascota de vitalidad y un sistema inmune saludable. Por la selección de proteínas que utilizamos, brinda una alta digestibilidad y bajas grasas saturadas.",
    ],
    groups: [
      { title: "Alimento seco", lines: [
        { name: "Noble Cachorro®", recipe: "Receta Pavo, Arroz y Salmón", desc: "Alimento seco para cachorro.", sizes: "2, 4 y 15 kg", img: "noble-cachorro", handle: "grandpet-noble-cachorro",
          benefits: ["Balance adecuado de calcio, fósforo y ácido fólico para el desarrollo de huesos y dientes.", "Fibras naturales y prebióticos que promueven la salud intestinal.", "Probióticos que mejoran la absorción de nutrientes y evitan las diarreas.", "Fuentes naturales de DHA que ayudan al desarrollo cognitivo."] },
        { name: "Noble Adulto Raza Pequeña®", recipe: "Receta Pavo, Arroz y Salmón", desc: "Alimento seco para adulto raza pequeña.", sizes: "2, 4 y 15 kg", img: "noble-adulto-rp", handle: "grandpet-noble-adulto-raza-pequena",
          benefits: ["Proteínas de origen animal de alta digestibilidad.", "Fuentes de omegas 3 y 6 para una piel sana y pelo brillante.", "Delicioso sabor para el paladar exigente de tu mascota.", "Prebióticos que promueven la salud intestinal."] },
        { name: "Noble Adulto®", recipe: "Receta Pavo, Arroz y Salmón", desc: "Alimento seco para adulto raza mediana y grande.", sizes: "2, 4 y 22 kg", img: "noble-adulto-rmg", handle: "grandpet-noble-adulto",
          benefits: ["Nutrición 100% completa y balanceada.", "Enriquecido con vitaminas y minerales esenciales.", "Inulina de agave, prebiótico que mejora la salud intestinal.", "Probióticos que contribuyen al equilibrio de la microflora."] },
      ] },
      { title: "Alimento húmedo", lines: [
        { name: "Cachorro Receta Pavo y Arroz", desc: "Sobre de alimento húmedo de 100 g.", handle: "grandpet-noble®-sobre-100-gr-alimento-humedo-perro-cachorro-receta-pavo-y-arroz" },
        { name: "Adulto Receta Res y Arroz", desc: "Sobre de alimento húmedo de 100 g.", handle: "grandpet-noble®-sobre-100-gr-alimento-humedo-perro-adulto-receta-de-res-y-arroz" },
        { name: "Adulto Receta Cordero y Arroz", desc: "Sobre de alimento húmedo de 100 g.", handle: "grandpet-noble®-sobre-100-gr-alimento-humedo-perro-adulto-receta-cordero-y-arroz" },
      ] },
    ],
  },
  {
    slug: "kisha", name: "Kisha", store: "Kisha", logo: "logo-kisha", pet: "Gato",
    tagline: "Alimento hecho con amor para tu gato.",
    intro: [
      "Porque su ronroneo, incondicionalidad y suavidad nos conquistan. Démosles alimento hecho con amor que ayuda a mantenerlos sanos.",
    ],
    groups: [
      { title: "Alimento seco", lines: [
        { name: "Kisha Adulto", desc: "Alimento seco para gato adulto.", img: "kisha-adulto", handle: "grandpet-kisha-adult" },
        { name: "Kisha Kittens", recipe: "Receta Salmón, Camarón y Algas Marinas", desc: "Alimento seco premium para gatitos de todas las razas.", img: "kisha-cachorro", handle: "grandpet-kisha-kittens" },
      ] },
      { title: "Alimento húmedo", lines: [
        { name: "Receta de Atún", desc: "Sobre de 85 g.", handle: "grandpet-kisha®-sobre-85-gr-alimento-humedo-gato-receta-atun" },
        { name: "Receta de Camarón", desc: "Sobre de 85 g.", handle: "grandpet-kisha®-sobre-85-gr-alimento-humedo-gato-receta-camaron" },
        { name: "Receta de Tilapia", desc: "Sobre de 85 g.", handle: "grandpet-kisha®-sobre-85-gr-alimento-humedo-gato-receta-tilapia" },
        { name: "Receta de Pavo", desc: "Sobre de 85 g.", handle: "grandpet-kisha®-alimentos-humedo-para-gato-receta-de-pavo-40-sobre" },
      ] },
    ],
  },
  { slug: "clasico", name: "Clásico", store: "Clásico", logo: "logo-clasico", pet: "Perro y gato", tagline: "Croquetas para perro y alimento para gato.", intro: [], groups: [] },
  { slug: "beast-friend", name: "Beast Friend", store: "Beast Friend", logo: "logo-beast-friend", pet: "Perro", tagline: "Premios para perro.", intro: [], groups: [] },
  { slug: "nutrescan", name: "Nutrescan", store: "Nutrescan", logo: "logo-nutrescan", pet: "Perro", tagline: "Alimento para perro.", intro: [], groups: [] },
  { slug: "nutrescan-natural", name: "Nutrescan Natural", store: "", logo: "logo-nutrescan-natural", pet: "Perro", tagline: "Disponible con nuestros distribuidores.", intro: [], groups: [] },
  { slug: "supercan", name: "Supercan", store: "", logo: "logo-supercan", pet: "Perro", tagline: "Disponible con nuestros distribuidores.", intro: [], groups: [] },
];
