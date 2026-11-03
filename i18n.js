(() => {
  // Shared interface copy. Student names, notes and file names are not translated.
  const messages = {
  "billing.heading": { "es": "Facturación por alumno", "en": "Student billing" },
  "billing.download": { "es": "Descargar factura", "en": "Download invoice" },
  "billing.downloadPending": { "es": "Descarga de factura pendiente de configurar", "en": "Invoice download is not yet configured" },
  "billing.year": { "es": "Año", "en": "Year" },
  "billing.month": { "es": "Mes", "en": "Month" },
  "billing.annualCalendar": { "es": "Calendario anual", "en": "Yearly calendar" },
  "billing.payer": { "es": "Pagador", "en": "Payer" },
  "billing.hourlyRate": { "es": "Tarifa por hora (€)", "en": "Hourly rate (€)" },
  "billing.save": { "es": "Guardar tarifa y pagador", "en": "Save rate and payer" },
  "billing.classes": { "es": "Clases del mes", "en": "Classes this month" },
  "billing.hours": { "es": "Horas del mes", "en": "Hours this month" },
  "billing.amount": { "es": "Importe de las clases", "en": "Class charges" },
  "billing.payerPending": { "es": "Sin configurar", "en": "Not configured" },
  "billing.dayClasses": { "es": "{date}: {classes}", "en": "{date}: {classes}" },
  "billing.chooseStudent": { "es": "Selecciona un alumno.", "en": "Select a student." },
  "billing.loading": { "es": "Cargando clases y tarifa...", "en": "Loading classes and rate..." },
  "billing.classesError": { "es": "No se han podido cargar las clases para el resumen de facturación.", "en": "Unable to load classes for the billing summary." },
  "billing.settingsError": { "es": "No se ha podido cargar la tarifa y el pagador del alumno.", "en": "Unable to load the student’s hourly rate and payer." },
  "billing.noClasses": { "es": "No hay clases asignadas en este mes.", "en": "There are no classes scheduled this month." },
  "billing.invalidTime": { "es": "Horario inválido", "en": "Invalid time" },
  "billing.invalidClasses": { "es": "Hay clases con un horario inválido. Revisa sus horas antes de calcular el total.", "en": "Some classes have invalid times. Check their times before calculating the total." },
  "billing.saving": { "es": "Guardando tarifa y pagador...", "en": "Saving rate and payer..." },
  "billing.unsaved": { "es": "Cambios sin guardar.", "en": "Unsaved changes." },
  "billing.ratePending": { "es": "Tarifa pendiente de configurar.", "en": "Hourly rate not yet configured." },
  "billing.invalidRate": { "es": "Introduce una tarifa válida, con un máximo de dos decimales.", "en": "Enter a valid rate with no more than two decimal places." },
  "billing.saveError": { "es": "No se ha podido guardar la tarifa y el pagador.", "en": "Unable to save the hourly rate and payer." },
  "billing.saved": { "es": "Tarifa y pagador guardados.", "en": "Hourly rate and payer saved." },
  "billing.breakdown": { "es": "Desglose mensual de clases", "en": "Monthly class breakdown" },
  "billing.date": { "es": "Fecha", "en": "Date" },
  "billing.subject": { "es": "Asignatura", "en": "Subject" },
  "billing.time": { "es": "Horario", "en": "Time" },
  "billing.duration": { "es": "Horas", "en": "Hours" },
  "billing.lineAmount": { "es": "Importe", "en": "Charge" },
  "navSubjects": {
    "es": "Asignaturas",
    "en": "Subjects"
  },
  "navFaqs": {
    "es": "FAQS",
    "en": "FAQS"
  },
  "navSchedule": {
    "es": "Inicio",
    "en": "Home"
  },
  "navContact": {
    "es": "Contacto",
    "en": "Contact"
  },
  "userButton": {
    "es": "Mi perfil",
    "en": "My profile"
  },
  "heroEyebrow": {
    "es": "¿Qué es Saphe Science?",
    "en": "What is Saphe Science?"
  },
  "heroTitle": {
    "es": "Saphe sCience es una academia con clases presenciales y online, especializada en matemáticas y física en castellano e inglés, para alumnos de ESO, Bachillerato y Bachillerato Internacional (IB).",
    "en": "Saphe sCience is an academy offering in-person and online mathematics and physics classes in Spanish and English for students in ESO (Spanish secondary education), Bachillerato (Spanish upper secondary education) and the International Baccalaureate (IB)."
  },
  "heroPrimary": {
    "es": "Reserva una clase",
    "en": "Book a class"
  },
  "heroSecondary": {
    "es": "",
    "en": ""
  },
  "proofYears": {
    "es": "Orientado a la eficacia y la eficiencia.",
    "en": "Focused on effectiveness and efficiency."
  },
  "proofSubjects": {
    "es": "En uno mismo, la clave es no rendirse.",
    "en": "Self-confidence: the key is not giving up."
  },
  "proofLanguages": {
    "es": "Con esfuerzo en la dirección correcta lograrás lo que te propongas.",
    "en": "With effort in the right direction, you can achieve your goals."
  },
  "introEyebrow": {
    "es": "Qué es Saphe sCience",
    "en": "What is Saphe sCience"
  },
  "introTitle": {
    "es": "Entiende, estudia y resuelve.",
    "en": "Understand, study and solve."
  },
  "introText": {
    "es": "A través de clases online en grupos reducidos o individuales, cada alumno recibe una atención cercana y adaptada a su nivel, reforzando los conceptos, resolviendo dudas y aprendiendo a enfrentarse a los problemas con seguridad.",
    "en": "Through online classes in small groups or individually, each student receives close attention adapted to their level, reinforcing concepts, resolving doubts and learning to approach problems with confidence."
  },
  "subjectsEyebrow": {
    "es": "Asignaturas",
    "en": "Subjects"
  },
  "subjectsTitle": {
    "es": "Ciencia sin ruido, paso a paso.",
    "en": "Science without noise, step by step."
  },
  "mathTitle": {
    "es": "Matematicas",
    "en": "Mathematics"
  },
  "mathText": {
    "es": "Algebra, funciones, geometria, trigonometria y calculo. Trabajamos el razonamiento para que el alumno sepa como empezar cada problema.",
    "en": "Algebra, functions, geometry, trigonometry and calculus. We work on reasoning so students know how to start each problem."
  },
  "physicsTitle": {
    "es": "Fisica",
    "en": "Physics"
  },
  "physicsText": {
    "es": "Cinematica, dinamica, energia, campos y problemas numericos. Conectamos formulas, unidades y significado fisico.",
    "en": "Kinematics, dynamics, energy, fields and numerical problems. We connect formulas, units and physical meaning."
  },
  "methodEyebrow": {
    "es": "FAQS",
    "en": "FAQS"
  },
  "methodTitle": {
    "es": "FAQs:",
    "en": "FAQs:"
  },
  "stepOneTitle": {
    "es": "¿Cómo empiezo?",
    "en": "How do I start?"
  },
  "stepOneText": {
    "es": "Ponte en contacto con nosotros y te ayudaremos a elegir el horario que mejor se adapte a ti.",
    "en": "Get in touch with us and we will help you choose the schedule that suits you best."
  },
  "stepTwoTitle": {
    "es": "¿Dónde se imparten las clases?",
    "en": "Where are classes held?"
  },
  "stepTwoText": {
    "es": "Una vez creado el perfil del alumno, aparecerá un enlace para unirte a la clase a través del correo electrónico.",
    "en": "Once the student profile is created, a link to join the class will be provided by email."
  },
  "stepThreeTitle": {
    "es": "¿Seguimiento?",
    "en": "How is progress tracked?"
  },
  "stepThreeText": {
    "es": "El alumno tendrá acceso a los pdf de la clase, un horario actualizado de las tareas y las notas para que el seguimiento sea el adecuado.",
    "en": "Students can access class PDFs, an up-to-date task schedule and teacher notes to keep track of their progress."
  },
  "stepFourTitle": {
    "es": "¿Dudas?",
    "en": "Questions?"
  },
  "stepFourText": {
    "es": "Puedes enviar un WhatsApp en cualquier momento para resolver dudas fuera del horario de la clase al número +34 660 74 37 39.",
    "en": "You can send a WhatsApp message at any time to resolve questions outside class time at +34 660 74 37 39."
  },
  "scheduleEyebrow": {
    "es": "Disponibilidad",
    "en": "Availability"
  },
  "scheduleTitle": {
    "es": "Contacto",
    "en": "Contact"
  },
  "availabilityIntro": {
    "es": "Si quieres información sobre disponibilidad, mándanos un mensaje al",
    "en": "If you want information about availability, send us a message at"
  },
  "availabilityPhone": {
    "es": "+34 660 74 37 39",
    "en": "+34 660 74 37 39"
  },
  "availabilityMiddle": {
    "es": "o escríbenos un correo a",
    "en": "or email us at"
  },
  "contactEyebrow": {
    "es": "Reserva una clase:",
    "en": "Book a class:"
  },
  "contactTitle": {
    "es": "Cuéntanos curso, asignatura y objetivo.",
    "en": "Tell us the course, subject and goal."
  },
  "contactText": {
    "es": "Te orientamos con el mejor punto de partida y buscamos un hueco que encaje con el alumno.",
    "en": "We will guide you towards the best starting point and find a slot that fits the student."
  },
  "footerText": {
    "es": "Academy",
    "en": "Academy"
  },
  "time": {
    "es": "Hora",
    "en": "Time"
  },
  "available": {
    "es": "Libre",
    "en": "Available"
  },
  "busy": {
    "es": "No disponible",
    "en": "Unavailable"
  },
  "schedulePrompt": {
    "es": "Selecciona un hueco libre para ver el detalle.",
    "en": "Select an open slot to view the details."
  },
  "selectedSlot": {
    "es": "{subject}: {day} a las {hour}.",
    "en": "{subject}: {day} at {hour}."
  },
  "selectedHelp": {
    "es": "Escribenos para reservar este hueco.",
    "en": "Write to us to reserve this slot."
  },
  "bookingEyebrow": {
    "es": "Inscripcion",
    "en": "Registration"
  },
  "bookingTitle": {
    "es": "Inscribirse a la clase",
    "en": "Book a class"
  },
  "bookingName": {
    "es": "Nombre",
    "en": "Name"
  },
  "bookingSurname": {
    "es": "Apellido",
    "en": "Surname"
  },
  "bookingEmail": {
    "es": "Correo electronico",
    "en": "Email"
  },
  "bookingSubmit": {
    "es": "Enviar inscripcion",
    "en": "Submit booking"
  },
  "profileEyebrow": {
    "es": "Perfil del alumno",
    "en": "Student profile"
  },
  "profileTitle": {
    "es": "Mi usuario",
    "en": "My account"
  },
  "profileClasses": {
    "es": "Clases de interes",
    "en": "Classes of interest"
  },
  "profileSave": {
    "es": "Guardar perfil",
    "en": "Save profile"
  },
  "profileSaved": {
    "es": "Perfil guardado.",
    "en": "Profile saved."
  },
  "bookingSaved": {
    "es": "Inscripcion guardada en tu perfil.",
    "en": "Registration saved in your profile."
  },
  "days": {
    "es": [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes"
    ],
    "en": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ]
  },
  "subjects.mathEs": {
    "es": "Matemáticas en castellano",
    "en": "Mathematics in Spanish"
  },
  "subjects.mathEn": {
    "es": "Cálculo en inglés",
    "en": "Calculus in English"
  },
  "subjects.physicsEs": {
    "es": "Física en castellano",
    "en": "Physics in Spanish"
  },
  "subjects.physicsEn": {
    "es": "Física en inglés",
    "en": "Physics in English"
  },
  "ui.signIn": {
    "es": "Acceso",
    "en": "Sign in"
  },
  "ui.studentAccess": {
    "es": "Acceso del alumno",
    "en": "Student access"
  },
  "ui.confirm": {
    "es": "Aceptar",
    "en": "Confirm"
  },
  "ui.student": {
    "es": "Alumno",
    "en": "Student"
  },
  "ui.students": {
    "es": "Alumnos",
    "en": "Students"
  },
  "ui.enrolledStudents": {
    "es": "Alumnos inscritos",
    "en": "Enrolled students"
  },
  "ui.subjectToEdit": {
    "es": "Asignatura para editar",
    "en": "Subject to edit"
  },
  "ui.addClass": {
    "es": "Añadir clase",
    "en": "Add class"
  },
  "ui.calculusEN": {
    "es": "Calculus EN",
    "en": "Calculus EN"
  },
  "ui.calendar": {
    "es": "Calendario",
    "en": "Calendar"
  },
  "ui.readOnlyCalendarClassesScheduledByYourTeacherAreHighlighted": {
    "es": "Calendario de lectura: tus clases se muestran marcadas por el profesor.",
    "en": "Read-only calendar: classes scheduled by your teacher are highlighted."
  },
  "ui.editableCalendarChooseAStudentDayAndTimeToSaveAClass": {
    "es": "Calendario editable: elige alumno, día y horario para guardar una clase.",
    "en": "Editable calendar: choose a student, day and time to save a class."
  },
  "ui.readOnlyOverviewAllStudentsClassesAppearHere": {
    "es": "Calendario general de lectura: aquí aparecen todas las clases de todos los alumnos.",
    "en": "Read-only overview: all students’ classes appear here."
  },
  "ui.spanish": {
    "es": "Castellano",
    "en": "Spanish"
  },
  "ui.closeSignInDialog": {
    "es": "Cerrar acceso",
    "en": "Close sign-in dialog"
  },
  "ui.closeForm": {
    "es": "Cerrar formulario",
    "en": "Close form"
  },
  "ui.closeMaterial": {
    "es": "Cerrar material",
    "en": "Close material"
  },
  "ui.closeNote": {
    "es": "Cerrar nota",
    "en": "Close note"
  },
  "ui.class": {
    "es": "Clase",
    "en": "Class"
  },
  "ui.completedClasses": {
    "es": "Clases dadas",
    "en": "Completed classes"
  },
  "ui.allStudentsClasses": {
    "es": "Clases de todos los alumnos",
    "en": "All students’ classes"
  },
  "ui.confidence": {
    "es": "Confianza,",
    "en": "Confidence,"
  },
  "ui.password": {
    "es": "Contraseña",
    "en": "Password"
  },
  "ui.studentPassword": {
    "es": "Contraseña del alumno",
    "en": "Student password"
  },
  "ui.email": {
    "es": "Correo electrónico",
    "en": "Email"
  },
  "ui.studentEmail": {
    "es": "Correo electrónico del alumno",
    "en": "Student email"
  },
  "ui.accountEmail": {
    "es": "Correo original del usuario",
    "en": "Account email"
  },
  "ui.createAccess": {
    "es": "Crear acceso",
    "en": "Create access"
  },
  "ui.setANewPassword": {
    "es": "Crear nueva contraseña",
    "en": "Set a new password"
  },
  "ui.createAnAccount": {
    "es": "Crear una cuenta",
    "en": "Create an account"
  },
  "ui.keyInformation": {
    "es": "Datos principales",
    "en": "Key information"
  },
  "ui.day": {
    "es": "Día",
    "en": "Day"
  },
  "ui.editStudentClasses": {
    "es": "Editar clases del alumno",
    "en": "Edit student classes"
  },
  "ui.chooseARegisteredStudentAndSetTheExactTime": {
    "es": "Elige un alumno registrado y ajusta el horario exacto.",
    "en": "Choose a registered student and set the exact time."
  },
  "ui.deleteStudent": {
    "es": "Eliminar alumno",
    "en": "Delete student"
  },
  "ui.classLink": {
    "es": "Enlace de la clase",
    "en": "Class link"
  },
  "ui.linkToJoinYourOnlineClass": {
    "es": "Enlace para acceder a tu clase online.",
    "en": "Link to join your online class."
  },
  "ui.linkNotYetAvailable": {
    "es": "Enlace pendiente",
    "en": "Link not yet available"
  },
  "ui.signIn8515": {
    "es": "Entrar",
    "en": "Sign in"
  },
  "ui.sendAWhatsAppMessageTo660743739": {
    "es": "Enviar WhatsApp al 660 74 37 39",
    "en": "Send a WhatsApp message to 660 74 37 39"
  },
  "ui.sendEmail": {
    "es": "Enviar correo",
    "en": "Send email"
  },
  "ui.sendAnEmailToInfoSaphescienceCom": {
    "es": "Enviar correo a info@saphescience.com",
    "en": "Send an email to info@saphescience.com"
  },
  "ui.writeANoteForThisClass": {
    "es": "Escribe aquí la nota de esta clase",
    "en": "Write a note for this class"
  },
  "ui.myOnlineClassroom": {
    "es": "Espacio para mi clase",
    "en": "My online classroom"
  },
  "ui.todaysDate": {
    "es": "Fecha de hoy",
    "en": "Today’s date"
  },
  "ui.physicsES": {
    "es": "Física ES",
    "en": "Physics ES"
  },
  "ui.manageStudentsAndScheduleTheClassesThatAppearInTheirStudentCalendars": {
    "es": "Gestiona alumnos y marca las clases que aparecerán en el calendario del perfil del alumno.",
    "en": "Manage students and schedule the classes that appear in their student calendars."
  },
  "ui.saveOrUpdateStudentAccessAndUseTheEditableCalendarToScheduleClasses": {
    "es": "Guarda o actualiza el acceso del alumno y usa el calendario editable para sus clases.",
    "en": "Save or update student access and use the editable calendar to schedule classes."
  },
  "ui.saveStudent": {
    "es": "Guardar alumno",
    "en": "Save student"
  },
  "ui.saveClass": {
    "es": "Guardar clase",
    "en": "Save class"
  },
  "ui.saveLink": {
    "es": "Guardar enlace",
    "en": "Save link"
  },
  "ui.endTime": {
    "es": "Hora de fin",
    "en": "End time"
  },
  "ui.startTime": {
    "es": "Hora de inicio",
    "en": "Start time"
  },
  "ui.today": {
    "es": "Hoy",
    "en": "Today"
  },
  "ui.languages": {
    "es": "Idiomas",
    "en": "Languages"
  },
  "ui.goToTheSapheScienceHomePage": {
    "es": "Ir al inicio de Saphe sCience",
    "en": "Go to the Saphe Science home page"
  },
  "ui.mathematicsES": {
    "es": "Matemáticas ES",
    "en": "Mathematics ES"
  },
  "ui.classMaterial": {
    "es": "Material de clase",
    "en": "Class material"
  },
  "ui.editingMenu": {
    "es": "Menú de edición",
    "en": "Editing menu"
  },
  "ui.currentMonth": {
    "es": "Mes actual",
    "en": "Current month"
  },
  "ui.myClassCalendar": {
    "es": "Mi calendario de clases:",
    "en": "My class calendar:"
  },
  "ui.myClass": {
    "es": "Mi clase",
    "en": "My class"
  },
  "ui.mySchedule": {
    "es": "Mi horario",
    "en": "My schedule"
  },
  "ui.myAccountSapheScience": {
    "es": "Mi usuario | Saphe sCience",
    "en": "My account | Saphe Science"
  },
  "ui.method": {
    "es": "Método,",
    "en": "Method,"
  },
  "ui.mainNavigation": {
    "es": "Navegacion principal",
    "en": "Main navigation"
  },
  "ui.username": {
    "es": "Nombre de usuario",
    "en": "Username"
  },
  "ui.studentFirstName": {
    "es": "Nombre del alumno",
    "en": "Student first name"
  },
  "ui.teachersNote": {
    "es": "Nota del profesor",
    "en": "Teacher’s note"
  },
  "ui.notesForTheStudent": {
    "es": "Notas para el alumno",
    "en": "Notes for the student"
  },
  "ui.newPassword": {
    "es": "Nueva contraseña",
    "en": "New password"
  },
  "ui.forgotPassword": {
    "es": "Olvidé mi contraseña",
    "en": "Forgot password"
  },
  "ui.classPDF": {
    "es": "PDF de la clase",
    "en": "Class PDF"
  },
  "ui.teacherDashboardAndClassManagement": {
    "es": "Panel del profesor y gestion de clases.",
    "en": "Teacher dashboard and class management."
  },
  "ui.studentProfileAndClassCalendar": {
    "es": "Perfil de alumno y calendario de inscripción.",
    "en": "Student profile and class calendar."
  },
  "ui.teacherProfile": {
    "es": "Perfil del profesor",
    "en": "Teacher profile"
  },
  "ui.teacher": {
    "es": "Profesor",
    "en": "Teacher"
  },
  "ui.teacherSapheScience": {
    "es": "Profesor | Saphe sCience",
    "en": "Teacher | Saphe Science"
  },
  "ui.resetPassword": {
    "es": "Recuperar contraseña",
    "en": "Reset password"
  },
  "ui.signUp": {
    "es": "Registro",
    "en": "Sign up"
  },
  "ui.confirmPassword": {
    "es": "Repetir contraseña",
    "en": "Confirm password"
  },
  "ui.confirmNewPassword": {
    "es": "Repetir nueva contraseña",
    "en": "Confirm new password"
  },
  "ui.removeClass": {
    "es": "Retirar clase",
    "en": "Remove class"
  },
  "ui.signOut": {
    "es": "Salir",
    "en": "Sign out"
  },
  "ui.sapheScienceOnlineAcademy": {
    "es": "Saphe sCience | Academia online",
    "en": "Saphe Science | Online academy"
  },
  "ui.languageSelection": {
    "es": "Seleccion de idioma",
    "en": "Language selection"
  },
  "ui.weekSelection": {
    "es": "Seleccion de semana",
    "en": "Week selection"
  },
  "ui.editableCalendarWeekSelection": {
    "es": "Seleccion de semana editable",
    "en": "Editable calendar week selection"
  },
  "ui.selectAStudent": {
    "es": "Selecciona alumno",
    "en": "Select a student"
  },
  "ui.selectADay": {
    "es": "Selecciona día",
    "en": "Select a day"
  },
  "ui.currentWeek": {
    "es": "Semana actual",
    "en": "Current week"
  },
  "ui.previousWeek": {
    "es": "Semana anterior",
    "en": "Previous week"
  },
  "ui.nextWeek": {
    "es": "Semana siguiente",
    "en": "Next week"
  },
  "ui.noStudentSelected": {
    "es": "Sin alumno seleccionado.",
    "en": "No student selected."
  },
  "ui.topicsCovered": {
    "es": "Temario dado",
    "en": "Topics covered"
  },
  "ui.work": {
    "es": "Trabajo.",
    "en": "Work."
  },
  "ui.studentUsername": {
    "es": "Usuario del alumno",
    "en": "Student username"
  },
  "ui.previewOfTheMaterialSharedByYourTeacher": {
    "es": "Vista previa del material compartido por el profesor.",
    "en": "Preview of the material shared by your teacher."
  },
  "ui.protectedPreviewMaterialIsDisplayedWithinTheWebsite": {
    "es": "Vista previa protegida: el material se muestra dentro de la web.",
    "en": "Protected preview: material is displayed within the website."
  },
  "ui.classPDFViewer": {
    "es": "Visualizador PDF de la clase",
    "en": "Class PDF viewer"
  },
  "ui.alreadyHaveAnAccount": {
    "es": "¿Ya tienes cuenta?",
    "en": "Already have an account?"
  },
  "ui.signingIn": {
    "es": "Comprobando acceso...",
    "en": "Signing in..."
  },
  "ui.incorrectEmailOrPassword": {
    "es": "Correo electrónico o contraseña incorrectos.",
    "en": "Incorrect email or password."
  },
  "ui.error": {
    "es": "Error: ",
    "en": "Error: "
  },
  "ui.passwordsDoNotMatch": {
    "es": "Las contraseñas no coinciden.",
    "en": "Passwords do not match."
  },
  "ui.creatingAccount": {
    "es": "Creando cuenta...",
    "en": "Creating account..."
  },
  "ui.unableToCreateTheAccount": {
    "es": "No se ha podido crear la cuenta.",
    "en": "Unable to create the account."
  },
  "ui.accountCreatedCheckYourEmailToConfirmYourAccount": {
    "es": "Cuenta creada. Revisa tu correo electrónico para confirmar el acceso.",
    "en": "Account created. Check your email to confirm your account."
  },
  "ui.accountCreatedButTheProfileCouldNotBeLoaded": {
    "es": "Cuenta creada, pero no se ha podido cargar el perfil.",
    "en": "Account created, but the profile could not be loaded."
  },
  "ui.sendingEmail": {
    "es": "Enviando correo...",
    "en": "Sending email..."
  },
  "ui.unableToSendThePasswordResetEmail": {
    "es": "No se ha podido enviar el correo de recuperación.",
    "en": "Unable to send the password reset email."
  },
  "ui.ifThisEmailIsRegisteredYouWillReceiveALinkToResetYourPassword": {
    "es": "Si el correo está registrado, recibirás un enlace para modificar la contraseña.",
    "en": "If this email is registered, you will receive a link to reset your password."
  },
  "ui.updatingPassword": {
    "es": "Actualizando contraseña...",
    "en": "Updating password..."
  },
  "ui.unableToUpdateThePassword": {
    "es": "No se ha podido actualizar la contraseña.",
    "en": "Unable to update the password."
  },
  "ui.passwordUpdatedYouCanNowSignIn": {
    "es": "Contraseña actualizada. Ya puedes entrar.",
    "en": "Password updated. You can now sign in."
  },
  "ui.yourClassesHaveLoadedButThePDFMaterialsCouldNotBeLoaded": {
    "es": "Tus clases se han cargado, pero no se han podido cargar los materiales PDF.",
    "en": "Your classes have loaded, but the PDF materials could not be loaded."
  },
  "ui.studentIsNotSignedIn": {
    "es": "Alumno no autenticado.",
    "en": "Student is not signed in."
  },
  "ui.teachersCannotUseTheStudentProfile": {
    "es": "El profesor no puede usar el perfil de alumno.",
    "en": "Teachers cannot use the student profile."
  },
  "ui.studentProfileAccessDenied": {
    "es": "Perfil de alumno no autorizado.",
    "en": "Student profile access denied."
  },
  "ui.yourAccountIsNotLinkedToAStudentRecordYet": {
    "es": "Tu cuenta no tiene un alumno académico vinculado todavía.",
    "en": "Your account is not linked to a student record yet."
  },
  "ui.unableToLoadYourLinkedStudentRecord": {
    "es": "No se ha podido cargar tu alumno académico vinculado.",
    "en": "Unable to load your linked student record."
  },
  "ui.unableToLoadYourClasses": {
    "es": "No se han podido cargar tus clases.",
    "en": "Unable to load your classes."
  },
  "ui.thisMaterialHasNoAssociatedPDFFile": {
    "es": "Este material no tiene un archivo PDF asociado.",
    "en": "This material has no associated PDF file."
  },
  "ui.unableToOpenThePDFForThisClass": {
    "es": "No se ha podido abrir el PDF de esta clase.",
    "en": "Unable to open the PDF for this class."
  },
  "ui.joinCLASS": {
    "es": "ENTRAR A CLASE",
    "en": "JOIN CLASS"
  },
  "ui.noDate": {
    "es": "Sin fecha",
    "en": "No date"
  },
  "ui.thereAreNoNotesForThisClass": {
    "es": "No hay notas para esta clase.",
    "en": "There are no notes for this class."
  },
  "ui.thereAreNoMaterialsAttachedToThisClass": {
    "es": "No hay materiales adjuntos para esta clase.",
    "en": "There are no materials attached to this class."
  },
  "ui.youHaveNoCompletedClassesYet": {
    "es": "Todavía no tienes clases dadas.",
    "en": "You have no completed classes yet."
  },
  "ui.viewPDF": {
    "es": "Ver PDF",
    "en": "View PDF"
  },
  "ui.pdfMaterial": {
    "es": "Material PDF:",
    "en": "PDF material:"
  },
  "ui.notes": {
    "es": "Notas:",
    "en": "Notes:"
  },
  "ui.classNotes": {
    "es": "Notas de la clase:",
    "en": "Class notes:"
  },
  "ui.noNotesRecorded": {
    "es": "Sin notas registradas.",
    "en": "No notes recorded."
  },
  "ui.date": {
    "es": "Fecha:",
    "en": "Date:"
  },
  "ui.startTimec2af": {
    "es": "Hora de inicio:",
    "en": "Start time:"
  },
  "ui.endTime4a7a": {
    "es": "Hora de fin:",
    "en": "End time:"
  },
  "ui.teacherAccessDenied": {
    "es": "Acceso de profesor no autorizado.",
    "en": "Teacher access denied."
  },
  "ui.accessCreated": {
    "es": "Acceso creado.",
    "en": "Access created."
  },
  "ui.noAccess": {
    "es": "Sin acceso.",
    "en": "No access."
  },
  "ui.changePassword": {
    "es": "Cambiar contraseña",
    "en": "Change password"
  },
  "ui.preparingPDF": {
    "es": "Preparando PDF...",
    "en": "Preparing PDF..."
  },
  "ui.unableToOpenThePDF": {
    "es": "No se ha podido abrir el PDF.",
    "en": "Unable to open the PDF."
  },
  "ui.unavailableTimeSlot": {
    "es": "Hueco no disponible",
    "en": "Unavailable time slot"
  },
  "ui.noEmail": {
    "es": "Sin correo",
    "en": "No email"
  },
  "ui.unableToLoadClasses": {
    "es": "No se han podido cargar las clases.",
    "en": "Unable to load classes."
  },
  "ui.youHaveNoClassesScheduledForToday": {
    "es": "No tienes clases asignadas para hoy.",
    "en": "You have no classes scheduled for today."
  },
  "ui.unableToLoadStudentsFromSupabase": {
    "es": "No se han podido cargar los alumnos desde Supabase.",
    "en": "Unable to load students from Supabase."
  },
  "ui.unableToLoadClassesFromSupabase": {
    "es": "No se han podido cargar las clases desde Supabase.",
    "en": "Unable to load classes from Supabase."
  },
  "ui.thereAreNoEnrolledStudentsYet": {
    "es": "Todavía no hay alumnos inscritos.",
    "en": "There are no enrolled students yet."
  },
  "ui.deletePDF": {
    "es": "Eliminar PDF",
    "en": "Delete PDF"
  },
  "ui.noPDFUploaded": {
    "es": "Sin PDF subido",
    "en": "No PDF uploaded"
  },
  "ui.notesOrPDFExercises": {
    "es": "Notas o ejercicios PDF",
    "en": "Notes or PDF exercises"
  },
  "ui.uploadPDF": {
    "es": "Subir PDF",
    "en": "Upload PDF"
  },
  "ui.accessCreated5f3d": {
    "es": "Acceso creado",
    "en": "Access created"
  },
  "ui.noAccessa78a": {
    "es": "Sin acceso",
    "en": "No access"
  },
  "ui.editStudent": {
    "es": "Editar alumno",
    "en": "Edit student"
  },
  "ui.youCanChangeTheExactTimeOrRemoveThisTimeSlotFromTheCalendar": {
    "es": "Puedes actualizar la hora exacta o retirar este tramo del calendario.",
    "en": "You can change the exact time or remove this time slot from the calendar."
  },
  "ui.chooseARegisteredStudentOrAnUnavailableTimeSlotAndSetTheExactTime": {
    "es": "Elige un alumno registrado o un hueco no disponible y ajusta el horario exacto.",
    "en": "Choose a registered student or an unavailable time slot and set the exact time."
  },
  "ui.timeSlotSelected": {
    "es": "Tramo seleccionado.",
    "en": "Time slot selected."
  },
  "ui.selectARegisteredStudentFirst": {
    "es": "Selecciona primero el alumno registrado.",
    "en": "Select a registered student first."
  },
  "ui.selectTheClassDayFirst": {
    "es": "Selecciona primero el día de la clase.",
    "en": "Select the class day first."
  },
  "ui.theEndTimeMustBeLaterThanTheStartTime": {
    "es": "La hora de fin tiene que ser posterior a la hora de inicio.",
    "en": "The end time must be later than the start time."
  },
  "ui.firstSelectAnAssignedClassHighlightedInYellow": {
    "es": "Selecciona primero una clase asignada en amarillo.",
    "en": "First select an assigned class highlighted in yellow."
  },
  "ui.selectARegisteredStudentBeforeSchedulingAClass": {
    "es": "Selecciona un alumno registrado antes de asignar una clase.",
    "en": "Select a registered student before scheduling a class."
  },
  "ui.studentDetailsAreMissing": {
    "es": "Faltan los datos del alumno.",
    "en": "Student details are missing."
  },
  "ui.unableToRemoveTheTimeSlot": {
    "es": "No se ha podido retirar el tramo.",
    "en": "Unable to remove the time slot."
  },
  "ui.errorRemovingTheTimeSlot": {
    "es": "Error al retirar el tramo.",
    "en": "Error removing the time slot."
  },
  "ui.unavailableTimeSlotRemovedFromTheCalendar": {
    "es": "Hueco no disponible retirado del calendario.",
    "en": "Unavailable time slot removed from the calendar."
  },
  "ui.classRemovedFromTheStudentProfile": {
    "es": "Clase retirada del perfil del alumno.",
    "en": "Class removed from the student profile."
  },
  "ui.timeSlotRemoved": {
    "es": "Tramo retirado.",
    "en": "Time slot removed."
  },
  "ui.thisTimeSlotAlreadyHasAStudent": {
    "es": "Ese hueco ya tiene alumno.",
    "en": "This time slot already has a student."
  },
  "ui.unableToUpdateTheTimeSlot": {
    "es": "No se ha podido actualizar el tramo.",
    "en": "Unable to update the time slot."
  },
  "ui.errorUpdatingTheTimeSlot": {
    "es": "Error al actualizar el tramo.",
    "en": "Error updating the time slot."
  },
  "ui.unavailableTimeSlotUpdated": {
    "es": "Hueco no disponible actualizado.",
    "en": "Unavailable time slot updated."
  },
  "ui.classUpdatedInTheStudentProfile": {
    "es": "Clase actualizada en el perfil del alumno.",
    "en": "Class updated in the student profile."
  },
  "ui.timeSlotUpdated": {
    "es": "Tramo actualizado.",
    "en": "Time slot updated."
  },
  "ui.unableToSaveTheTimeSlot": {
    "es": "No se ha podido guardar el tramo.",
    "en": "Unable to save the time slot."
  },
  "ui.errorSavingTheTimeSlot": {
    "es": "Error al guardar el tramo.",
    "en": "Error saving the time slot."
  },
  "ui.unavailableTimeSlotAddedToTheCalendar": {
    "es": "Hueco no disponible añadido al calendario.",
    "en": "Unavailable time slot added to the calendar."
  },
  "ui.classScheduledInTheStudentProfile": {
    "es": "Clase asignada al perfil del alumno.",
    "en": "Class scheduled in the student profile."
  },
  "ui.timeSlotSaved": {
    "es": "Tramo guardado.",
    "en": "Time slot saved."
  },
  "ui.unableToReloadTheStudentList": {
    "es": "No se ha podido recargar la lista de alumnos.",
    "en": "Unable to reload the student list."
  },
  "ui.unableToReloadClasses": {
    "es": "No se han podido recargar las clases.",
    "en": "Unable to reload classes."
  },
  "ui.enterAtLeastAFirstNameAndUsernameToSaveTheStudent": {
    "es": "Añade al menos nombre y usuario para guardar el alumno.",
    "en": "Enter at least a first name and username to save the student."
  },
  "ui.updatingStudent": {
    "es": "Actualizando alumno...",
    "en": "Updating student..."
  },
  "ui.creatingStudent": {
    "es": "Creando alumno...",
    "en": "Creating student..."
  },
  "ui.studentUpdatedSuccessfully": {
    "es": "Alumno actualizado correctamente.",
    "en": "Student updated successfully."
  },
  "ui.studentCreatedSuccessfully": {
    "es": "Alumno creado correctamente.",
    "en": "Student created successfully."
  },
  "ui.unableToSaveTheStudent": {
    "es": "No se ha podido guardar el alumno.",
    "en": "Unable to save the student."
  },
  "ui.loadOrSaveAStudentBeforeSavingTheirClassLink": {
    "es": "Carga o guarda primero un alumno para guardar su enlace de clase.",
    "en": "Load or save a student before saving their class link."
  },
  "ui.savingClassLink": {
    "es": "Guardando enlace de clase...",
    "en": "Saving class link..."
  },
  "ui.classLinkSaved": {
    "es": "Enlace de clase guardado.",
    "en": "Class link saved."
  },
  "ui.unableToSaveTheClassLink": {
    "es": "No se ha podido guardar el enlace de clase.",
    "en": "Unable to save the class link."
  },
  "ui.loadOrSaveAStudentBeforeCreatingTheirAccess": {
    "es": "Carga o guarda primero un alumno para crear su acceso.",
    "en": "Load or save a student before creating their access."
  },
  "ui.thePasswordMustContainAtLeast8Characters": {
    "es": "La contraseña debe tener al menos 8 caracteres.",
    "en": "The password must contain at least 8 characters."
  },
  "ui.changingPassword": {
    "es": "Cambiando contraseña...",
    "en": "Changing password..."
  },
  "ui.creatingStudentAccess": {
    "es": "Creando acceso del alumno...",
    "en": "Creating student access..."
  },
  "ui.unableToChangeThePassword": {
    "es": "No se ha podido cambiar la contraseña.",
    "en": "Unable to change the password."
  },
  "ui.passwordUpdatedSuccessfully": {
    "es": "Contraseña actualizada correctamente.",
    "en": "Password updated successfully."
  },
  "ui.enterAnEmailUsernameAndPasswordToCreateAccess": {
    "es": "Añade correo, usuario y contraseña para crear el acceso.",
    "en": "Enter an email, username and password to create access."
  },
  "ui.theTeacherSessionIsUnavailablePleaseSignInAgain": {
    "es": "La sesión del profesor no está disponible. Vuelve a iniciar sesión.",
    "en": "The teacher session is unavailable. Please sign in again."
  },
  "ui.unableToCreateAccess": {
    "es": "No se ha podido crear el acceso.",
    "en": "Unable to create access."
  },
  "ui.accessCreatedSuccessfully": {
    "es": "Acceso creado correctamente.",
    "en": "Access created successfully."
  },
  "ui.unableToSaveAccess": {
    "es": "No se ha podido guardar el acceso.",
    "en": "Unable to save access."
  },
  "ui.loadAStudentBeforeDeletingThem": {
    "es": "Carga primero un alumno para eliminarlo.",
    "en": "Load a student before deleting them."
  },
  "ui.deletingStudent": {
    "es": "Eliminando alumno...",
    "en": "Deleting student..."
  },
  "ui.unableToDeleteTheStudent": {
    "es": "No se ha podido eliminar el alumno.",
    "en": "Unable to delete the student."
  },
  "ui.studentDeletedSuccessfully": {
    "es": "Alumno eliminado correctamente.",
    "en": "Student deleted successfully."
  },
  "ui.thePDFToDeleteCouldNotBeFound": {
    "es": "No se ha encontrado el PDF para eliminarlo.",
    "en": "The PDF to delete could not be found."
  },
  "ui.deletingPDF": {
    "es": "Eliminando PDF...",
    "en": "Deleting PDF..."
  },
  "ui.unableToDeleteThePDFFile": {
    "es": "No se ha podido eliminar el archivo PDF.",
    "en": "Unable to delete the PDF file."
  },
  "ui.unableToDeleteThePDFMetadata": {
    "es": "No se ha podido eliminar la información del PDF.",
    "en": "Unable to delete the PDF metadata."
  },
  "ui.pdfDeletedSuccessfully": {
    "es": "PDF eliminado correctamente.",
    "en": "PDF deleted successfully."
  },
  "ui.studentLoadedYouCanUpdateTheirAcademicDetails": {
    "es": "Alumno cargado. Puedes actualizar sus datos académicos.",
    "en": "Student loaded. You can update their academic details."
  },
  "ui.onlyPDFFilesCanBeUploaded": {
    "es": "Solo puedes subir archivos PDF.",
    "en": "Only PDF files can be uploaded."
  },
  "ui.theClassForThisPDFCouldNotBeFound": {
    "es": "No se ha encontrado la clase para guardar el PDF.",
    "en": "The class for this PDF could not be found."
  },
  "ui.uploadingPDF": {
    "es": "Subiendo PDF...",
    "en": "Uploading PDF..."
  },
  "ui.unableToUploadThePDF": {
    "es": "No se ha podido subir el PDF.",
    "en": "Unable to upload the PDF."
  },
  "ui.unableToSaveThePDFMetadata": {
    "es": "No se ha podido guardar la información del PDF.",
    "en": "Unable to save the PDF metadata."
  },
  "ui.pdfSavedAndReadyToViewOnTheWebsite": {
    "es": "PDF guardado para visualizarlo desde la web.",
    "en": "PDF saved and ready to view on the website."
  },
  "ui.monday": {
    "es": "Lunes",
    "en": "Monday"
  },
  "ui.tuesday": {
    "es": "Martes",
    "en": "Tuesday"
  },
  "ui.wednesday": {
    "es": "Miercoles",
    "en": "Wednesday"
  },
  "ui.thursday": {
    "es": "Jueves",
    "en": "Thursday"
  },
  "ui.friday": {
    "es": "Viernes",
    "en": "Friday"
  },
  "ui.sapheScienceOffersOnlineMathematicsAndPhysicsClassesInSpanishForESOSecondaryEducationAndBachilleratoUpperSecondaryEducation": {
    "es": "Saphe sCience ofrece clases online de matematicas y fisica en castellano para ESO y Bachillerato.",
    "en": "Saphe Science offers online mathematics and physics classes in Spanish for ESO (secondary education) and Bachillerato (upper secondary education)."
  },
  "ui.sapheScienceStudentProfileForManagingDetailsAndBookingClasses": {
    "es": "Perfil de alumno de Saphe sCience para guardar datos e inscribirse a clases.",
    "en": "Saphe Science student profile for managing details and booking classes."
  },
  "ui.sapheScienceTeacherDashboardForSchedulingStudentClasses": {
    "es": "Perfil del profesor de Saphe sCience para asignar clases a alumnos.",
    "en": "Saphe Science teacher dashboard for scheduling student classes."
  },
  "today": {
    "es": "Hoy es {date}.",
    "en": "Today is {date}."
  },
  "nextClass": {
    "es": "Tu próxima clase es el {date} de {start} a {end}.",
    "en": "Your next class is on {date}, from {start} to {end}."
  },
  "noNextClass": {
    "es": "Tu próxima clase todavía no está asignada.",
    "en": "Your next class has not been scheduled yet."
  },
  "signupQuestion": {
    "es": "{name}, ¿a qué clase te vas a inscribir?",
    "en": "{name}, which class would you like to book?"
  },
  "unavailableAria": {
    "es": "No disponible el {date} de {start} a {end}",
    "en": "Unavailable on {date}, from {start} to {end}"
  },
  "assignedAria": {
    "es": "{subject} asignada el {date} de {start} a {end}",
    "en": "{subject} scheduled on {date}, from {start} to {end}"
  },
  "teacherClassAria": {
    "es": "{name}: {subject} el {date} de {start} a {end}",
    "en": "{name}: {subject} on {date}, from {start} to {end}"
  },
  "timeAria": {
    "es": "{date} a las {time}",
    "en": "{date} at {time}"
  },
  "slotSummary": {
    "es": "{subject}: {date} de {start} a {end}.",
    "en": "{subject}: {date}, from {start} to {end}."
  },
  "occupied": {
    "es": "Ese hueco ya está asignado a {name}.",
    "en": "This time slot is already assigned to {name}."
  },
  "deleteStudentConfirm": {
    "es": "¿Seguro que quieres eliminar a {name}? Se eliminarán sus clases, notas y materiales asociados. Esta acción no se puede deshacer.",
    "en": "Are you sure you want to delete {name}? Their classes, notes and associated materials will also be deleted. This action cannot be undone."
  },
  "selectedStudent": {
    "es": "Seleccionado: {name}.",
    "en": "Selected: {name}."
  },
  "classCountOne": {
    "es": "{count} clase",
    "en": "{count} class"
  },
  "classCountMany": {
    "es": "{count} clases",
    "en": "{count} classes"
  },
  "enrolledOne": {
    "es": "{count} clase inscrita",
    "en": "{count} enrolled class"
  },
  "enrolledMany": {
    "es": "{count} clases inscritas",
    "en": "{count} enrolled classes"
  },
  "hourOne": {
    "es": "{count} hora",
    "en": "{count} hour"
  },
  "hourMany": {
    "es": "{count} horas",
    "en": "{count} hours"
  },
  "durationTaught": {
    "es": "{duration} dadas",
    "en": "{duration} taught"
  },
  "errors.credentials": {
    "es": "Correo electrónico o contraseña incorrectos.",
    "en": "Incorrect email or password."
  },
  "errors.exists": {
    "es": "Ya existe una cuenta con este correo electrónico.",
    "en": "An account with this email already exists."
  },
  "errors.password": {
    "es": "La contraseña no cumple los requisitos de seguridad.",
    "en": "The password does not meet the security requirements."
  },
  "errors.confirmEmail": {
    "es": "Confirma tu correo electrónico antes de iniciar sesión.",
    "en": "Confirm your email before signing in."
  },
  "errors.rateLimit": {
    "es": "Demasiados intentos. Espera un momento y vuelve a intentarlo.",
    "en": "Too many attempts. Please wait and try again."
  },
  "errors.permission": {
    "es": "No tienes permiso para realizar esta operación. Comprueba tu sesión.",
    "en": "You do not have permission to perform this operation. Check your session."
  },
  "errors.connection": {
    "es": "No se ha podido conectar. Comprueba tu conexión y vuelve a intentarlo.",
    "en": "Unable to connect. Check your connection and try again."
  },
  "errors.profile": {
    "es": "No se ha podido cargar el perfil del usuario.",
    "en": "Unable to load the user profile."
  },
  "validation.required": {
    "es": "Completa este campo.",
    "en": "Please fill in this field."
  },
  "validation.email": {
    "es": "Introduce un correo electrónico válido.",
    "en": "Enter a valid email address."
  },
  "validation.url": {
    "es": "Introduce una URL válida.",
    "en": "Enter a valid URL."
  },
  "validation.value": {
    "es": "Comprueba el valor de este campo.",
    "en": "Check the value in this field."
  },
  "tabs.physicsEn": {
    "es": "Física EN",
    "en": "Physics EN"
  },
  "tabs.calculusEn": {
    "es": "Cálculo EN",
    "en": "Calculus EN"
  },
  "language.english": {
    "es": "Inglés",
    "en": "English"
  }
};
  const preferenceKey = 'sapheScienceLanguage';
  let language = 'es';
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === 'en' || saved === 'es') language = saved;
  } catch { /* Language selection also works without browser storage. */ }
  const listeners = new Set();
  const bindings = new Map();

  function t(key, values = {}) {
    const entry = messages[key];
    if (!entry) throw new Error(`Missing translation: ${key}`);
    const value = entry[language];
    if (Array.isArray(value)) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(values, name) ? String(values[name]) : match);
  }

  function locale() {
    return language === 'en' ? 'en-GB' : 'es-ES';
  }

  function setContent(element, render, property) {
    if (!element) return;
    element.removeAttribute('data-i18n');
    bindings.set(element, {render, property});
    element[property] = render();
  }

  function setText(element, render) {
    setContent(element, render, 'textContent');
  }

  function setHTML(element, render) {
    setContent(element, render, 'innerHTML');
  }

  function translatePage() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n);
    });
    for (const attribute of ['placeholder', 'title', 'alt', 'aria-label', 'content']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    }
    document.querySelectorAll('[data-lang]').forEach(button => {
      const active = button.dataset.lang === language;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setLanguage(nextLanguage) {
    if (nextLanguage !== 'es' && nextLanguage !== 'en') return;
    language = nextLanguage;
    try { localStorage.setItem(preferenceKey, language); } catch { /* Optional persistence. */ }
    translatePage();
    listeners.forEach(render => render());
    bindings.forEach(({render, property}, element) => {
      if (element.isConnected) element[property] = render();
      else bindings.delete(element);
    });
    document.querySelectorAll('input, select, textarea').forEach(input => input.setCustomValidity(''));
  }

  function onLanguageChange(render) {
    listeners.add(render);
    return () => listeners.delete(render);
  }

  function subjectLabel(key) {
    return messages[`subjects.${key}`] ? t(`subjects.${key}`) : undefined;
  }

  // Only predefined service errors are translated. User content is never matched.
  function errorText(error, fallback) {
    const message = typeof error === 'string' ? error : error?.message || '';
    const known = Object.values(messages).find(entry => entry.es === message || entry.en === message);
    if (known) return known[language];
    const code = String(error?.code || '').toLowerCase();
    const normalized = message.toLowerCase();
    if (/invalid_credentials|invalid_grant/.test(code) || normalized.includes('invalid login credentials')) return t('errors.credentials');
    if (/email_exists|user_already_exists/.test(code) || /already (registered|exists)/.test(normalized)) return t('errors.exists');
    if (/weak_password/.test(code)) return t('errors.password');
    if (/email_not_confirmed/.test(code)) return t('errors.confirmEmail');
    if (/rate_limit|over_.*limit/.test(code)) return t('errors.rateLimit');
    if (/42501|403|unauthorized/.test(code) || /permission denied|row-level security|usuario no autenticado|not authenticated/.test(normalized)) return t('errors.permission');
    if (/failed to fetch|network|fetch failed/.test(normalized)) return t('errors.connection');
    return fallback;
  }

  window.SapheI18n = { t, locale, setLanguage, onLanguageChange, setText, setHTML, subjectLabel, errorText, getLanguage: () => language };

  document.querySelectorAll('.lang-switch').forEach((control, index) => {
    const toggle = control.querySelector('.lang-toggle');
    let menu = control.querySelector('.lang-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'lang-menu';
      for (const [code, label] of [['es', 'Castellano'], ['en', 'English']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lang-button';
        button.dataset.lang = code;
        button.textContent = label;
        menu.appendChild(button);
      }
      control.appendChild(menu);
    }
    menu.id = `language-menu-${index}`;
    menu.querySelectorAll('[data-lang]').forEach(button => {
      button.dataset.i18n = button.dataset.lang === 'es' ? 'ui.spanish' : 'language.english';
    });
    menu.hidden = true;
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    const close = () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      toggle.setAttribute('aria-expanded', String(!menu.hidden));
    });
    menu.querySelectorAll('[data-lang]').forEach(button => {
      button.addEventListener('click', () => { setLanguage(button.dataset.lang); close(); });
    });
    document.addEventListener('click', event => { if (!control.contains(event.target)) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  });

  document.addEventListener('input', event => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
  });
  document.addEventListener('invalid', event => {
    const input = event.target;
    input.setCustomValidity('');
    const validity = input.validity;
    if (validity.valueMissing) input.setCustomValidity(t('validation.required'));
    else if (validity.typeMismatch) input.setCustomValidity(t(input.type === 'url' ? 'validation.url' : 'validation.email'));
    else if (!validity.valid) input.setCustomValidity(t('validation.value'));
  }, true);
  translatePage();
})();
