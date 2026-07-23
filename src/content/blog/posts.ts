import type { ComponentType } from "react";
import LeyExplicada from "./ley-19172-explicada";
import ComoAsociarseClub from "./como-asociarse-club-cannabico-uruguay";
import TresVias from "./club-autocultivo-farmacia-tres-vias";
import OrganicoVsQuimico from "./organico-vs-quimico-boost-minerales";
import CuidadosAlConsumir from "./cuidados-al-consumir-mezclas-y-palida";
import MunchiesBajon from "./munchies-por-que-da-hambre-fumar";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  author: string;
  /**
   * Orden manual: si está definido, gana sobre publishedAt en los listados.
   * Sin order → orden por fecha (más reciente primero).
   */
  order?: number;
  /** Captura de la fuente oficial principal del artículo (IMPO, IRCCA, etc.). */
  source: {
    url: string;
    label: string;
  };
  Body: ComponentType;
};

/**
 * Orden canónico para listados: primero los que tienen `order` (asc),
 * después el resto por publishedAt desc.
 */
export function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });
}

const PUBLISHED = new Date("2026-05-13");
const PUBLISHED_2 = new Date("2026-05-19");

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-asociarse-club-cannabico-uruguay",
    title: "Cómo asociarse a un club cannábico en Uruguay: guía paso a paso",
    description:
      "Requisitos legales, documentación y proceso para postularse a un club cannábico habilitado por el IRCCA. Información apta para postulantes de cualquier departamento.",
    publishedAt: PUBLISHED,
    tags: ["postulación", "clubes cannábicos", "IRCCA"],
    author: "El Gordito Club",
    order: 1,
    source: {
      url: "https://www.ircca.gub.uy/vias-de-acceso/clubes-de-membresia-con-habilitacion-vigente/",
      label: "IRCCA — clubes con habilitación vigente",
    },
    Body: ComoAsociarseClub,
  },
  {
    slug: "ley-19172-explicada",
    title: "Ley 19.172 explicada: qué cambió en Uruguay con la regulación del cannabis",
    description:
      "Resumen accesible de la Ley 19.172, las tres vías de acceso al cannabis psicoactivo y el rol del IRCCA en el marco regulatorio uruguayo.",
    publishedAt: PUBLISHED,
    tags: ["marco legal", "Ley 19.172", "IRCCA"],
    author: "El Gordito Club",
    order: 2,
    source: {
      url: "https://www.impo.com.uy/bases/leyes/19172-2013",
      label: "Ley 19.172 — texto oficial en IMPO",
    },
    Body: LeyExplicada,
  },
  {
    slug: "club-autocultivo-farmacia-tres-vias",
    title: "Club, autocultivo o farmacia: las tres vías legales para acceder al cannabis en Uruguay",
    description:
      "Comparativa de las tres vías de acceso reconocidas por la Ley 19.172, con los datos oficiales del Decreto 120/014 sobre topes y requisitos.",
    publishedAt: PUBLISHED,
    tags: ["marco legal", "vías de acceso", "comparativa"],
    author: "El Gordito Club",
    order: 3,
    source: {
      url: "https://www.impo.com.uy/bases/decretos/120-2014",
      label: "Decreto 120/014 — texto oficial en IMPO",
    },
    Body: TresVias,
  },
  {
    slug: "organico-vs-quimico-boost-minerales-cannabis",
    title: "Orgánico vs químico en cannabis: qué dicen los estudios",
    description:
      "Comparativa basada en papers peer-reviewed: nutrición mineral vs orgánica, efecto real de los boost de floración y el rol de la microbiota del sustrato.",
    publishedAt: PUBLISHED_2,
    tags: [
      "cultivo",
      "nutrición",
      "autocultivo",
      "ciencia",
      "fertilización",
    ],
    author: "El Gordito Club",
    order: 4,
    source: {
      url: "https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2023.1233232/full",
      label: "Frontiers in Plant Science — Cannabis Hunger Games (2023)",
    },
    Body: OrganicoVsQuimico,
  },
  {
    slug: "cuidados-al-consumir-cannabis-mezclas-y-palida",
    title: "Cuidados al consumir cannabis: mezclas y pálida",
    description:
      "Pautas oficiales del IRCCA y evidencia científica sobre mezclar cannabis con alcohol, tabaco, MDMA, psicodélicos y medicamentos. Cómo navegar una pálida.",
    publishedAt: PUBLISHED_2,
    tags: [
      "reducción de daños",
      "consumo responsable",
      "IRCCA",
      "mezclas",
      "pálida",
    ],
    author: "El Gordito Club",
    order: 5,
    source: {
      url: "https://ircca.gub.uy/recursos-de-informacion/pautas-reduccion-riesgos/",
      label: "IRCCA — Pautas de reducción de riesgos",
    },
    Body: CuidadosAlConsumir,
  },
  {
    slug: "munchies-por-que-da-hambre-fumar-marihuana",
    title: "Munchies: por qué da hambre al fumar marihuana",
    description:
      "El bajón explicado con ciencia: cómo el THC invierte el switch de saciedad en las neuronas POMC, el rol de la ghrelina y por qué pide alfajor y dulce.",
    publishedAt: PUBLISHED_2,
    tags: [
      "ciencia",
      "endocannabinoide",
      "munchies",
      "bajón",
      "cultura",
    ],
    author: "El Gordito Club",
    order: 6,
    source: {
      url: "https://www.nature.com/articles/nature14260",
      label: "Nature — POMC neurons & cannabinoid feeding (Koch & Horvath, 2015)",
    },
    Body: MunchiesBajon,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
