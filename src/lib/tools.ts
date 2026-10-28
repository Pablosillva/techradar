/**
 * Tool registry — the single source of truth for every online tool.
 *
 * This module is deliberately free of React imports so it can be consumed from
 * server components, `sitemap.ts` and metadata helpers without pulling in the
 * client-side implementations. Icons are referenced by name (see
 * `src/components/ui/tool-icon.tsx`) for the same reason.
 */

export const toolCategories = {
  dev: { slug: "dev", name: "Desenvolvimento", description: "JSON, tokens, identificadores e dados." },
  texto: { slug: "texto", name: "Texto", description: "Senhas e conteúdo em segundos." },
  imagem: { slug: "imagem", name: "Imagem", description: "QR Code, compressão e redimensionamento." },
  calculadora: { slug: "calculadora", name: "Calculadoras", description: "Números do dia a dia." },
  seguranca: { slug: "seguranca", name: "Segurança", description: "Hashes e credenciais." },
} as const;

/**
 * Category identifiers. Derived from the registry keys so `tool.category` and
 * `toolCategories[x].slug` can never drift apart — they are the same string and
 * are compared directly as URLs.
 */
export type ToolCategorySlug = keyof typeof toolCategories;

export type IconName =
  | "braces"
  | "fileJson"
  | "keyRound"
  | "landmark"
  | "qrCode"
  | "imageDown"
  | "scaling"
  | "text"
  | "ruler"
  | "percent"
  | "fingerprint"
  | "shieldCheck"
  | "hash";

export type Tool = {
  slug: string;
  name: string;
  /** One-liner shown under the name on cards. */
  tagline: string;
  /** Meta description. Aim for 140–160 characters. */
  description: string;
  category: ToolCategorySlug;
  icon: IconName;
  keywords: string[];
  /** Surfaced in the "Ferramentas populares" strip on the homepage. */
  featured?: boolean;
  /** Number shown as "X+ ferramentas úteis" style counters. */
  steps: string[];
  faq: { question: string; answer: string }[];
};

