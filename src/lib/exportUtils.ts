/**
 * Utility to export payroll data in a professional horizontal spreadsheet format.
 */

import { PayrollDetail, PayrollSummary } from "@/types";
import JSZip from "jszip";
import html2canvas from "html2canvas";

export const formatBalboa = (value: number) => {
  return `B/. ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatSpanishDate = (dateStr: string) => {
  const date = new Date(dateStr + "T12:00:00");
  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  return `${date.getDate().toString().padStart(2, '0')} DE ${months[date.getMonth()]}`;
};

export const exportPayrollToExcel = (
  details: PayrollDetail[],
  fechaInicio: string,
  fechaFin: string,
  projectName: string | null
) => {
  // 1. Identify all unique deductions used in the current period
  const allDeductionNames = Array.from(
    new Set(
      details.flatMap((d) => d.deduccionesDetalle.map((ded) => ded.nombre))
    )
  );

  // 2. Build the HTML Table (Better for formatting/merged cells than CSV)
  const headerProject = projectName ? projectName.toUpperCase() : "TODOS LOS PROYECTOS";
  const startStr = formatSpanishDate(fechaInicio);
  const endStr = formatSpanishDate(fechaFin);
  
  // Header title row span: Base cols (6) + Deductions + 4 tailing cols
  const baseCols = 6;
  const tailCols = 4;
  const totalCols = baseCols + allDeductionNames.length + tailCols;

  let html = `
    <table border="1">
      <thead>
        <tr>
          <th colspan="${baseCols}" style="text-align: left; background-color: #f3f4f6; font-weight: bold;">
            PROYECTO ${headerProject}, COMPRENDE DE ${startStr} A ${endStr}
          </th>
          ${allDeductionNames.map(name => `
            <th style="background-color: #f3f4f6; font-weight: bold;">${name.toUpperCase()}</th>
          `).join('')}
          <th style="background-color: #f3f4f6; font-weight: bold;">TOTAL DESCUENTOS</th>
          <th style="background-color: #f3f4f6; font-weight: bold;">TOTAL A COBRAR</th>
          <th style="background-color: #f3f4f6; font-weight: bold;">HORAS EXTRAS</th>
          <th style="background-color: #f3f4f6; font-weight: bold;">TOTAL HORAS EXTRAS</th>
        </tr>
        <tr>
          <th style="background-color: #ffffff;">CEDULA</th>
          <th style="background-color: #ffffff;">PROYECTO</th>
          <th style="background-color: #ffffff;">NOMBRE</th>
          <th style="background-color: #ffffff;">HORAS</th>
          <th style="background-color: #ffffff;">X HORA</th>
          <th style="background-color: #ffffff;">TOTAL</th>
          ${allDeductionNames.map(name => {
            // Try to find the rate/type for this deduction from the first worker that has it
            const sample = details.find(d => d.deduccionesDetalle.some(dd => dd.nombre === name))
              ?.deduccionesDetalle.find(dd => dd.nombre === name);
            const value = sample ? (sample.tipo === 'porcentaje' ? `${sample.valor}%` : formatBalboa(sample.valor)) : '';
            return `<th style="background-color: #ffffff; font-weight: normal; font-size: 10px;">${value}</th>`;
          }).join('')}
          <th style="background-color: #ffffff;"></th>
          <th style="background-color: #ffffff;"></th>
          <th style="background-color: #ffffff;"></th>
          <th style="background-color: #ffffff;"></th>
        </tr>
      </thead>
      <tbody>
  `;

  // 3. Add Worker Rows
  details.forEach((d) => {
    const tarifaHora = d.trabajador.salarioHora;
    // Total discounts includes both dynamic deductions AND ISR
    const totalDescuentos = d.deducciones + (d.isr || 0);

    html += `
      <tr>
        <td>${d.trabajador.cedula}</td>
        <td>${d.proyectoNombre || 'SIN PROYECTO'}</td>
        <td>${d.trabajador.nombre.toUpperCase()}</td>
        <td style="text-align: center;">${d.diasTrabajados * 8}</td>
        <td style="text-align: right;">${formatBalboa(tarifaHora)}</td>
        <td style="text-align: right;">${formatBalboa(d.salarioBase)}</td>
        ${allDeductionNames.map(name => {
          const m = d.deduccionesDetalle.find(dd => dd.nombre === name)?.monto || 0;
          return `<td style="text-align: right;">${m > 0 ? formatBalboa(m) : ''}</td>`;
        }).join('')}
        <td style="text-align: right; font-weight: bold;">${formatBalboa(totalDescuentos)}</td>
        <td style="text-align: right; font-weight: bold;">${formatBalboa(d.totalPagado)}</td>
        <td style="text-align: center;">${d.horasExtraTotal}</td>
        <td style="text-align: right;">${formatBalboa(d.pagoHorasExtra)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  // 4. Create Blob and Download
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Planilla_${headerProject.replace(/\s/g, "_")}_${fechaInicio}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Capture a DOM element as a PNG blob.
 */
export const captureElementAsPng = async (element: HTMLElement): Promise<Blob | null> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } catch (error) {
    console.error("Error capturing receipt:", error);
    return null;
  }
};

/**
 * Download a JSZip instance as a .zip file.
 */
export const downloadZip = async (zip: JSZip, fileName: string) => {
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

