import { P, H2, H3, UL, ExternalLink, InternalLink } from "@/components/institutional";

export default function LeyExplicada() {
  return (
    <>
      <P>
        En diciembre de 2013, Uruguay se convirtió en el primer país del mundo
        en regular integralmente el cannabis a escala nacional. La Ley 19.172,
        promulgada el 20 de diciembre de ese año, no despenalizó el cannabis
        (técnicamente nunca había sido un delito poseerlo para consumo
        personal): regularizó su producción, distribución y acceso. Más de una
        década después, sigue siendo una referencia para gobiernos que estudian
        modelos de regulación de drogas.
      </P>

      <H2>Qué establece la Ley 19.172</H2>
      <P>
        La Ley 19.172 modifica el régimen anterior del Decreto-Ley 14.294
        (estupefacientes) y crea un marco específico para el cannabis. Sus tres
        ejes principales son:
      </P>
      <UL>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Acceso regulado:</strong>{" "}
          establece tres vías legales para acceder al cannabis psicoactivo —
          autocultivo personal, clubes de membresía y adquisición en farmacias —
          con un régimen excluyente entre ellas.
        </li>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Autoridad sectorial:</strong>{" "}
          crea el Instituto de Regulación y Control del Cannabis (IRCCA), que
          habilita, fiscaliza y mantiene los registros del sistema.
        </li>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Trazabilidad:</strong>{" "}
          establece un sistema de registro de usuarios que permite al Estado
          conocer cuánto cannabis adquiere o produce cada persona dentro del
          marco legal.
        </li>
      </UL>
      <P>
        El texto completo está disponible en{" "}
        <ExternalLink href="https://www.impo.com.uy/bases/leyes/19172-2013">
          IMPO
        </ExternalLink>
        , el sitio oficial de publicaciones del Estado uruguayo.
      </P>

      <H2>Las tres vías de acceso</H2>
      <P>
        El Art. 38 del Decreto 120/014 (reglamentación de la Ley 19.172)
        establece que las tres vías son excluyentes: una misma persona no puede
        estar inscripta simultáneamente como autocultivador, como socio de un
        club y como compradora en farmacia.
      </P>

      <H3>Autocultivo</H3>
      <P>
        Hasta seis plantas hembras en floración, con un tope de 480 gramos
        anuales por hogar (Art. 14 del Decreto 120/014). Requiere inscripción
        del cultivador y de la dirección del cultivo en el IRCCA.
      </P>

      <H3>Clubes de membresía</H3>
      <P>
        Asociaciones civiles habilitadas por el IRCCA, con un mínimo de 15 y un
        máximo de 45 socios, que cultivan en una sede registrada y distribuyen
        a sus integrantes dentro de los topes legales. La actividad del club
        está limitada a su sede única (Art. 29 del Decreto 120/014). Es la vía
        adecuada para quien prefiere acceso reglado sin tener que cultivar
        personalmente.
      </P>

      <H3>Farmacia</H3>
      <P>
        Compra en farmacias habilitadas, con un tope de 10 gramos semanales y
        un máximo de 40 gramos mensuales por usuario registrado (Art. 2 lit. v
        del Decreto 120/014). Requiere registro previo del adquirente en el
        sistema oficial.
      </P>

      <H2>El rol del IRCCA</H2>
      <P>
        El Instituto de Regulación y Control del Cannabis (IRCCA) es la
        autoridad sectorial creada por la propia Ley 19.172. Sus funciones
        principales son habilitar productores y clubes, fiscalizar su
        funcionamiento, mantener los registros oficiales y promover políticas
        de información al usuario.
      </P>
      <P>
        El IRCCA publica regularmente el listado de clubes con habilitación
        vigente en{" "}
        <ExternalLink href="https://www.ircca.gub.uy/vias-de-acceso/clubes-de-membresia-con-habilitacion-vigente/">
          su sitio oficial
        </ExternalLink>
        . Es información pública y verificable.
      </P>

      <H2>Por qué importa</H2>
      <P>
        El modelo uruguayo es objeto de estudio internacional por una razón
        concreta: es el único que combina regulación nacional, trazabilidad
        estatal y tres vías diferenciadas para públicos con necesidades
        distintas. La regulación no resolvió todos los problemas (el mercado
        informal sigue existiendo), pero estableció un piso de derechos para
        usuarios y un marco operativo para productores que antes era
        impensable.
      </P>
      <P>
        Para quien evalúa entrar al sistema legal, entender la Ley 19.172 y su
        decreto reglamentario es el primer paso. La{" "}
        <InternalLink href="/marco-legal">página de marco legal</InternalLink>{" "}
        del club tiene un resumen estructurado de los artículos relevantes y
        enlaces directos a los textos oficiales.
      </P>

      <H2>Próximos pasos</H2>
      <P>
        Si después de leer la ley te interesa la vía del club, podés revisar{" "}
        <InternalLink href="/como-asociarse">
          cómo asociarse a un club cannábico
        </InternalLink>{" "}
        o ir directo al{" "}
        <InternalLink href="/postulacion">
          formulario de postulación
        </InternalLink>
        . Si tenés dudas concretas, las{" "}
        <InternalLink href="/preguntas-frecuentes">
          preguntas frecuentes
        </InternalLink>{" "}
        cubren los puntos más consultados.
      </P>

      <H2>Términos relacionados</H2>
      <P>
        Ley 19172 Uruguay, ley de cannabis Uruguay, regulación cannabis
        Uruguay, IRCCA, Decreto 120/014, marco legal cannabis Uruguay, vías
        de acceso cannabis, autocultivo Uruguay, club cannábico Uruguay,
        farmacia cannabis Uruguay, trazabilidad cannabis, registro IRCCA,
        ley cannabis Montevideo, ley cannabis Canelones, cannabis legal
        Uruguay, postulación club cannábico.
      </P>
    </>
  );
}
