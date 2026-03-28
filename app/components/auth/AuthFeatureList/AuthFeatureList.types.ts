export interface AuthFeature {
  /** Ícone representativo (emoji ou shortname — mantido como string para portabilidade) */
  icon: string
  /** Título do benefício */
  title: string
  /** Descrição curta */
  description: string
}

export interface AuthFeatureListProps {
  /** Lista de benefícios a exibir. Defaults internos se omitido. */
  features?: AuthFeature[]
}
