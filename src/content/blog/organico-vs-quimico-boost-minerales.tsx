import { P, H2, H3, UL, ExternalLink, InternalLink } from "@/components/institutional";

export default function OrganicoVsQuimico() {
  return (
    <>
      <P>
        En el mundo del cultivo de cannabis circulan dos campos enfrentados: el
        que jura por la nutrición orgánica (compost, humus de lombriz, harinas,
        guano, extractos de algas) y el que confía en la nutrición mineral
        (sales solubles tipo NPK, quelatos, micronutrientes sintéticos). Y en
        el medio aparecen los “boost” — esos aditivos comerciales que prometen
        más cogollo, más resina, más todo, agregando dosis altas de fósforo,
        potasio, silicio o aminoácidos en momentos específicos del ciclo. La
        pregunta honesta es: ¿qué dice la evidencia científica sobre lo que
        realmente cambia para la planta?
      </P>

      <H2>Cómo absorbe nutrientes una planta de cannabis</H2>
      <P>
        Una planta no distingue entre nitrógeno orgánico y nitrógeno sintético.
        Lo que la raíz puede absorber son iones específicos: nitrato (NO₃⁻),
        amonio (NH₄⁺), fosfato (H₂PO₄⁻/HPO₄²⁻), potasio (K⁺), calcio (Ca²⁺),
        magnesio (Mg²⁺), y un puñado de micronutrientes en cantidades chicas
        (hierro, manganeso, zinc, boro, cobre, molibdeno). La diferencia entre
        los dos abordajes no está en el ion final, sino en cómo llega ese ion
        a la raíz.
      </P>
      <P>
        En nutrición mineral, los iones ya están en solución libre desde el
        riego: la planta los toma de inmediato. En nutrición orgánica, los
        nutrientes están atrapados en moléculas complejas (proteínas, ácidos
        húmicos, restos vegetales) que necesitan ser degradadas por bacterias,
        hongos y otros microorganismos del suelo antes de liberarse. Esto
        introduce una variable enorme: la salud de la microbiota del sustrato
        determina cuánto y cuándo recibe la planta cada nutriente.
      </P>

      <H2>Qué muestran los estudios peer-reviewed</H2>
      <P>
        Un grupo de investigadores publicó en 2023 en{" "}
        <em>Frontiers in Plant Science</em> un trabajo titulado{" "}
        <ExternalLink href="https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2023.1233232/full">
          “Cannabis Hunger Games”
        </ExternalLink>{" "}
        (Crispim Massuela et al., 2023) en el que compararon directamente
        fertilizante mineral contra fertilizante orgánico en floración.
        Resultado en biomasa de inflorescencias: 23,7 g/planta con mineral
        contra 19,6 g/planta con orgánico. Mineral ganó. Pero al medir
        concentración de CBD, el orgánico llegó a 6,5% contra 5,8% del
        mineral — el estrés nutricional asociado al orgánico empuja a la
        planta a concentrar más cannabinoides en menos materia.
      </P>
      <P>
        El segundo hallazgo es más interesante para quien cultiva: con
        aproximadamente un tercio menos de fertilizante mineral se logró el
        95% del rendimiento de CBD del tratamiento alto. Es decir, la
        idea de “más es mejor” no se sostiene. La planta tiene un techo de
        absorción, y pasar ese techo no agrega rendimiento — agrega gasto y
        riesgo de toxicidad.
      </P>

      <H3>El problema del amonio en muchos orgánicos</H3>
      <P>
        Saloner y Bernstein publicaron en 2022 en{" "}
        <ExternalLink href="https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2022.830224/full">
          un paper específico
        </ExternalLink>{" "}
        sobre el ratio amonio/nitrato. Probaron concentraciones de 0%, 10%,
        30%, 50% y 100% de NH₄⁺ manteniendo siempre 200 mg/L de nitrógeno
        total. La biomasa de inflorescencias cayó 35%, 32%, 46% y 97% a medida
        que subía el amonio. La concentración de cannabinoides y terpenos fue
        máxima entre 0% y 10% de amonio. Los autores recomiendan explícitamente
        no superar el 30% de amonio para cannabis medicinal.
      </P>
      <P>
        Esto importa porque muchos fertilizantes orgánicos basados en estiércol,
        harinas animales o purines liberan nitrógeno predominantemente como
        amonio. Aplicar ese tipo de insumo en floración alta — sin compostaje
        previo que estabilice el ratio — puede comprometer seriamente tanto
        rendimiento como contenido de cannabinoides.
      </P>

      <H2>¿Y los “boost” minerales?</H2>
      <P>
        Los aditivos de floración (típicamente PK boosters, silicio, calcio
        extra, aminoácidos) se venden con la promesa de empujar la planta más
        allá de lo que da la nutrición base. La evidencia ahí es menos clara
        de lo que sugiere el marketing. Tres datos verificables:
      </P>
      <UL>
        <li>
          <strong className="text-[var(--foreground)] font-medium">PK boosters:</strong>{" "}
          Caplan, Dixon y Zheng (2017) trabajaron con dosis crecientes de
          fósforo y potasio en floración y encontraron que pasado el umbral
          de la base nutricional, agregar más PK no aumenta el rendimiento,
          y dosis muy altas provocan bloqueos (lock-out) de calcio y
          magnesio porque los iones compiten por la absorción.
        </li>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Silicio (Si):</strong>{" "}
          la evidencia para cannabis es preliminar, pero estudios en otras
          plantas muestran que mejora resistencia mecánica del tallo y
          tolerancia al estrés. No aumenta cannabinoides per se.
        </li>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Aminoácidos / bioestimulantes:</strong>{" "}
          una revisión de 2022 en <em>Frontiers in Plant Science</em>{" "}
          documentó respuestas variables — algunos cultivos respondieron con
          más biomasa, otros no — y advirtió que el efecto depende fuertemente
          del estado nutricional de la planta. En plantas ya bien nutridas,
          el efecto adicional es marginal.
        </li>
      </UL>
      <P>
        La regla general que emerge: los boosters funcionan como herramienta
        correctiva o de afinado en cultivos que tienen la base bien ajustada.
        En cultivos con problemas estructurales (pH del sustrato fuera de
        rango, microbiota débil, exceso de salinidad), agregar boost es como
        echar más nafta a un motor sin aceite.
      </P>

      <H2>El rol invisible del suelo y la microbiota</H2>
      <P>
        Una diferencia que rara vez aparece en el marketing pero sí en los
        papers: el suelo vivo (con micorrizas, bacterias fijadoras de
        nitrógeno, Trichoderma y otros hongos benéficos) cambia la economía
        del cultivo. Las micorrizas arbusculares aumentan la superficie
        efectiva de absorción de la raíz, lo que mejora especialmente la
        captación de fósforo — un nutriente notoriamente poco móvil en el
        suelo.
      </P>
      <P>
        En cultivos hidropónicos puros con nutrición mineral, esa biología
        no existe y se compensa con monitoreo estricto de EC y pH. En
        cultivos en sustrato vivo, esa biología hace parte del trabajo y
        reduce la dependencia del fertilizante externo. Ninguna de las dos
        vías es “mejor” en abstracto: depende del cultivador, de la
        infraestructura y de qué variable se prioriza (rendimiento bruto,
        perfil terpénico, sostenibilidad de insumos).
      </P>

      <H2>Qué se puede afirmar con honestidad</H2>
      <UL>
        <li>
          La planta absorbe iones, no “orgánico” ni “sintético”. La diferencia
          real está en velocidad de disponibilidad y en la salud del sustrato.
        </li>
        <li>
          Mineral bien ajustado produce más biomasa total; orgánico bien
          ajustado tiende a concentrar más cannabinoides por gramo. Los
          números absolutos dependen del manejo.
        </li>
        <li>
          Los “boost” no son magia: corrigen o afinan, no reemplazan una base
          nutricional mal calculada. Y dosis altas pueden inducir bloqueos
          entre iones.
        </li>
        <li>
          El factor más infravalorado es el sustrato vivo y su microbiota.
          Mejorarlo suele rendir más que cualquier botella nueva.
        </li>
      </UL>

      <H2>Por qué importa esto en el marco regulatorio uruguayo</H2>
      <P>
        En Uruguay, las tres vías legales de acceso al cannabis psicoactivo
        (autocultivo, club, farmacia) están reguladas por la{" "}
        <ExternalLink href="https://www.impo.com.uy/bases/leyes/19172-2013">
          Ley 19.172
        </ExternalLink>{" "}
        y el{" "}
        <ExternalLink href="https://www.impo.com.uy/bases/decretos/120-2014">
          Decreto 120/014
        </ExternalLink>
        . El autocultivador es la figura legal que toma directamente las
        decisiones nutricionales del cultivo, dentro del tope de seis plantas
        hembras y 480 gramos anuales por hogar (Art. 14 del Decreto 120/014).
        Para quien no quiere o no puede cultivar personalmente, la vía del
        club traslada esas decisiones a una asociación civil habilitada por
        el IRCCA — ver{" "}
        <InternalLink href="/blog/club-autocultivo-farmacia-tres-vias">
          la comparativa de las tres vías
        </InternalLink>
        {" "}para entender cuál encaja mejor con cada perfil.
      </P>

      <H2>Próximos pasos</H2>
      <P>
        Si lo que te interesa es entender cómo funciona la vía del club,
        revisá{" "}
        <InternalLink href="/como-asociarse">
          cómo asociarse a un club cannábico
        </InternalLink>{" "}
        o leé{" "}
        <InternalLink href="/blog/ley-19172-explicada">
          la Ley 19.172 explicada
        </InternalLink>
        . Si querés iniciar el proceso con El Gordito Club, completá el{" "}
        <InternalLink href="/postulacion">
          formulario de postulación
        </InternalLink>
        .
      </P>

      <H2>Términos relacionados</H2>
      <P>
        cultivo cannabis Uruguay, abono orgánico para cannabis, fertilizante
        mineral cannabis, NPK floración, boost floración cannabis, cannabis
        sativa nutrición, autocultivo Uruguay, autocultivo Montevideo,
        Canelones cultivo cannabis, club cannábico Uruguay, IRCCA autocultivo,
        humus de lombriz cannabis, micorrizas cannabis, amonio nitrato
        cannabis, pH sustrato cannabis.
      </P>
    </>
  );
}