export const tools: Tool[] = [
  {
    slug: "formatador-json",
    name: "Formatador JSON",
    tagline: "Formate, valide e minifique JSON.",
    description:
      "Ferramenta online gratuita para formatar, validar e beautificar JSON. Mostra erros com linha e coluna e permite minificar ou copiar o resultado.",
    category: "dev",
    icon: "braces",
    keywords: ["formatador json", "json formatter", "validar json", "beautify json", "minificar json"],
    featured: true,
    steps: [
      "Cole seu JSON no campo de entrada — não é preciso clicar em nenhum botão.",
      "O formato é aplicado enquanto você digita, então o resultado aparece na hora.",
      "Veja se a validação passou e, se falhou, em qual linha e coluna está o erro.",
      "Copie o JSON formatado ou escolha minificar para remover espaços e quebras.",
    ],
    faq: [
      {
        question: "Meus dados são enviados para algum servidor?",
        answer:
          "Não. Todo o processamento acontece no seu navegador, dentro do seu dispositivo. O conteúdo do campo nunca é enviado para os nossos servidores nem fica salvo.",
      },
      {
        question: "Por que meu JSON aparece com erro?",
        answer:
          "As causas mais comuns são vírgula sobrando no fim de um bloco, aspas simples no lugar de aspas duplas e comentários, que não fazem parte do padrão JSON. O validador aponta a linha e a coluna exatas.",
      },
      {
        question: "Qual a diferença entre formatar e minificar?",
        answer:
          "Formatar indenta o JSON com quebras de linha e indentação, deixando-o legível. Minificar remove todo o espaço em branco, deixando o conteúdo menor — útil para enviar por rede ou comparar hashes.",
      },
    ],
  },
  {
    slug: "conversor-json",
    name: "Conversor JSON",
    tagline: "Converta JSON, YAML, CSV e XML.",
    description:
      "Converta JSON para YAML, CSV, XML e vice-versa de graça. Ideal para migrar arquivos de configuração, APIs e planilhas sem escrever código.",
    category: "dev",
    icon: "fileJson",
    keywords: ["conversor json", "json para yaml", "yaml para json", "json para csv", "json para xml"],
    featured: true,
    steps: [
      "Cole o conteúdo de origem ou envie um arquivo.",
      "Escolha o formato de destino no seletor.",
      "A conversão acontece automaticamente a cada alteração.",
      "Copie o resultado ou baixe o arquivo convertido.",
    ],
    faq: [
      {
        question: "Quais formatos são suportados?",
        answer:
          "JSON, YAML, XML e CSV. A conversão para CSV exige que os objetos tenham a mesma estrutura de chaves, como é usual em dados tabulares.",
      },
      {
        question: "Por que a conversão para CSV às vezes falha?",
        answer:
          "CSV é um formato de tabela e não representa estruturas aninhadas. Se o JSON tiver objetos dentro de objetos, a ferramenta indica qual caminho não pode ser achatado.",
      },
      {
        question: "A conversão mantém a ordem das chaves?",
        answer:
          "Sim. A ordem original das chaves é preservada em todos os formatos, o que facilita comparar o resultado com o arquivo de origem.",
      },
    ],
  },
  {
    slug: "gerador-de-senha",
    name: "Gerador de Senha",
    tagline: "Senhas fortes e seguras em um clique.",
    description:
      "Gere senhas aleatórias e seguras com maiúsculas, minúsculas, números e símbolos. Ajuste o comprimento, copie e meça a força da senha.",
    category: "seguranca",
    icon: "keyRound",
    keywords: ["gerador de senha", "gerar senha forte", "senha aleatória", "password generator"],
    featured: true,
    steps: [
      "Defina o comprimento da senha ou deixe que a ferramenta sugira um valor seguro.",
      "Ative ou desative maiúsculas, minúsculas, números e símbolos.",
      "Clique em gerar para criar uma nova senha.",
      "Copie a senha e a guarde em um gerenciador de senhas.",
    ],
    faq: [
      {
        question: "As senhas são enviadas para algum lugar?",
        answer:
          "Não. A senha é criada com a API de criptografia do próprio navegador e existe apenas na memória da aba. Ao fechar ou recarregar a página, ela desaparece.",
      },
      {
        question: "Qual é um comprimento de senha seguro?",
        answer:
          "Mínimo de 12 caracteres, com ao menos maiúsculas, minúsculas, números e símbolos. Para contas que importam muito — e-mail, banco, gerenciador de senhas — 16 caracteres ou mais é o ideal.",
      },
      {
        question: "Posso gerar uma senha sem caracteres ambíguos?",
        answer:
          "Sim. A opção para excluir caracteres ambíguos remove o zero, o O, o I e o l, que costumam ser confundidos entre si e dificultam a digitação.",
      },
    ],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    tagline: "Inspecione header e payload de qualquer token.",
    description:
      "Decodifique tokens JWT e veja o header, o payload e as claims. Entenda o que está dentro do seu token e quando ele expira, direto no navegador.",
    category: "dev",
    icon: "fingerprint",
    keywords: ["jwt decoder", "decodificar jwt", "json web token", "ver token jwt"],
    featured: true,
    steps: [
      "Cole o token JWT completo no campo de entrada.",
      "Veja o header e o payload já decodificados, com os timestamps em datas legíveis.",
      "Confira o campo exp para saber quando o token deixa de valer.",
      "Copie o header ou o payload em formato JSON.",
    ],
    faq: [
      {
        question: "Um JWT decodificado está comprometido?",
        answer:
          "Não necessariamente. A assinatura de um JWT protege contra alteração, mas as partes header e payload são apenas codificadas em base64, não criptografadas. Qualquer pessoa com o token consegue lê-lo — por isso nunca se coloque senhas ou dados sensíveis no payload.",
      },
      {
        question: "Por que a assinatura aparece com caracteres estranhos?",
        answer:
          "A assinatura é codificada em base64url, um formato tweaked para transporte em URL. A ferramenta a exibe como texto, mas decodificá-la não revela nada útil: ela só confirma a integridade quando verificada pelo servidor.",
      },
      {
        question: "O que significa o campo exp?",
        answer:
          "exp é o timestamp de expiração, em segundos desde 1970. Quando a hora atual passar desse valor, o token é considerado inválido e o servidor deve recusá-lo, mesmo que a assinatura esteja correta.",
      },
    ],
  },
  {
    slug: "gerador-de-uuid",
    name: "Gerador de UUID",
    tagline: "UUID v4 único, em lote.",
    description:
      "Gere UUIDs v4 únicos e compatíveis com bancos de dados. Gere um por vez ou em lote, com letras maiúsculas ou minúsculas, e copie na hora.",
    category: "dev",
    icon: "hash",
    keywords: ["gerador de uuid", "uuid v4", "guid online", "gerar id unico"],
    steps: [
      "Escolha quantos identificadores deseja gerar.",
      "Ajuste o formato da letra e o separador, se quiser.",
      "Clique em gerar para criar os UUIDs.",
      "Copie todos de uma vez ou baixe em um arquivo de texto.",
    ],
    faq: [
      {
        question: "Qual a diferença entre UUID v4 e UUID v1?",
        answer:
          "O v4 usa números aleatórios cryptográficos e é o mais usado hoje. O v1 embute o horário e o endereço MAC da máquina, o que o torna sequencial e parcialmente previsível — por isso é desaconselhado em contextos de segurança.",
      },
      {
        question: "Posso usar esses UUIDs como chave primária?",
        answer:
          "Pode, mas considere o custo: por serem aleatórios, causam mais fragmentação de índice no PostgreSQL do que inteiros incrementais. Para volume alto, prefira identidade ou UUIDv7, que é ordenável.",
      },
      {
        question: "Os UUIDs duplicam?",
        answer:
          "A chance é desprezível: são 122 bits de entropia. Ainda assim, use uma restrição de unicidade no banco para se proteger contra seeds mal configuradas ou importações duplicadas.",
      },
    ],
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    tagline: "MD5, SHA-1, SHA-256, SHA-384 e SHA-512.",
    description:
      "Gere hash MD5, SHA-1, SHA-256, SHA-384 e SHA-512 a partir de um texto. Comparte senhas com colleagues e verifica integridade de arquivos.",
    category: "seguranca",
    icon: "shieldCheck",
    keywords: ["gerador de hash", "md5", "sha256", "hash de senha", "gerar sha512"],
    featured: true,
    steps: [
      "Digite ou cole o texto que você quer converter.",
      "Todos os algoritmos são calculados de uma vez.",
      "Copie o hash desejado ou baixe o relatório completo.",
      "Para gerar o hash de um arquivo, use o botão de upload.",
    ],
    faq: [
      {
        question: "Posso usar MD5 para senhas?",
        answer:
          "Não. MD5 é rápido demais e resistente a colisões, o que o torna inadequado para guardar senhas. Use bcrypt, scrypt ou Argon2, que são lentos de propósito e foram desenhados para senhas.",
      },
      {
        question: "Qual algoritmo devo escolher?",
        answer:
          "SHA-256 é o padrão geral e serve para verificação de integridade e assinaturas. SHA-512 dá mais margem de segurança, com custo de processamento quase igual. Use SHA-1 apenas para compatibilidade com sistemas legados.",
      },
      {
        question: "O hash gerado é reversível?",
        answer:
          "Não. Hashes são de mão única: não existe operação que transforme o hash de volta no texto original. O que se pode fazer é testar entradas candidatas até encontrar uma que gere o mesmo hash.",
      },
    ],
  },
  {
    slug: "gerador-de-qr-code",
    name: "Gerador de QR Code",
    tagline: "QR Codes para URL, texto e Wi-Fi.",
    description:
      "Crie QR Codes grátis para links, textos, cartões de contato e redes Wi-Fi. Personalize cores e tamanho e baixe em PNG ou SVG sem marca d'água.",
    category: "imagem",
    icon: "qrCode",
    keywords: ["gerador de qr code", "criar qr code", "qr code whatsapp", "qr code wifi"],
    featured: true,
    steps: [
      "Escolha o tipo de conteúdo: link, texto, contato ou Wi-Fi.",
      "Preencha os dados.",
      "Ajuste as cores e o nível de correção de erro.",
      "Baixe em PNG para-printar ou em SVG para uso vetorial.",
    ],
    faq: [
      {
        question: "Qual a diferença entre PNG e SVG?",
        answer:
          "PNG é uma imagem de pixels, ideal para tela e para-cards. SVG é vetorial e pode ser ampliado para qualquer tamanho sem perder nitidez, o que o torna a escolha certa para impressão.",
      },
      {
        question: "Por que meu QR Code não lê?",
        answer:
          "Usar cores muito claras ou sem contraste suficiente é a causa mais comum. Mantenha oModules escuro sobre um fundo claro e evite gradientes. Na hora de imprimir, prefira preto sobre branco.",
      },
      {
        question: "O nível de correção de erro importa?",
        answer:
          "Sim. Ele define quanto do código pode ficar danificado — até 7% no nível H — e ainda ser lido. Para imprimir em papel, sujeito a eventual logo ou abrasão, use um nível médio ou alto.",
      },
    ],
  },
  {
    slug: "compressor-de-imagem",
    name: "Compressor de Imagem",
    tagline: "Reduza o tamanho das suas imagens.",
    description:
      "Comprima imagens JPG, PNG e WebP direto no navegador. Compare o tamanho antes e depois e reduza o peso das fotos sem perder qualidade.",
    category: "imagem",
    icon: "imageDown",
    keywords: ["comprimir imagem", "otimizar imagens", "reduzir tamanho de foto", "compressor de fotos"],
    steps: [
      "Arraste as imagens para a área de upload ou clique para selecionar.",
      "Ajuste a qualidade e o tamanho máximo.",
      "Veja a comparação de peso e a pré-visualização.",
      "Baixe o arquivo comprimido ou o pacote em ZIP.",
    ],
    faq: [
      {
        question: "As imagens são enviadas para um servidor?",
        answer:
          "Não. A compressão acontece com a Canvas API dentro do seu navegador. Nenhuma imagem sai do seu dispositivo, o que também significa que o tempo de processamento depende só do seu computador.",
      },
      {
        question: "Qual qualidade escolher para não perder nitidez?",
        answer:
          "Entre 75% e 85% para a web, você raramente percebe a diferença e o arquivo costuma cair pela metade. Abaixo de 60% aparecem artefatos em bordas e gradientes.",
      },
      {
        question: "Por que uma imagem PNG ficou maior depois da compressão?",
        answer:
          "PNG é um formato sem perda e usa compressão própria. Se a imagem não tem transparência nem poucas cores, convertê-la para JPEG ou WebP é o que realmente reduz o tamanho.",
      },
    ],
  },
  {
    slug: "redimensionador-de-imagem",
    name: "Redimensionador de Imagem",
    tagline: "Reduza ou amplie em pixels e porcentagem.",
    description:
      "Redimensione imagens por pixel ou porcentagem mantendo as proporções. Use para avatars, thumbnails e capas de rede social, direto no navegador.",
    category: "imagem",
    icon: "scaling",
    keywords: ["redimensionar imagem", "mudar tamanho de foto", "resize image", "thumbnail"],
    steps: [
      "Envie a imagem.",
      "Informe a largura e a altura desejadas, ou use a porcentagem.",
      "Ative o bloqueio de proporção se quiser manter o formato original.",
      "Baixe o arquivo já redimensionado.",
    ],
    faq: [
      {
        question: "Ampliar uma imagem deixa ela pior?",
        answer:
          "Sim, porque não existe informação nova a ser criada. O resultado fica interpolado e menos nítido. Para ampliar com qualidade, o ideal é usar uma imagem de origem com resolução maior.",
      },
      {
        question: "Redimensionar tira a EXIF da foto?",
        answer:
          "Sim. Como a imagem é reprocessada para um novo canvas, dados como modelo da câmera, GPS e data são descartados. Isso é Inclusive uma vantagem em termos de privacidade.",
      },
      {
        question: "Qual o formato de saída?",
        answer:
          "A imagem é salva em PNG quando o original era PNG e em JPEG caso contrário. Escolha JPEG para fotos e PNG quando precisar manter a transparência.",
      },
    ],
  },
  {
    slug: "gerador-de-lorem-ipsum",
    name: "Gerador de Lorem Ipsum",
    tagline: "Texto de exemplo sob medida.",
    description:
      "Gere Lorem Ipsum em parágrafos, frases ou palavras, com ou sem HTML. Copie e cole direto no seu layout sem se preocupar com o conteúdo.",
    category: "texto",
    icon: "text",
    keywords: ["gerador de lorem ipsum", "texto de exemplo", "placeholder", "texto lorem"],
    steps: [
      "Escolha a unidade: parágrafos, frases, palavras ou listas.",
      "Defina a quantidade e clique em gerar.",
      "Se quiser, ative o modo com HTML.",
      "Copie o texto gerado.",
    ],
    faq: [
      {
        question: "O que é Lorem Ipsum?",
        answer:
          "É um texto sem sentido usado como placeholder em layouts e mockups. Deriva de trechos de 'De finibus bonorum et malorum', de Cícero, e serve para ocupar espaço sem a burocracia de escrever conteúdo.",
      },
      {
        question: "Posso usar em um site real?",
        answer:
          "Para protótipos, sim. Para produção, prefira texto real: o Lorem Ipsum em uma página indexada pode ser considerado conteúdo sem valor e atrapalhar o ranqueamento.",
      },
      {
        question: "Como funciona a opção com HTML?",
        answer:
          "Ela envolve cada parágrafo em tags <p>, o que evita que o seu navegador cole o texto como um bloco único. É o formato prático para colar direto em um editor visual.",
      },
    ],
  },
  {
    slug: "conversor-de-unidades",
    name: "Conversor de Unidades",
    tagline: "Comprimento, peso, temperatura e mais.",
    description:
      "Converta unidades de comprimento, massa, temperatura, área, volume, velocidade e dados. Resultado instantâneo e preciso, sem planilha.",
    category: "calculadora",
    icon: "ruler",
    keywords: ["conversor de unidades", "converter km para milhas", "celsius para fahrenheit", "conversor de medidas"],
    featured: true,
    steps: [
      "Selecione a grandeza que quer converter.",
      "Digite o valor no campo de origem.",
      "Escolha a unidade de entrada e a unidade de saída.",
      "Copie o resultado de qualquer lado da tabela.",
    ],
    faq: [
      {
        question: "Por que a conversão de temperatura não é só uma multiplicação?",
        answer:
          "Temperatura tem deslocamento de zero, não apenas escala. Por isso Celsius para Fahrenheit é (C × 9/5) + 32, e Fahrenheit para Celsius inverte a operação. As ferramentas que aplicam apenas uma taxa erram exatamente aqui.",
      },
      {
        question: "Quais grandezas estão disponíveis?",
        answer:
          "Comprimento, massa, temperatura, área, volume, velocidade, tempo e dados. Cada grandeza usa sua própria tabela de fatores, e as unidades são intercambiáveis entre si.",
      },
      {
        question: "Preciso instalar alguma coisa?",
        answer:
          "Não. Tudo roda no navegador, sem cadastro e sem envio de dados. Pode usar em campo, no celular ou em um computador sem internet depois que a página carregar.",
      },
    ],
  },
  {
    slug: "calculadora-de-porcentagem",
    name: "Calculadora de Porcentagem",
    tagline: "Aumento, desconto e proporção.",
    description:
      "Calcule aumento, desconto, quanto por cento um valor representa e a variação entre dois números. Resultados instantâneos e fáceis de conferir.",
    category: "calculadora",
    icon: "percent",
    keywords: ["calculadora de porcentagem", "calcular desconto", "calculadora de aumento", "percentual"],
    featured: true,
    steps: [
      "Escolha o tipo de cálculo: aumento, desconto, porcentagem ou diferença.",
      "Preencha os campos indicados.",
      "O resultado aparece na hora, junto com a memória do cálculo.",
      "Copie o resultado para usar onde quiser.",
    ],
    faq: [
      {
        question: "Como se calcula um aumento de 15%?",
        answer:
          "Multiplique o valor por 1,15. Em um salário de R$ 2.000, isso equivale a R$ 2.300. Pelo mesmo raciocínio, um desconto de 15% é o valor multiplicado por 0,85.",
      },
      {
        question: "Aumento e desconto usam a mesma fórmula?",
        answer:
          "Usam o mesmo raciocínio com sinal invertido. Aumento soma a taxa (valor × (1 + taxa)), desconto subtrai (valor × (1 − taxa)). Essa é a razão pela qual descontar 20% e depois subir 20% não volta ao valor original.",
      },
      {
        question: "Qual a diferença entre \"porcentagem de\" e \"em relação a\"?",
        answer:
          "Ambos calculam a mesma razão, mas a leitura muda: \"10% de 200\" pergunta quanto vale 10% do total, enquanto \"200 é 10% de quanto\" usa o total como a parcela e resolve a incógnita.",
      },
    ],
  },
  {
    slug: "calculadora-de-financiamento",
    name: "Calculadora de Financiamento",
    tagline: "Simule parcelas, juros e custo total.",
    description:
      "Simule financiamento de veículo ou imóvel: descubra a parcela mensal, o custo total do crédito e quanto você paga de juros na prática.",
    category: "calculadora",
    icon: "landmark",
    keywords: ["calculadora de financiamento", "simulador de financiamento", "simular parcela de carro", "parcela de carro"],
    featured: true,
    steps: [
      "Informe o valor financiado e o prazo em meses.",
      "Ajuste a taxa de juros ao ano e a entrada.",
      "Veja a parcela mensal e o custo total ao lado.",
      "Compare cenários alterando o prazo ou a taxa.",
    ],
    faq: [
      {
        question: "Como a calculadora estima a parcela?",
        answer:
          "Ela usa o sistema Price, o mais comum em crédito imobiliário e de veículo: parcelas constantes ao longo do tempo, com os juros incidentes sobre o saldo devedor.",
      },
      {
        question: "Por que pagar mais tempo significa pagar mais juros?",
        answer:
          "Financiar mais meses mantém o saldo devedor alto por mais tempo, e os juros incidem sobre esse saldo. Com entrada maior ou prazo menor, o total pago cai de forma desproporcional ao que você economiza.",
      },
      {
        question: "É confiável para fechar negócio?",
        answer:
          "É uma simulação baseada na taxa que você informar. O CET real inclui tarifas, seguros e impostos e pode ser maior. Use como referência e confirme as condições finais com a instituição financeira.",
      },
    ],
  },
];

export const toolsByCategory = toolCategories;

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategorySlug): Tool[] {
  return tools.filter((t) => t.category === category);
}

export const featuredTools = tools.filter((t) => t.featured);

/** Tool slugs, used to build static params and the sitemap. */
export const toolSlugs = tools.map((t) => t.slug);
