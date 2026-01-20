export function getAppManual() {
    return `
# Beauty App Suite - Manual de Usuario

## 1. Módulo de Ofertas
Permite crear, calcular y gestionar ofertas comerciales para clientes.
- **Creación**: Ir a "Ofertas" > "Nueva Oferta". Se abrirá el editor.
- **Editor**: 
    - Pestaña **Granel**: Definir fórmula y costes de materia prima.
    - Pestaña **Envasado**: Definir materiales de packaging (botellas, etiquetas).
    - Pestaña **Extras**: Añadir manipulados, controles de calidad o transporte.
    - **Configuración Documento**: Icono "Documento" o "Configuración" en la cabecera. Permite definir condiciones de pago, notas y descargar PDF/Word.
- **Estados**: Borrador -> Pendiente de Validar -> Validada -> Enviada -> Adjudicada/Rechazada.

## 2. Módulo de I+D (Fórmulas)
Gestión del repositorio de fórmulas cosméticas.
- **Buscador**: Filtrar por nombre, código o ingredientes.
- **Carga de Trabajo**: Vista calendario para ver proyectos de I+D en curso.

## 3. Módulo de Producción (Planificador)
- **Vista Reactor**: Diagrama de Gantt mostrando la ocupación de los reactores.
- **Bloques**: Cada bloque representa una orden de fabricación.
- **KPIs**: En el Dashboard de Dirección se pueden visualiar las toneladas fabricadas y la eficiencia (OEE).

## 4. CRM (Clientes)
- Gestión de base de datos de clientes, contactos y condiciones comerciales predeterminadas.
- **Briefings**: Herramienta de IA para generar resúmenes de reuniones automáticamente.

## 5. Portal Proveedores
- Gestión de materias primas y homologación de proveedores.
- Semáforo de riesgos para evaluar proveedores críticos.
`;
}
