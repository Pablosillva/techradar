/**
 * Dicionário curado de skills para o TechRadar.
 * Cada skill tem slug único, nome exibido, categoria e aliases para normalização.
 */

export interface SkillDefinition {
  slug: string;
  name: string;
  category: "frontend" | "backend" | "devops" | "data" | "mobile" | "soft";
  aliases: string[];
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // ─── Frontend (10) ───────────────────────────────────────────────────
  { slug: "react", name: "React", category: "frontend", aliases: ["reactjs", "react.js", "react js"] },
  { slug: "vue", name: "Vue.js", category: "frontend", aliases: ["vuejs", "vue.js", "vue js"] },
  { slug: "angular", name: "Angular", category: "frontend", aliases: ["angularjs", "angular.js"] },
  { slug: "typescript", name: "TypeScript", category: "frontend", aliases: ["ts", "type script"] },
  { slug: "javascript", name: "JavaScript", category: "frontend", aliases: ["js", "es6", "ecmascript"] },
  { slug: "nextjs", name: "Next.js", category: "frontend", aliases: ["next.js", "next js", "nextjs"] },
  { slug: "css", name: "CSS", category: "frontend", aliases: ["css3", "css 3"] },
  { slug: "html", name: "HTML", category: "frontend", aliases: ["html5", "html 5"] },
  { slug: "tailwind", name: "Tailwind CSS", category: "frontend", aliases: ["tailwindcss", "tailwind"] },
  { slug: "sass", name: "Sass", category: "frontend", aliases: ["scss", "sc s"] },

  // ─── Backend (10) ────────────────────────────────────────────────────
  { slug: "nodejs", name: "Node.js", category: "backend", aliases: ["node", "node.js", "node js"] },
  { slug: "python", name: "Python", category: "backend", aliases: ["py"] },
  { slug: "java", name: "Java", category: "backend", aliases: [] },
  { slug: "go", name: "Go", category: "backend", aliases: ["golang", "go lang"] },
  { slug: "rust", name: "Rust", category: "backend", aliases: ["rust lang"] },
  { slug: "ruby", name: "Ruby", category: "backend", aliases: ["ruby on rails", "rails"] },
  { slug: "php", name: "PHP", category: "backend", aliases: [] },
  { slug: "dotnet", name: ".NET", category: "backend", aliases: [".net", "dotnet", "c#", "csharp"] },
  { slug: "graphql", name: "GraphQL", category: "backend", aliases: ["graph ql"] },
  { slug: "rest", name: "REST API", category: "backend", aliases: ["restful", "rest api", "rest apis"] },

  // ─── DevOps (8) ──────────────────────────────────────────────────────
  { slug: "aws", name: "AWS", category: "devops", aliases: ["amazon web services", "amazon aws"] },
  { slug: "docker", name: "Docker", category: "devops", aliases: ["docker containers", "containers"] },
  { slug: "kubernetes", name: "Kubernetes", category: "devops", aliases: ["k8s", "kube"] },
  { slug: "terraform", name: "Terraform", category: "devops", aliases: ["hashicorp terraform", "iac"] },
  { slug: "ci-cd", name: "CI/CD", category: "devops", aliases: ["ci/cd", "cicd", "continuous integration", "continuous deployment"] },
  { slug: "linux", name: "Linux", category: "devops", aliases: ["gnu/linux", "unix"] },
  { slug: "gcp", name: "Google Cloud", category: "devops", aliases: ["google cloud platform", "gcp", "gcloud"] },
  { slug: "azure", name: "Azure", category: "devops", aliases: ["microsoft azure", "azure cloud"] },

  // ─── Data (8) ────────────────────────────────────────────────────────
  { slug: "sql", name: "SQL", category: "data", aliases: ["structured query language"] },
  { slug: "postgresql", name: "PostgreSQL", category: "data", aliases: ["postgres", "psql"] },
  { slug: "mongodb", name: "MongoDB", category: "data", aliases: ["mongo", "mongo db"] },
  { slug: "redis", name: "Redis", category: "data", aliases: ["redis cache"] },
  { slug: "spark", name: "Apache Spark", category: "data", aliases: ["spark", "pyspark", "apache spark"] },
  { slug: "hadoop", name: "Hadoop", category: "data", aliases: ["apache hadoop", "hadoop ecosystem"] },
  { slug: "airflow", name: "Airflow", category: "data", aliases: ["apache airflow", "airflow etl"] },
  { slug: "dbt", name: "dbt", category: "data", aliases: ["data build tool", "dbt core"] },

  // ─── Mobile (6) ──────────────────────────────────────────────────────
  { slug: "react-native", name: "React Native", category: "mobile", aliases: ["reactnative", "react native"] },
  { slug: "flutter", name: "Flutter", category: "mobile", aliases: ["flutter dart"] },
  { slug: "swift", name: "Swift", category: "mobile", aliases: ["swift lang", "swift programming"] },
  { slug: "kotlin", name: "Kotlin", category: "mobile", aliases: ["kotlin lang"] },
  { slug: "ios", name: "iOS", category: "mobile", aliases: ["iphone", "apple ios", "ios development"] },
  { slug: "android", name: "Android", category: "mobile", aliases: ["android development", "android dev"] },

  // ─── Soft Skills (8) ─────────────────────────────────────────────────
  { slug: "leadership", name: "Leadership", category: "soft", aliases: ["liderança", "lead", "team lead"] },
  { slug: "communication", name: "Communication", category: "soft", aliases: ["comunicação", "soft skills"] },
  { slug: "agile", name: "Agile", category: "soft", aliases: ["scrum", "kanban", "agile methodology"] },
  { slug: "mentoring", name: "Mentoring", category: "soft", aliases: ["mentoria", "coaching"] },
  { slug: "architecture", name: "Software Architecture", category: "soft", aliases: ["arquitetura de software", "system design"] },
  { slug: "testing", name: "Testing", category: "soft", aliases: ["testes", "unit testing", "tdd", "test driven"] },
  { slug: "security", name: "Security", category: "soft", aliases: ["segurança", "cybersecurity", "appsec"] },
  { slug: "performance", name: "Performance", category: "soft", aliases: ["otimização", "performance tuning", "optimization"] },
];

/**
 * Mapa de aliases → slug para busca rápida
 */
export const ALIAS_TO_SLUG: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const skill of SKILL_DEFINITIONS) {
    map.set(skill.slug, skill.slug);
    for (const alias of skill.aliases) {
      map.set(alias.toLowerCase(), skill.slug);
    }
  }
  return map;
})();

/**
 * Mapa de slug → SkillDefinition
 */
export const SLUG_TO_SKILL: Map<string, SkillDefinition> = (() => {
  const map = new Map<string, SkillDefinition>();
  for (const skill of SKILL_DEFINITIONS) {
    map.set(skill.slug, skill);
  }
  return map;
})();
