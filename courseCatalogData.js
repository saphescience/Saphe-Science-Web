(() => {
  const l = (es, en) => ({ es, en });
  const block = (es, en, topicsEs, topicsEn) => ({ title: l(es, en), text: l(topicsEs, topicsEn) });
  const branch = (title, step, children) => ({ title, step, children });
  const subject = (title, blocks, extra = {}) => ({ title, blocks, ...extra });
  const link = (es, en, href) => ({ title: l(es, en), href });
  const esoSource = link('BOE · Enseñanzas mínimas de ESO', 'BOE · National ESO curriculum', 'https://www.boe.es/eli/es/rd/2022/03/29/217/con');
  const bachSource = link('BOE · Enseñanzas mínimas de Bachillerato', 'BOE · National Bachillerato curriculum', 'https://www.boe.es/eli/es/rd/2022/04/05/243/con');
  const pauSource = link('BOE · Marco estatal de la PAU', 'BOE · National PAU framework', 'https://www.boe.es/eli/es/rd/2024/06/11/534/con');
  const ibBase = 'https://www.ibo.org/programmes/diploma-programme/curriculum/';
  const ibSource = (path, es, en) => link(`IB · ${es}`, `IB · ${en}`, ibBase + path);
  const ibPhysics = ibSource('sciences/physics/', 'Física', 'Physics');
  const ibChemistry = ibSource('sciences/chemistry/', 'Química', 'Chemistry');
  const ibBiology = ibSource('sciences/biology/', 'Biología', 'Biology');

  const maths = l('Matemáticas', 'Mathematics');
  const pc = l('Física y Química', 'Physics and Chemistry');
  const physics = l('Física', 'Physics');
  const chemistry = l('Química', 'Chemistry');
  const conditional = l('Si cursas esta materia.', 'If you take this subject.');
  const numbers = (es, en) => block('Números y operaciones', 'Numbers and operations', es, en);
  const algebra = (es, en) => block('Álgebra', 'Algebra', es, en);
  const geometry = (es, en) => block('Geometría y medida', 'Geometry and measurement', es, en);
  const functions = (es, en) => block('Funciones y análisis', 'Functions and analysis', es, en);
  const stats = (es, en) => block('Estadística y probabilidad', 'Statistics and probability', es, en);
  const mechanics = (es, en) => block('Movimiento, fuerzas y energía', 'Motion, forces and energy', es, en);
  const matter = (es, en) => block('Materia y estructura', 'Matter and structure', es, en);
  const reactions = (es, en) => block('Reacciones químicas', 'Chemical reactions', es, en);
  const esoStats = stats('Datos, tablas, gráficos y probabilidad.', 'Data, tables, graphs and probability.');
  const esoYear = (n, subjects) => branch(l(`${n}.º ESO`, `ESO Year ${n}`), 'subject', subjects);
  const eso = [
    esoYear(1, [subject(maths, [
      numbers('Naturales, enteros, decimales, fracciones, operaciones y divisibilidad.', 'Natural numbers, integers, decimals, fractions, operations and divisibility.'),
      algebra('Proporcionalidad, porcentajes e introducción al lenguaje algebraico.', 'Proportionality, percentages and an introduction to algebra.'),
      geometry('Figuras planas, perímetros, áreas y unidades de medida.', 'Plane figures, perimeter, area and units of measurement.'), esoStats,
    ])]),
    esoYear(2, [subject(maths, [
      numbers('Enteros y racionales, potencias, raíces y proporcionalidad.', 'Integers and rational numbers, powers, roots and proportionality.'),
      algebra('Expresiones algebraicas y ecuaciones de primer grado.', 'Algebraic expressions and linear equations.'),
      functions('Relaciones, funciones y gráficas.', 'Relations, functions and graphs.'),
      geometry('Semejanza, áreas y volúmenes.', 'Similarity, area and volume.'), esoStats,
    ]), subject(pc, [
      block('Investigación científica', 'Scientific inquiry', 'Hipótesis, medidas y registro de resultados.', 'Hypotheses, measurements and recording results.'),
      matter('Propiedades de la materia, estados, mezclas, sustancias y modelos de partículas.', 'Properties of matter, states, mixtures, substances and particle models.'),
      mechanics('Introducción al movimiento, las fuerzas y las transformaciones de energía.', 'Introduction to motion, forces and energy transfers.'),
    ], { note: conditional })]),
    esoYear(3, [subject(maths, [
      numbers('Racionales, potencias, radicales y aproximaciones.', 'Rational numbers, powers, radicals and approximations.'),
      algebra('Polinomios, ecuaciones y sistemas.', 'Polynomials, equations and simultaneous equations.'),
      functions('Proporcionalidad y representación de funciones.', 'Proportionality and graphing functions.'),
      geometry('Figuras, cuerpos y relaciones geométricas.', 'Shapes, solids and geometric relationships.'), esoStats,
    ]), subject(pc, [
      matter('Átomos, tabla periódica e introducción al enlace químico.', 'Atoms, the periodic table and an introduction to chemical bonding.'),
      reactions('Formulación elemental y reacciones sencillas.', 'Basic chemical formulae and simple reactions.'),
      mechanics('Movimiento, fuerzas, energía y electricidad.', 'Motion, forces, energy and electricity.'),
    ], { note: conditional })]),
    esoYear(4, [
      subject(l('Matemáticas A', 'Mathematics A'), [
        numbers('Números reales, estimación, porcentajes y educación financiera.', 'Real numbers, estimation, percentages and financial literacy.'),
        algebra('Polinomios, ecuaciones, sistemas e inecuaciones en problemas contextualizados.', 'Polynomials, equations, simultaneous equations and inequalities in context.'),
        functions('Modelización de situaciones mediante gráficas y funciones.', 'Modelling situations with graphs and functions.'),
        geometry('Medición, escalas y representación de figuras.', 'Measurement, scale and representing shapes.'),
        stats('Interpretación de datos, distribuciones y probabilidad.', 'Interpreting data, distributions and probability.'),
      ]),
      subject(l('Matemáticas B', 'Mathematics B'), [
        numbers('Números reales, radicales y logaritmos.', 'Real numbers, radicals and logarithms.'),
        algebra('Polinomios, fracciones algebraicas, ecuaciones, sistemas e inecuaciones.', 'Polynomials, algebraic fractions, equations, simultaneous equations and inequalities.'),
        functions('Familias de funciones y sus gráficas.', 'Families of functions and their graphs.'),
        geometry('Trigonometría y geometría analítica.', 'Trigonometry and coordinate geometry.'),
        stats('Análisis de datos y probabilidad.', 'Data analysis and probability.'),
      ]),
      subject(pc, [
        mechanics('Movimiento rectilíneo y aceleración, leyes de Newton, equilibrio, gravitación, trabajo y energía.', 'Linear motion and acceleration, Newton’s laws, equilibrium, gravitation, work and energy.'),
        block('Fluidos', 'Fluids', 'Presión y fuerzas en fluidos.', 'Pressure and forces in fluids.'),
        matter('Estructura de la materia, enlace y formulación.', 'Structure of matter, bonding and chemical formulae.'),
        reactions('Ajuste de reacciones y estequiometría.', 'Balancing equations and stoichiometry.'),
      ], { note: conditional }),
    ]),
  ];

  const mathI = subject(l('Matemáticas I', 'Mathematics I'), [
    numbers('Números reales y complejos.', 'Real and complex numbers.'),
    algebra('Expresiones algebraicas, ecuaciones y sistemas.', 'Algebraic expressions, equations and simultaneous equations.'),
    geometry('Trigonometría, vectores y geometría analítica en el plano.', 'Trigonometry, vectors and coordinate geometry in the plane.'),
    functions('Funciones, límites, continuidad e introducción a la derivada.', 'Functions, limits, continuity and an introduction to differentiation.'),
    stats('Datos bivariantes, correlación y probabilidad.', 'Bivariate data, correlation and probability.'),
  ]);
  const mathII = subject(l('Matemáticas II', 'Mathematics II'), [
    algebra('Matrices, determinantes y sistemas lineales.', 'Matrices, determinants and systems of linear equations.'),
    geometry('Vectores, rectas, planos, distancias y ángulos en el espacio.', 'Vectors, lines, planes, distances and angles in space.'),
    functions('Límites, continuidad, derivadas, optimización, integrales y cálculo de áreas.', 'Limits, continuity, derivatives, optimisation, integration and areas.'),
    stats('Probabilidad condicionada, Bayes y distribuciones.', 'Conditional probability, Bayes and distributions.'),
  ]);
  const social = n => l(`Matemáticas Aplicadas a las Ciencias Sociales ${n}`, `Mathematics Applied to Social Sciences ${n}`);
  const socialI = subject(social('I'), [
    numbers('Números reales, porcentajes, interés y herramientas financieras.', 'Real numbers, percentages, interest and financial tools.'),
    algebra('Ecuaciones, sistemas e inecuaciones aplicados a problemas sociales.', 'Equations, simultaneous equations and inequalities in social contexts.'),
    functions('Modelos funcionales, gráficas, límites y tasas de variación.', 'Function models, graphs, limits and rates of change.'),
    stats('Datos univariantes y bivariantes, regresión y probabilidad.', 'Univariate and bivariate data, regression and probability.'),
  ]);
  const socialII = subject(social('II'), [
    algebra('Matrices, sistemas lineales y programación lineal.', 'Matrices, linear systems and linear programming.'),
    functions('Continuidad, derivación, optimización e integración en contextos sociales.', 'Continuity, differentiation, optimisation and integration in social contexts.'),
    stats('Probabilidad condicionada, Bayes, distribuciones binomial y normal e inferencia.', 'Conditional probability, Bayes, binomial and normal distributions, and inference.'),
  ]);
  const pcBach = subject(pc, [
    matter('Estructura de la materia, enlace, formulación y nomenclatura.', 'Structure of matter, bonding, formulae and nomenclature.'),
    reactions('Ajuste, estequiometría e introducción a la química orgánica.', 'Balancing equations, stoichiometry and introductory organic chemistry.'),
    mechanics('Cinemática, dinámica, trabajo y energía.', 'Kinematics, dynamics, work and energy.'),
  ]);
  const physicsBach = subject(physics, [
    block('Gravitación', 'Gravitation', 'Campo, energía potencial y órbitas.', 'Field, potential energy and orbits.'),
    block('Electromagnetismo', 'Electromagnetism', 'Campos eléctrico y magnético e inducción.', 'Electric and magnetic fields and induction.'),
    block('Ondas y óptica', 'Waves and optics', 'Oscilaciones, propagación de ondas y óptica geométrica.', 'Oscillations, wave propagation and geometrical optics.'),
    block('Física moderna', 'Modern physics', 'Relatividad, cuántica y física nuclear y de partículas.', 'Relativity, quantum physics, nuclear and particle physics.'),
  ]);
  const chemistryBach = subject(chemistry, [
    matter('Estructura atómica, propiedades periódicas y enlace químico.', 'Atomic structure, periodic properties and chemical bonding.'),
    reactions('Termodinámica, cinética, equilibrio, ácido-base y oxidación-reducción.', 'Thermodynamics, kinetics, equilibrium, acid–base and redox reactions.'),
    block('Química orgánica', 'Organic chemistry', 'Grupos funcionales, isomería y reacciones orgánicas.', 'Functional groups, isomerism and organic reactions.'),
  ]);
  const bach = [
    branch(l('1.º de Bachillerato', 'Bachillerato Year 1'), 'subject', [mathI, pcBach, socialI]),
    branch(l('2.º de Bachillerato', 'Bachillerato Year 2'), 'subject', [mathII, physicsBach, chemistryBach, socialII]),
  ];

  const sl = l('SL — Nivel medio', 'SL — Standard Level');
  const hl = l('HL — Nivel superior', 'HL — Higher Level');
  const ibExtra = (es, en) => block('Ampliación HL · ejemplos', 'HL extension · examples', es, en);
  const ibLevels = (title, blocks, extension, source, note) => branch(title, 'level', [
    subject(sl, blocks, { source, note }),
    subject(hl, [...blocks, extension], { source, note }),
  ]);
  const mathNote = l('Resumen para evaluaciones hasta noviembre de 2028. El programa que empieza a impartirse en 2027 se evalúa desde 2029; comprueba la versión de tu convocatoria en el IB.', 'Overview for assessments through November 2028. The curriculum taught from 2027 is first assessed in 2029; check the IB reference for your exam session.');
  const mathReference = ibSource('mathematics/', 'Matemáticas y actualización de 2029', 'Mathematics and the 2029 update');
  const ibMathAA = ibLevels(l('Mathematics: Analysis and Approaches (AA)', 'Mathematics: Analysis and Approaches (AA)'), [
    numbers('Sucesiones, series, exponentes y logaritmos.', 'Sequences, series, exponents and logarithms.'),
    functions('Composición, inversas y gráficas de funciones.', 'Composition, inverses and function graphs.'),
    geometry('Trigonometría, radianes y relaciones geométricas.', 'Trigonometry, radians and geometric relationships.'),
    stats('Descripción de datos, probabilidad y distribuciones.', 'Data description, probability and distributions.'),
    block('Cálculo', 'Calculus', 'Derivación, integración y sus aplicaciones.', 'Differentiation, integration and their applications.'),
  ], ibExtra('Demostración por inducción, números complejos y vectores.', 'Proof by induction, complex numbers and vectors.'), mathReference, mathNote);
  const ibMathAI = ibLevels(l('Mathematics: Applications and Interpretation (AI)', 'Mathematics: Applications and Interpretation (AI)'), [
    numbers('Sucesiones, crecimiento e interés compuesto.', 'Sequences, growth and compound interest.'),
    functions('Selección e interpretación de modelos funcionales.', 'Selecting and interpreting function models.'),
    geometry('Trigonometría aplicada y diagramas de Voronoi.', 'Applied trigonometry and Voronoi diagrams.'),
    stats('Muestreo, regresión, distribuciones y pruebas de hipótesis.', 'Sampling, regression, distributions and hypothesis tests.'),
    block('Cálculo', 'Calculus', 'Tasas de cambio, optimización e integración numérica.', 'Rates of change, optimisation and numerical integration.'),
  ], ibExtra('Matrices, valores propios y ecuaciones diferenciales.', 'Matrices, eigenvalues and differential equations.'), mathReference, mathNote);
  const scienceNote = l('Resumen de la guía con primera evaluación en 2025. Los ejemplos HL no son exhaustivos.', 'Overview of the syllabus first assessed in 2025. HL examples are not exhaustive.');
  const ib = [
    branch(maths, 'pathway', [ibMathAA, ibMathAI]),
    ibLevels(physics, [
      block('Espacio, tiempo y movimiento', 'Space, time and motion', 'Cinemática, momento lineal, trabajo, energía y potencia.', 'Kinematics, momentum, work, energy and power.'),
      block('Materia y comportamiento térmico', 'Matter and thermal behaviour', 'Transferencias térmicas, gases, efecto invernadero y circuitos.', 'Heat transfer, gases, the greenhouse effect and circuits.'),
      block('Comportamiento ondulatorio', 'Wave behaviour', 'Oscilaciones, ondas, resonancia y efecto Doppler.', 'Oscillations, waves, resonance and the Doppler effect.'),
      block('Campos', 'Fields', 'Campos gravitatorio, eléctrico y magnético; movimiento de cargas.', 'Gravitational, electric and magnetic fields; motion of charges.'),
      block('Física nuclear y cuántica', 'Nuclear and quantum physics', 'Átomo, desintegración, fisión y fusión.', 'The atom, radioactive decay, fission and fusion.'),
    ], ibExtra('Sólido rígido, relatividad, termodinámica, inducción y física cuántica.', 'Rigid bodies, relativity, thermodynamics, induction and quantum physics.'), ibPhysics, scienceNote),
    ibLevels(chemistry, [
      block('Estructura 1 · Partículas', 'Structure 1 · Particles', 'Átomo, configuración electrónica, mol y gases ideales.', 'Atomic models, electron configurations, the mole and ideal gases.'),
      block('Estructura 2 · Enlace', 'Structure 2 · Bonding', 'Enlace iónico, covalente y metálico y propiedades de materiales.', 'Ionic, covalent and metallic bonding and material properties.'),
      block('Estructura 3 · Clasificación', 'Structure 3 · Classification', 'Periodicidad y grupos funcionales orgánicos.', 'Periodicity and organic functional groups.'),
      block('Reactividad 1 · Energía', 'Reactivity 1 · Energy', 'Entalpía, ciclos energéticos y combustibles.', 'Enthalpy, energy cycles and fuels.'),
      block('Reactividad 2 · Cantidad, velocidad y equilibrio', 'Reactivity 2 · Amount, rate and equilibrium', 'Estequiometría, cinética y equilibrio.', 'Stoichiometry, kinetics and equilibrium.'),
      block('Reactividad 3 · Mecanismos', 'Reactivity 3 · Mechanisms', 'Transferencia de protones y electrones y reacciones que comparten electrones.', 'Proton and electron transfer and electron-sharing reactions.'),
    ], ibExtra('Entropía y espontaneidad de las reacciones.', 'Entropy and reaction spontaneity.'), ibChemistry, scienceNote),
    ibLevels(l('Biología', 'Biology'), [
      block('Unidad y diversidad', 'Unity and diversity', 'Agua, ácidos nucleicos, células, evolución y biodiversidad.', 'Water, nucleic acids, cells, evolution and biodiversity.'),
      block('Forma y función', 'Form and function', 'Biomoléculas, membranas, transporte, adaptación y nichos.', 'Biomolecules, membranes, transport, adaptation and niches.'),
      block('Interacción e interdependencia', 'Interaction and interdependence', 'Metabolismo, fotosíntesis, defensa y redes ecológicas.', 'Metabolism, photosynthesis, defence and ecological networks.'),
      block('Continuidad y cambio', 'Continuity and change', 'Replicación, herencia, homeostasis, selección natural y clima.', 'Replication, inheritance, homeostasis, natural selection and climate.'),
    ], ibExtra('Origen celular, virus, cladística, motilidad, señalización química y expresión génica.', 'Cell origins, viruses, cladistics, motility, chemical signalling and gene expression.'), ibBiology, scienceNote),
  ];

  const pau = [mathII, socialII, physicsBach, chemistryBach];
  const levels = [
    { ...branch(l('ESO', 'ESO'), 'course', eso), scope: 'eso' },
    { ...branch(l('Bachillerato', 'Spanish Bachillerato'), 'course', bach), scope: 'bachillerato' },
    { ...branch(l('Bachillerato Internacional', 'International Baccalaureate'), 'subject', ib), scope: 'ib' },
    { ...branch(l('PAU', 'PAU'), 'subject', pau), scope: 'pau' },
  ];
  const intensive = (title, available = levels) => branch(title, 'level', available);
  const regional = l('Temario orientativo basado en las enseñanzas mínimas. La secuencia y el alcance pueden variar según la comunidad autónoma y el centro.', 'Indicative syllabus based on national minimum requirements. Topic order and scope can vary by region and school.');
  window.SapheCourseCatalog = {
    es: {
      course: 'Curso', subject: 'Asignatura', level: 'Nivel', pathway: 'Itinerario', intensive: 'Intensivo',
      syllabus: 'Bloques del temario', sources: 'Referencias curriculares',
      exercises: 'Ejercicios tipo PAU', past: 'Exámenes de años anteriores', method: 'Metodología de preparación',
      pending: 'Material pendiente de incorporar.', assessment: 'Evaluación, exámenes y evaluación interna',
    },
    en: {
      course: 'Year', subject: 'Subject', level: 'Level', pathway: 'Pathway', intensive: 'Intensive course',
      syllabus: 'Syllabus topics', sources: 'Curriculum references',
      exercises: 'PAU-style exercises', past: 'Past exam papers', method: 'Preparation approach',
      pending: 'Materials to be added.', assessment: 'Assessment, exams and internal assessment',
    },
    pages: {
      eso: { step: 'course', children: eso, intro: regional, sources: [esoSource] },
      bachillerato: { step: 'course', children: bach, intro: regional, sources: [bachSource] },
      ib: { step: 'subject', children: ib, intro: l('Diploma Programme · Temarios orientativos de apoyo académico independiente. Saphe Science no es un colegio IB ni está afiliada al IB.', 'Diploma Programme · Indicative syllabuses for independent tutoring. Saphe Science is not an IB World School and is not affiliated with the IB.'), sources: [mathReference, ibPhysics, ibChemistry, ibBiology], resources: [{ key: 'assessment' }] },
      pau: {
        step: 'subject', children: pau, intro: l('Preparación orientativa a partir de 2.º de Bachillerato. Consulta el modelo, los contenidos y los criterios de tu comunidad autónoma y convocatoria.', 'Indicative preparation based on Bachillerato Year 2. Check the format, content and marking criteria for your region and exam session.'),
        sources: [pauSource, bachSource],
        resources: [
          { key: 'exercises' },
          { key: 'past', source: link('Comunidad de Madrid · Archivo oficial (ejemplo autonómico)', 'Community of Madrid · Official archive (regional example)', 'https://www.comunidad.madrid/educacion/examenes-pau-estadisticas') },
          { key: 'method' },
        ],
      },
      intensivos: {
        step: 'intensive', intro: l('Consulta los niveles y asignaturas. Fechas, duración, plazas y precios pendientes de confirmar.', 'Browse levels and subjects. Dates, duration, places and prices are yet to be confirmed.'),
        children: [
          intensive(l('Intensivos de verano', 'Summer intensive courses')),
          intensive(l('Intensivos de Navidad', 'Christmas intensive courses')),
          intensive(l('Intensivos de preparación PAU', 'PAU preparation intensives'), [levels[3]]),
          intensive(l('Intensivos de preparación de exámenes', 'Exam preparation intensives')),
        ],
      },
    },
  };
})();
