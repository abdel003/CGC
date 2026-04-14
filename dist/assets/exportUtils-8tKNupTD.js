import{h as $}from"./export-vendor-5LxaG7pp.js";import"./charts-vendor-Dnsow9QC.js";import"./react-vendor-cGAtrOQN.js";const l=o=>`B/. ${o.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,m=o=>{const e=new Date(o+"T12:00:00"),n=["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];return`${e.getDate().toString().padStart(2,"0")} DE ${n[e.getMonth()]}`},k=(o,e,n,c)=>{const r=Array.from(new Set(o.flatMap(t=>t.deduccionesDetalle.map(a=>a.nombre)))),g=c?c.toUpperCase():"TODOS LOS PROYECTOS",y=m(e),p=m(n),b=6;b+r.length+4;let h=`
    <table border="1">
      <thead>
        <tr>
          <th colspan="${b}" style="text-align: left; background-color: #f3f4f6; font-weight: bold;">
            PROYECTO ${g}, COMPRENDE DE ${y} A ${p}
          </th>
          ${r.map(t=>`
            <th style="background-color: #f3f4f6; font-weight: bold;">${t.toUpperCase()}</th>
          `).join("")}
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
          ${r.map(t=>{var d;const a=(d=o.find(f=>f.deduccionesDetalle.some(i=>i.nombre===t)))==null?void 0:d.deduccionesDetalle.find(f=>f.nombre===t);return`<th style="background-color: #ffffff; font-weight: normal; font-size: 10px;">${a?a.tipo==="porcentaje"?`${a.valor}%`:l(a.valor):""}</th>`}).join("")}
          <th style="background-color: #ffffff;"></th>
          <th style="background-color: #ffffff;"></th>
          <th style="background-color: #ffffff;"></th>
          <th style="background-color: #ffffff;"></th>
        </tr>
      </thead>
      <tbody>
  `;o.forEach(t=>{const a=t.trabajador.salarioHora,u=t.deducciones+(t.isr||0);h+=`
      <tr>
        <td>${t.trabajador.cedula}</td>
        <td>${t.proyectoNombre||"SIN PROYECTO"}</td>
        <td>${t.trabajador.nombre.toUpperCase()}</td>
        <td style="text-align: center;">${t.diasTrabajados*8}</td>
        <td style="text-align: right;">${l(a)}</td>
        <td style="text-align: right;">${l(t.salarioBase)}</td>
        ${r.map(d=>{var i;const f=((i=t.deduccionesDetalle.find(R=>R.nombre===d))==null?void 0:i.monto)||0;return`<td style="text-align: right;">${f>0?l(f):""}</td>`}).join("")}
        <td style="text-align: right; font-weight: bold;">${l(u)}</td>
        <td style="text-align: right; font-weight: bold;">${l(t.totalPagado)}</td>
        <td style="text-align: center;">${t.horasExtraTotal}</td>
        <td style="text-align: right;">${l(t.pagoHorasExtra)}</td>
      </tr>
    `}),h+=`
      </tbody>
    </table>
  `;const O=new Blob([h],{type:"application/vnd.ms-excel"}),E=URL.createObjectURL(O),s=document.createElement("a");s.href=E,s.download=`Planilla_${g.replace(/\s/g,"_")}_${e}.xls`,document.body.appendChild(s),s.click(),document.body.removeChild(s)},w=async o=>{try{const e=await $(o,{scale:2,useCORS:!0,backgroundColor:"#ffffff"});return new Promise(n=>{e.toBlob(c=>n(c),"image/png")})}catch(e){return console.error("Error capturing receipt:",e),null}},x=async(o,e)=>{const n=await o.generateAsync({type:"blob"}),c=URL.createObjectURL(n),r=document.createElement("a");r.href=c,r.download=e,document.body.appendChild(r),r.click(),document.body.removeChild(r)};export{w as captureElementAsPng,x as downloadZip,k as exportPayrollToExcel,l as formatBalboa};
