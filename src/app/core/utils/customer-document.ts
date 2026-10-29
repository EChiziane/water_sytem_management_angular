import type {CompanyProfile} from '../../shared/models/company-profile';
import jsPDF from 'jspdf';
import autoTable, {UserOptions} from 'jspdf-autotable';
import {COMPANY_PROFILE} from '../../shared/config/company-profile';
import type {Customer} from '../../shared/models/WSM/customer';
import type {Payment} from '../../shared/models/WSM/payment';
import {money, paymentDate, paymentMethodLabel, referenceMonths} from '../../shared/utils/payment-presentation';
import {businessTimestamp} from '../../shared/utils/business-date';
import {isOverdueMonth} from '../../shared/utils/billing-recovery';

export function buildCustomerDocument(customer: Customer, payments: Payment[], options: {includeHistory?: boolean; issuedAt?: Date; company?: CompanyProfile} = {}): jsPDF {
  const company = options.company || COMPANY_PROFILE;
  const doc = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  const margin = 14, width = 182;
  const issuedAt = options.issuedAt || new Date();
  const records = [...payments].sort((a,b) => businessTimestamp(b.paymentDate) - businessTimestamp(a.paymentDate));
  const value = (input: unknown) => String(input ?? '').trim() || '-';
  const currency = (input: number) => money(input).replace(/\u00a0|\u202f/g,' ');
  const status = customer.status === 'ATIVO' ? 'Ativo' : customer.status === 'INATIVO' ? 'Inativo' : value(customer.status);
  let y = 15;
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(30,45,60);
  const nameLines=doc.splitTextToSize(company.name,width); doc.text(nameLines,margin,y); y += (nameLines.length-1)*5;
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(85,95,105);
  y += 5;
  for (const line of [company.address, `NUIT: ${company.nuit} | Tel.: ${company.contact} | ${company.email}`]) {
    const lines = doc.splitTextToSize(line,width); doc.text(lines,margin,y); y += lines.length * 3.6;
  }
  y += 3; doc.setDrawColor(160,170,180); doc.line(margin,y,196,y); y += 7;
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(30,45,60); doc.text('FICHA DO CLIENTE',margin,y);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(`Emitido em ${paymentDate(issuedAt)}`,196,y,{align:'right'}); y += 4;

  function table(config: UserOptions): void {
    autoTable(doc, {
      startY: y, margin: {left:margin,right:margin,top:27,bottom:22}, theme:'plain',
      styles:{font:'helvetica',fontSize:8.5,cellPadding:{top:2,right:2,bottom:2,left:0},textColor:[35,49,65],overflow:'linebreak',valign:'top'},
      headStyles:{fontStyle:'bold',fontSize:8,fillColor:[244,246,248],textColor:[55,65,75]},
      rowPageBreak:'avoid', showHead:'everyPage',
      didDrawPage: () => {
        if(doc.getCurrentPageInfo().pageNumber > 1){
          doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(90,100,110);
          doc.text(doc.splitTextToSize(`${company.name} | Ficha do cliente`,140)[0],margin,13);
          doc.text(value(customer.code),196,13,{align:'right'});
          doc.setDrawColor(210,215,220);doc.line(margin,18,196,18);
        }
      }, ...config
    });
    y = (doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY + 5;
  }
  function section(title: string): void {
    if(y > 254){doc.addPage();y=29;}
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(30,45,60);
    doc.text(title,margin,y+3);y+=6;
  }
  const label = (text: string) => ({content:text,styles:{textColor:[100,110,120] as [number,number,number],fontSize:8}});
  section('Identificação e contacto');
  table({columnStyles:{0:{cellWidth:26},1:{cellWidth:65},2:{cellWidth:26},3:{cellWidth:65}},body:[
    [label('Titular'),{content:value(customer.name),colSpan:3,styles:{fontStyle:'bold'}}],
    [label('Código'),value(customer.code),label('Estado'),status],
    [label('Contacto'),value(customer.contact),label('Válvula'),value(customer.valve)],
    [label('Morada'),{content:value(customer.address),colSpan:3}],
    [label('Cliente desde'),{content:paymentDate(customer.createdAt),colSpan:3}]
  ]});
  section('Situação da conta');
  table({columnStyles:{0:{cellWidth:37},1:{cellWidth:54},2:{cellWidth:37},3:{cellWidth:54}},body:[
    [label('Taxa mensal'),currency(customer.monthlyFee),label('Meses vencidos'),value(customer.monthsInDebt || 0)],
    [label('Dívida estimada'),currency((customer.monthsInDebt || 0) * customer.monthlyFee),label('Pagamentos registados'),String(records.length)],
    [label('Último pagamento'),{content:records.length ? paymentDate(records[0].paymentDate) : 'Sem pagamentos',colSpan:3}]
  ]});
  table({body:[[{content:'A dívida apresentada é uma estimativa com base na taxa mensal atual. Este documento é informativo; não substitui uma fatura nem comprova pagamentos.',styles:{fontSize:7.5,textColor:[100,110,120]}}]]});

  if(options.includeHistory){
    const periods = new Map<string,{status:string;receipts:Set<string>}>();
    for(const record of records){
      for(const month of (record.referenceMonth || '').split('|').map(item=>item.trim()).filter(Boolean)){
        const previous = periods.get(month);
        if(previous?.status === 'Pago' && !record.confirmed) continue;
        const receipts = record.confirmed && previous?.status !== 'Pago' ? new Set<string>() : (previous?.receipts || new Set<string>());
        if(record.referenceCode) receipts.add(record.referenceCode);
        periods.set(month,{status:record.confirmed?'Pago':(previous?.status || 'Pagamento pendente'),receipts});
      }
    }
    for(const month of customer.unpaidMonths || []){
      if(periods.get(month)?.status === 'Pago') continue;
      const previous = periods.get(month);
      periods.set(month,{status:isOverdueMonth(month,issuedAt)?'Em dívida':'Pendente',receipts:previous?.receipts || new Set()});
    }
    section('Histórico por período');
    table({head:[['Período','Situação','Referência do pagamento']],columnStyles:{0:{cellWidth:47},1:{cellWidth:33},2:{cellWidth:102}},
      body:periods.size ? [...periods.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([month,record])=>[referenceMonths(month)[0] || month,record.status,[...record.receipts].join('; ') || '-']) : [['-','Sem períodos registados','-']]});
    section('Registo de pagamentos');
    table({head:[['Data','Referência / estado','Períodos','Método','Valor (MT)','Registado por']],
      columnStyles:{0:{cellWidth:21},1:{cellWidth:35},2:{cellWidth:39},3:{cellWidth:25},4:{cellWidth:25,halign:'right'},5:{cellWidth:37}},
      body:records.length ? records.map(record=>[paymentDate(record.paymentDate),`${value(record.referenceCode)}\n${record.confirmed?'Confirmado':'Pendente'}`,
        (record.referenceMonth || '').split('|').map(item=>item.trim()).filter(Boolean).join('; ') || '-',paymentMethodLabel(record.paymentMethod),currency(record.amount).replace(/ MT$/,''),value(record.createdByName)]) : [['-','Sem pagamentos','-','-','-','-']]});
  }
  const pageCount=doc.getNumberOfPages();
  for(let page=1;page<=pageCount;page++){
    doc.setPage(page);doc.setDrawColor(210,215,220);doc.line(margin,279,196,279);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,110,120);
    doc.text('Ficha informativa | '+value(customer.code),margin,284);
    doc.text(`Página ${page} de ${pageCount}`,196,284,{align:'right'});
  }
  return doc;
}
