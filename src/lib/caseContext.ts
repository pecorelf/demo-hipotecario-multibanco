import { getCustomer, getExecutive } from '@/data/mock';
import type { Case, Communication } from '@/types';
import type { DerivationRecord } from '@/store/appStore';
import { formatCLP, formatPct, formatUF, formatDateCL, formatDateTimeCL } from './format';

const STAGE_DESC: Record<Case['stage'], string> = {
  solicitud: 'Evaluación (en revisión inicial)',
  documentos: 'Documentación (rescate y validación de datos)',
  evaluacion: 'Estudio de títulos (comité y análisis de riesgo)',
  resolucion: 'Escritura y firma (cierre y entrega)',
};

export interface CaseContextInput {
  c: Case;
  comms?: Communication[];
  derivation?: DerivationRecord | null;
}

export function buildCaseContext({ c, comms = [], derivation = null }: CaseContextInput): string {
  const customer = getCustomer(c.customerId);
  const coTitular = c.coTitularId ? getCustomer(c.coTitularId) : null;
  const exec = getExecutive(c.executiveId);

  const titularLine = customer
    ? `Titular: ${customer.fullName} (RUT ${customer.rut}, ${customer.employment.kind}${customer.employment.employer ? ' · ' + customer.employment.employer : ''}${customer.employment.position ? ' · ' + customer.employment.position : ''}, renta líquida declarada ${formatCLP(customer.employment.netMonthlyCLP)}${customer.employment.tenureMonths ? ' · antigüedad ' + Math.floor(customer.employment.tenureMonths / 12) + ' años' : ''})`
    : `Titular: ${c.customerId}`;

  const coTitularLine = coTitular
    ? `Co-titular: ${coTitular.fullName} (${coTitular.employment.kind}${coTitular.employment.position ? ' · ' + coTitular.employment.position : ''}, ingreso ${formatCLP(coTitular.employment.netMonthlyCLP)}${coTitular.employment.variabilityNote ? ' · ' + coTitular.employment.variabilityNote : ''})`
    : '';

  const operationLine = `Operación: ${formatUF(c.requestedUF)} solicitados, pie ${formatUF(c.downPaymentUF)} (${Math.round((c.downPaymentUF / c.property.valueUF) * 100)}%), plazo ${c.termYears} años, tasa ${formatPct(c.annualRate)}`;

  const propertyLine = `Propiedad: ${c.property.type} en ${c.property.address}, ${c.property.commune} (valor ${formatUF(c.property.valueUF)})${c.property.developer ? ', vendedor ' + c.property.developer : ''}`;

  const promesaLine = c.promesa
    ? `Promesa: firmada ${formatDateCL(c.promesa.signedAt)} por ${formatUF(c.promesa.amountUF)}${c.promesa.notary ? ' · ' + c.promesa.notary : ''}`
    : 'Promesa: aún no firmada';

  // Cruce Previred si está en algún doc
  const previredDoc = c.documents.find((d) => d.kind === 'previred');
  const previredAvg = previredDoc?.extractedData?.promedioCotizadoCLP as number | undefined;
  const previredLine = previredAvg
    ? `Cruce con Previred (${previredDoc?.extractedData?.mesesCotizados ?? 12} meses): promedio cotizado ${formatCLP(previredAvg)}`
    : '';

  const docsBlock = c.documents.length
    ? `Documentos del caso (${c.documents.filter((d) => d.status === 'validado').length}/${c.documents.length} validados):\n` +
      c.documents.map((d) => `  - [${d.status}] ${d.label}`).join('\n')
    : '';

  const timelineBlock = c.timeline.length
    ? `Últimos eventos del timeline (orden cronológico, los 6 más recientes):\n` +
      c.timeline
        .slice(-6)
        .map(
          (e) =>
            `  - [${formatDateTimeCL(e.timestamp)}] ${e.actor.kind}${e.actor.name ? ' (' + e.actor.name + ')' : ''} · ${e.type} · ${e.title}${e.detail ? ' — ' + e.detail : ''}`,
        )
        .join('\n')
    : '';

  const commsBlock = comms.length
    ? `Últimas comunicaciones con el cliente (3 más recientes):\n` +
      [...comms]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
        .map((m) => `  - ${m.kind.toUpperCase()} ${formatDateCL(m.date)} · ${m.subject || m.from} · ${m.summary}`)
        .join('\n')
    : '';

  const derivationLine = derivation
    ? `Estado especial: este caso fue derivado al back office el ${formatDateTimeCL(derivation.derivedAt)}. Nota: "${derivation.note}"`
    : '';

  const lines = [
    `Caso #${c.id}`,
    `Etapa actual: ${STAGE_DESC[c.stage]}`,
    titularLine,
    coTitularLine,
    operationLine,
    propertyLine,
    promesaLine,
    previredLine,
    exec ? `Ejecutivo asignado: ${exec.fullName} (${exec.branch})` : '',
    derivationLine,
    '',
    docsBlock,
    '',
    timelineBlock,
    '',
    commsBlock,
  ].filter(Boolean);

  return lines.join('\n');
}
