interface StructuredDataProps {
  data: Record<string, any>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Common structured data generators
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
})

export const generateHowToSchema = (steps: Array<{ name: string; text: string; image?: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Transform Your Energy with NRGHAX',
  description: 'Step-by-step guide to using energy hacks for personal transformation',
  step: steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
    ...(step.image && { image: step.image }),
  })),
})

export const generateArticleSchema = (article: {
  title: string
  description: string
  author?: string
  datePublished: string
  dateModified?: string
  image?: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  author: {
    '@type': 'Person',
    name: article.author || 'NRGHAX Team',
  },
  datePublished: article.datePublished,
  dateModified: article.dateModified || article.datePublished,
  publisher: {
    '@type': 'Organization',
    name: 'NRGHAX',
    logo: {
      '@type': 'ImageObject',
      url: 'https://nrghax.com/logo.png',
    },
  },
  ...(article.image && {
    image: {
      '@type': 'ImageObject',
      url: article.image,
    },
  }),
})

export const generateProductSchema = (product: {
  name: string
  description: string
  price?: number
  currency?: string
  ratingValue?: number
  reviewCount?: number
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  brand: {
    '@type': 'Brand',
    name: 'NRGHAX',
  },
  ...(product.price && {
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: 'https://schema.org/InStock',
    },
  }),
  ...(product.ratingValue && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount || 1,
    },
  }),
})