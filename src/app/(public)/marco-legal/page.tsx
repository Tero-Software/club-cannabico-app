import type { Metadata } from "next";
import {
  PageHero,
  Section,
  P,
  H2,
  H3,
  UL,
  ExternalLink,
  InternalLink,
  Breadcrumbs,
} from "@/components/institutional";

export const metadata: Metadata = {
  title: "Marco legal del cannabis en Uruguay | Ley 19.172 y Decreto 120/014",
  description:
    "Resumen de la Ley 19.172 y el Decreto 120/014: las tres vías de acceso al cannabis en Uruguay, rol del IRCCA y derechos del socio de un club cannábico.",
  alternates: { canonical: "/marco-legal" },
};

export default function MarcoLegalPage() {
  return (
    <article>
      <Breadcrumbs items={[{ name: "Marco legal", path: "/marco-legal" }]} />
      <PageHero
        eyebrow="MARCO LEGAL"
        title="El cannabis en Uruguay: Ley 19.172 y Decreto 120/014"
        intro="Uruguay regula el cannabis desde 2013. Este resumen está pensado para postulantes y socios que quieren entender el marco bajo el cual opera un club cannábico legal."
      />

      <Section eyebrow="LA LEY">
        <H2>Ley 19.172 (2013)</H2>
        <P>
          La Ley 19.172, promulgada el 20 de diciembre de 2013, regula
          integralmente la producción, distribución y consumo de cannabis en
          Uruguay. Fue la primera ley del mundo en establecer un mercado regulado
          de cannabis a escala nacional. Estableció tres vías de acceso legal,
          creó el Instituto de Regulación y Control del Cannabis (IRCCA) como
          autoridad sectorial, e incorporó el cannabis al marco general de
          regulación de sustancias psicoactivas.
        </P>
        <P>
          Texto oficial:{" "}
          <ExternalLink href="https://www.impo.com.uy/bases/leyes/19172-2013">
            impo.com.uy/bases/leyes/19172-2013
          </ExternalLink>
          .
        </P>
      </Section>

      <Section eyebrow="REGLAMENTACIÓN">
        <H2>Decreto 120/014</H2>
        <P>
          El Decreto 120/014 reglamenta la Ley 19.172 y define en detalle el
          funcionamiento operativo del sistema. Para los clubes cannábicos, los
          artículos relevantes incluyen:
        </P>
        <UL>
          <li>
            <strong className="text-[var(--foreground)] font-medium">Art. 4</strong> — prohíbe
            toda forma de publicidad, promoción, auspicio o patrocinio de productos
            de cannabis psicoactivo en cualquier medio. La divulgación pública del
            club se limita a información institucional y educativa.
          </li>
          <li>
            <strong className="text-[var(--foreground)] font-medium">Art. 23</strong> — permite
            la divulgación, información y educación dirigidas exclusivamente a los
            integrantes del club.
          </li>
          <li>
            <strong className="text-[var(--foreground)] font-medium">Art. 29</strong> — establece
            que toda actividad del club (plantación, cultivo, cosecha,
            procesamiento y distribución a sus socios) debe desarrollarse en su
            sede única.
          </li>
          <li>
            <strong className="text-[var(--foreground)] font-medium">Art. 38</strong> — establece
            la incompatibilidad entre las tres vías de acceso: ningún usuario
            puede estar simultáneamente registrado como autocultivador, socio de
            un club y comprador en farmacia.
          </li>
        </UL>
        <P>
          Texto oficial:{" "}
          <ExternalLink href="https://www.impo.com.uy/bases/decretos/120-2014">
            impo.com.uy/bases/decretos/120-2014
          </ExternalLink>
          .
        </P>
      </Section>

      <Section eyebrow="LAS TRES VÍAS">
        <H2>Vías de acceso al cannabis psicoactivo</H2>
        <P>
          La Ley 19.172 reconoce tres caminos legales para acceder al cannabis
          psicoactivo. El Art. 38 del Decreto 120/014 establece que son
          excluyentes entre sí: una persona solo puede estar inscripta en uno.
        </P>

        <H3>Autocultivo</H3>
        <P>
          Cultivo personal de hasta seis plantas hembras en floración con un
          tope anual de 480 gramos. Requiere inscripción del cultivador y de la
          ubicación del cultivo en el IRCCA.
        </P>

        <H3>Club de membresía</H3>
        <P>
          Asociación civil sin fines de lucro habilitada por el IRCCA, con una
          membresía mínima de 15 y máxima de 45 socios. El club cultiva en su
          sede registrada y distribuye únicamente a sus socios, dentro de los
          topes legales por persona.
        </P>

        <H3>Adquisición en farmacia</H3>
        <P>
          Compra de cannabis psicoactivo en farmacias habilitadas, previo
          registro del adquirente en el sistema oficial. El Art. 2 lit. v del
          Decreto 120/014 establece un tope de 10 gramos semanales con un
          máximo de 40 gramos mensuales por usuario registrado.
        </P>
      </Section>

      <Section eyebrow="ORGANISMO REGULADOR">
        <H2>IRCCA</H2>
        <P>
          El Instituto de Regulación y Control del Cannabis (IRCCA) es el
          organismo público creado por la Ley 19.172 que regula la plantación,
          cultivo, cosecha, producción, elaboración, acopio, distribución y
          expendio de cannabis. Habilita a los clubes cannábicos, fiscaliza su
          funcionamiento y mantiene el registro público de habilitaciones
          vigentes.
        </P>
        <P>
          Su sede está en Convención 1366, Piso 2, Galería Caubarrere,
          Montevideo. Sitio oficial:{" "}
          <ExternalLink href="https://www.ircca.gub.uy">
            ircca.gub.uy
          </ExternalLink>
          .
        </P>
      </Section>

      <Section eyebrow="DERECHOS DEL SOCIO">
        <H2>Derechos del socio de un club cannábico</H2>
        <P>
          Los socios de un club cannábico habilitado por el IRCCA tienen los
          siguientes derechos derivados de la Ley 19.172, el Decreto 120/014 y
          la legislación general de asociaciones civiles:
        </P>
        <UL>
          <li>
            Acceso al cannabis psicoactivo dentro de los topes establecidos por
            la regulación, exclusivamente a través de la sede del club.
          </li>
          <li>
            Participación en la asamblea de socios y voto en las decisiones que
            la regulación de la asociación civil reserva a sus integrantes.
          </li>
          <li>
            Acceso a información sobre el funcionamiento del club: estatuto,
            balances, padrón de socios y actas de asamblea, según lo establecido
            en el estatuto y la legislación aplicable.
          </li>
          <li>
            Protección de sus datos personales: el padrón de socios y la
            información de los integrantes están alcanzados por la Ley 18.331 de
            Protección de Datos Personales y la propia Ley 19.172.
          </li>
          <li>
            Derecho a darse de baja en cualquier momento, conforme el estatuto
            del club y la normativa del IRCCA.
          </li>
        </UL>
      </Section>

      <Section eyebrow="FUENTES OFICIALES">
        <H2>Fuentes y documentos</H2>
        <UL>
          <li>
            <ExternalLink href="https://www.impo.com.uy/bases/leyes/19172-2013">
              Ley 19.172 — texto completo (IMPO)
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.impo.com.uy/bases/decretos/120-2014">
              Decreto 120/014 — texto completo (IMPO)
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.ircca.gub.uy">
              IRCCA — sitio oficial
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.ircca.gub.uy/vias-de-acceso/clubes-de-membresia-con-habilitacion-vigente/">
              IRCCA — listado público de clubes con habilitación vigente
            </ExternalLink>
          </li>
        </UL>
        <P>
          Si tenés dudas concretas sobre cómo aplica este marco a tu situación,{" "}
          <InternalLink href="/postulacion">postulate</InternalLink> y nos
          ponemos en contacto.
        </P>
      </Section>
    </article>
  );
}
