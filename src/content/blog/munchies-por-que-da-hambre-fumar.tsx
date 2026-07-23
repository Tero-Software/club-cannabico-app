import { P, H2, H3, UL, ExternalLink, InternalLink } from "@/components/institutional";

export default function MunchiesBajon() {
  return (
    <>
      <P>
        Llamémoslo como cada uno lo llama: el bajón, los munchies, el ataque
        de hambre, la urgencia repentina de alfajor, fainá, milanesa de
        heladera fría. Le pasa a casi todo el mundo que fuma cannabis, sin
        importar si comió hace media hora o si jura que no tiene hambre. Es
        uno de los efectos más universales y reproducibles del THC, y la
        ciencia lo entiende bastante bien. Acá va lo que sabemos, contado
        con lo que efectivamente se publicó en revistas serias.
      </P>

      <H2>Lo que pasa en el cerebro: el switch invertido</H2>
      <P>
        El hallazgo más impactante sobre el origen biológico del bajón se
        publicó en febrero de 2015 en{" "}
        <em>Nature</em>, una de las revistas científicas más prestigiosas del
        mundo. El paper, titulado{" "}
        <ExternalLink href="https://www.nature.com/articles/nature14260">
          “Hypothalamic POMC neurons promote cannabinoid-induced feeding”
        </ExternalLink>
        , tiene como autores principales a Marco Koch (Universidad de
        Leipzig) y Tamas Horvath (Universidad de Yale).
      </P>
      <P>
        El hallazgo es contraintuitivo. En el hipotálamo hay un grupo de
        neuronas llamadas POMC cuya función conocida desde hace décadas es
        justamente <strong>frenar el hambre</strong>: cuando se activan, le
        dicen al cerebro “estás lleno, parar de comer”. Lo esperable era
        que el THC, al dar hambre, las desactivara. Koch y Horvath
        encontraron en ratones lo contrario: el THC <em>activa</em> las
        neuronas POMC, pero las activa de un modo distinto.
      </P>
      <P>
        El gen POMC codifica dos péptidos distintos. Uno es alfa-MSH, que
        suprime el apetito. El otro es beta-endorfina, un opioide endógeno
        que estimula el apetito y refuerza la sensación de placer al comer.
        En condiciones normales, las neuronas POMC liberan principalmente
        alfa-MSH y nos sentimos satisfechos. Bajo el efecto del THC, esas
        mismas neuronas cambian de cassette y empiezan a liberar
        principalmente beta-endorfina. Resultado: el receptor de saciedad se
        convirtió en receptor de hambre. El cerebro está leyendo “no comer
        más” como “seguir comiendo”.
      </P>

      <H2>El otro frente: el sentido del olfato y del gusto se amplifican</H2>
      <P>
        Un equipo dirigido por Giovanni Marsicano publicó en{" "}
        <em>Nature Neuroscience</em> en 2014 un estudio
        complementario: el THC, vía los receptores CB1 en el bulbo olfatorio,
        aumenta significativamente la sensibilidad al olor. En ratones, esto
        se traduce en más interés y consumo de comida. En personas, todo el
        mundo que fumó alguna vez sabe la sensación: la heladera abierta
        huele diferente, la milanesa fría tiene otro estatus, el helado del
        freezer adquiere una dignidad inesperada.
      </P>
      <P>
        Hay otra capa: la corteza gustativa también tiene receptores
        cannabinoides, y el THC parece intensificar la percepción del sabor,
        en particular el dulce, según trabajos en modelos animales. Por eso
        el bajón no se calma con cualquier cosa salada y aburrida: lo que
        pide el sistema es densidad calórica, dulce, grasa.
      </P>

      <H2>La ghrelina y el sistema endocannabinoide</H2>
      <P>
        La ghrelina es la hormona del hambre por excelencia. La produce el
        estómago y le avisa al cerebro que es hora de comer. Lo que se
        descubrió más recientemente es que el sistema endocannabinoide (los
        receptores CB1 y los cannabinoides que el propio cuerpo produce,
        como la anandamida) está río arriba de la ghrelina. Una{" "}
        <ExternalLink href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8696263/">
          investigación publicada en 2021 en Frontiers in Cellular Neuroscience
        </ExternalLink>{" "}
        documentó que los receptores CB1 y los de ghrelina forman
        “heterómeros” en el cuerpo estriado y se modulan mutuamente.
      </P>
      <P>
        La consecuencia funcional es clave: ratones modificados
        genéticamente para no tener receptores CB1 no responden a la
        ghrelina, no les da hambre aunque les administren la hormona. El
        sistema endocannabinoide no es un actor secundario del hambre: es
        parte del circuito principal. Y cuando un cannabinoide externo
        (THC) entra al sistema, cae justo en el centro de ese circuito.
      </P>

      <H2>Por qué da hambre incluso después de comer</H2>
      <P>
        Acá viene lo más contraintuitivo: el bajón no respeta la saciedad
        real. Alguien que acaba de comerse un asado completo igual puede
        fumar y querer un postre serio. El THC actúa en el cableado del
        cerebro, no en el estado real del estómago. El estómago manda
        señales de saciedad, pero el “termostato” cerebral que las
        interpreta está reseteado por el THC. El cuerpo dice “estoy lleno”,
        el cerebro dice “tengo hambre”, y gana el cerebro porque es el que
        decide ir hasta la cocina.
      </P>
      <P>
        Esto también explica por qué el bajón es más fuerte con ciertas
        variantes de cannabis y menos con otras, y por qué los usuarios
        regulares reportan que con el tiempo el efecto se atenúa. La
        habituación a niveles de CB1 estimulados de forma crónica baja la
        respuesta, pero no la elimina nunca del todo.
      </P>

      <H2>¿Y nutricionalmente qué onda?</H2>
      <P>
        El bajón en sí no es bueno ni malo: es una respuesta biológica. Su
        impacto en la salud depende de qué se hace con él. Algunas
        observaciones honestas a partir de la literatura:
      </P>
      <UL>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Uso médico:</strong>{" "}
          esta misma respuesta es justamente la razón por la cual el cannabis
          (y derivados sintéticos como el dronabinol) se aprobaron como
          tratamiento contra la pérdida de apetito en pacientes con cáncer
          terminal, VIH avanzado o trastornos de la alimentación. Es un
          efecto terapéuticamente útil.
        </li>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Paradoja epidemiológica:</strong>{" "}
          a pesar del bajón, varios estudios poblacionales (por ejemplo el de{" "}
          Le Strat y Le Foll en{" "}
          <em>American Journal of Epidemiology</em>, 2011) encontraron que
          los usuarios regulares de cannabis tienen tasas de obesidad más
          bajas que los no usuarios. La hipótesis es que el uso crónico
          desensibiliza parcialmente el sistema CB1 y modifica el
          metabolismo basal. Pero el dato es observacional: correlación, no
          causalidad probada.
        </li>
        <li>
          <strong className="text-[var(--foreground)] font-medium">Estrategia práctica:</strong>{" "}
          si el bajón es un problema (por ejemplo para alguien que cuida la
          alimentación), las recomendaciones de reducción de daños son
          tener alimentos bien elegidos a mano antes de consumir: fruta,
          yogur, frutos secos, sándwich preparado. El bajón va a venir; lo
          que cambia es lo que encuentra.
        </li>
      </UL>

      <H2>El bajón en el contexto rioplatense</H2>
      <P>
        Hay una pieza cultural local que vale mencionar: la canasta típica
        del bajón uruguayo y argentino tiene un perfil bien marcado.
        Alfajor (sobre todo los de dulce de leche con baño de chocolate),
        bizcochos, una tabla de quesos, milanesa fría con limón, helado,
        fainá, pizza recalentada. Hay productos comerciales que adoptaron
        el nombre del fenómeno, como el “Alfajor Rastaman” o el “Alfajor
        Bajonero”. Densidad calórica, dulce, grasa, sabor concentrado:
        todo encaja con lo que la neurociencia predice que el sistema
        endocannabinoide va a buscar cuando está activado.
      </P>
      <P>
        No es casualidad, ni es invento del marketing: es biología que
        terminó moldeando un hábito cultural.
      </P>

      <H2>El sistema endocannabinoide, en perspectiva</H2>
      <P>
        Lo que el bajón deja ver es que el sistema endocannabinoide no
        existe para el cannabis: es al revés. El cannabis funciona porque
        el sistema endocannabinoide ya estaba ahí, regulando hambre, sueño,
        dolor, memoria, ánimo, temperatura corporal, sistema inmunitario.
        El THC simplemente encaja en los mismos receptores que usan los
        cannabinoides que el propio cuerpo produce (anandamida, 2-AG, entre
        otros). Esa universalidad del sistema explica por qué los efectos
        del cannabis son tan amplios y, a la vez, tan reconocibles entre
        personas distintas.
      </P>

      <H2>Sobre el marco regulatorio uruguayo</H2>
      <P>
        En Uruguay, el acceso al cannabis psicoactivo está regulado por la{" "}
        <ExternalLink href="https://www.impo.com.uy/bases/leyes/19172-2013">
          Ley 19.172
        </ExternalLink>{" "}
        y el{" "}
        <ExternalLink href="https://www.impo.com.uy/bases/decretos/120-2014">
          Decreto 120/014
        </ExternalLink>
        , con tres vías legales: autocultivo, club de membresía y farmacia.
        Más detalle en{" "}
        <InternalLink href="/blog/club-autocultivo-farmacia-tres-vias">
          la comparativa de las tres vías
        </InternalLink>{" "}
        y en{" "}
        <InternalLink href="/marco-legal">la página de marco legal</InternalLink>
        .
      </P>

      <H2>Próximos pasos</H2>
      <P>
        Si te interesó la mirada en reducción de daños y consumo informado,
        leé{" "}
        <InternalLink href="/blog/cuidados-al-consumir-mezclas-y-palida">
          el artículo sobre cuidados al consumir, mezclas y palida
        </InternalLink>
        . Si querés conocer cómo funciona la vía del club, mirá{" "}
        <InternalLink href="/como-asociarse">
          cómo asociarse a un club cannábico
        </InternalLink>{" "}
        o iniciá el proceso desde el{" "}
        <InternalLink href="/postulacion">
          formulario de postulación
        </InternalLink>
        .
      </P>

      <H2>Términos relacionados</H2>
      <P>
        munchies cannabis, por qué da hambre fumar marihuana, bajón
        marihuana, ataque de hambre cannabis, alfajor rastaman, alfajor
        bajonero, dulce de leche bajón, comida para el bajón, sistema
        endocannabinoide hambre, THC apetito, CB1 receptor hambre, ghrelina
        cannabis, neuronas POMC THC, Koch Horvath Yale, cannabis y
        alimentación, autocultivo Uruguay, club cannábico Montevideo,
        cannabis Canelones, IRCCA.
      </P>
    </>
  );
}
